const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const path = require('node:path')
const os = require('node:os')

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
const meals = [
  { _id: 'meal-a', name: '番茄炒蛋', category: '家常菜', description: '家常味道', tags: [] },
  { _id: 'meal-b', name: '麻婆豆腐', category: '川菜', description: '麻辣鲜香', tags: [] },
  { _id: 'meal-c', name: '清炒青菜', category: '家常菜', description: '清爽', tags: [] }
]
const today = '2026-10-28'
const schedule = { date: today, scheduleExists: true, scheduleVersion: '2026-10-28T08:00:00.000Z', meals: { breakfast: [], lunch: [], dinner: [{ meal: meals[0] }, { meal: meals[2] }] } }
const summary = {
  today, todaySchedule: schedule, todayHints: [],
  week: { days: [{ date: today, meals: schedule.meals }], plannedMeals: 2 },
  partnerWishlist: [{ _id: 'wish-a', title: '麻婆豆腐', mealId: meals[1] }],
  recentPhotos: [], defaultMeals: { imported: 2, total: 2 }, imageIssues: { open: 0 }, meals: { favorites: 0 }
}

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const errors = []
  const writes = []
  const reads = []
  let wishlist = []
  let failSchedule = false
  let conflictSchedule = false
  let dailySchedule = schedule
  let failWeekly = false
  let failShopping = false
  let releaseShoppingUpdate
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') console.error('Browser:', message.text()) })
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户' }))
  })
  await page.route('**/api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/api/, '')
    const method = request.method()
    if (method === 'GET') reads.push(`${path}${url.search}`)
    let data
    if (method === 'GET' && path === '/dashboard/summary') data = summary
    else if (method === 'GET' && path === '/meals') data = url.searchParams.has('page') ? { data: meals, total: meals.length } : meals
    else if (method === 'GET' && path === '/meals/categories') data = [{ category: '家常菜' }, { category: '川菜' }]
    else if (method === 'GET' && path === '/meals/tags') data = []
    else if (method === 'GET' && path === '/meals/meal-a') data = meals[0]
    else if (method === 'GET' && path === '/memories') data = []
    else if (method === 'GET' && path === `/schedules/day/${today}` && failSchedule) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试读取失败' }) })
    else if (method === 'GET' && path === `/schedules/day/${today}`) data = dailySchedule
    else if (method === 'GET' && path === '/wishlist') data = wishlist
    else if (method === 'PUT' && path === `/schedules/${today}/dinner`) {
      writes.push({ path, body: request.postDataJSON() })
      if (conflictSchedule) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'SCHEDULE_CONFLICT', error: '餐食安排已被更新，请重新加载' }) })
      data = schedule
    }
    else if (method === 'PATCH' && path === '/wishlist/wish-a/status') { writes.push({ path, body: request.postDataJSON() }); data = { status: 'planned' } }
    else if (method === 'POST' && path === '/wishlist') { writes.push({ path, body: request.postDataJSON() }); data = { _id: 'new-wish' } }
    else if (method === 'POST' && path === '/meals') { writes.push({ path, body: request.postDataJSON() }); data = { _id: 'created-meal', name: '想吃的新菜' } }
    else if (method === 'PATCH' && path === '/wishlist/convert-wish/meal') { writes.push({ path, body: request.postDataJSON() }); data = {} }
    else if (method === 'GET' && path === '/weekly-plans' && failWeekly) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '周计划测试读取失败' }) })
    else if (method === 'GET' && path === '/weekly-plans') data = { weekStart: today, days: [{ date: today, meals: schedule.meals, hints: [] }] }
    else if (method === 'POST' && path === '/weekly-plans/generate') data = { days: [{ date: today, meals: { breakfast: [], lunch: [], dinner: ['meal-a'] } }], preview: [{ date: today, meals: { breakfast: [], lunch: [], dinner: [meals[0]] }, hints: [] }] }
    else if (method === 'POST' && path === '/weekly-plans/apply') { writes.push({ path, body: request.postDataJSON() }); data = {} }
    else if (method === 'GET' && path === '/schedules') data = []
    else if (method === 'GET' && path === '/shopping-list' && failShopping) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '购物清单测试读取失败' }) })
    else if (method === 'GET' && path === '/shopping-list') data = { items: [{ _id: 'item-a', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: false }] }
    else if (method === 'PATCH' && path === '/shopping-list/items/item-a') {
      writes.push({ path, body: request.postDataJSON() })
      await new Promise(resolve => { releaseShoppingUpdate = resolve })
      data = { items: [{ _id: 'item-a', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: false, manual: false }] }
    }
    else if (method === 'GET' && path === '/auth/me') data = { user: { id: 'user-a', username: 'test', displayName: '测试用户' }, household: { name: '测试小家', inviteCode: 'ABC123', members: [] } }
    else if (method === 'GET' && path === '/default-meals/status') data = { total: 3, imported: 3, missing: 0 }
    else if (method === 'GET' && path === '/meal-image-issues') data = []
    else if (method === 'POST' && path === '/household/join') { writes.push({ path, body: request.postDataJSON() }); data = {} }
    else data = {}
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
  })

  await page.goto(`${base}/dashboard`)
  await page.getByRole('heading', { name: /好好吃饭/ }).waitFor()
  try { await page.getByText('本周已安排').waitFor({ timeout: 8000 }) }
  catch (error) { console.error('Dashboard text:', await page.locator('body').innerText()); console.error('Page errors:', errors); await browser.close(); throw error }
  assert.equal(await page.getByText('本周已安排').count(), 1)
  await page.screenshot({ path: process.env.EATWHAT_DESKTOP_SHOT || path.join(os.tmpdir(), 'eatwhat-web-dashboard-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: '切换到暗色模式' }).click()
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), true)
  const darkBackground = await page.evaluate(() => getComputedStyle(document.querySelector('.app-main')).backgroundImage)
  assert.match(darkBackground, /32, 26, 24/)
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-dashboard-dark.png'), fullPage: true })
  await page.getByRole('button', { name: '切换到亮色模式' }).click()
  await page.getByRole('button', { name: '安排晚餐' }).click()
  try { await page.getByRole('heading', { name: /选择晚餐/ }).waitFor({ timeout: 12000 }) }
  catch (error) { console.error('Selection URL:', page.url(), 'text:', await page.locator('body').innerText(), 'errors:', errors); await browser.close(); throw error }
  await page.getByText('已选择:').waitFor()
  assert.match(await page.locator('.selection-info').innerText(), /番茄炒蛋/)
  assert.match(await page.locator('.selection-info').innerText(), /清炒青菜/)
  assert.match(await page.locator('.selection-info').innerText(), /麻婆豆腐/)
  await page.getByRole('button', { name: '保存安排' }).click()
  await page.waitForURL('**/calendar')
  assert.deepEqual(writes.find(item => item.path.includes('/schedules/'))?.body.mealIds, ['meal-a', 'meal-c', 'meal-b'])
  assert.equal(writes.find(item => item.path.includes('/schedules/'))?.body.expectedVersion, schedule.scheduleVersion)
  assert.equal(writes.find(item => item.path === '/wishlist/wish-a/status')?.body.status, 'planned')

  failSchedule = true
  await page.goto(`${base}/selection?date=${today}&mealType=dinner`)
  await page.getByText('无法读取完整的现有安排').waitFor()
  assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
  failSchedule = false

  conflictSchedule = true
  await page.goto(`${base}/selection?date=${today}&mealType=dinner&suggestedMealId=meal-b`)
  await page.getByText('已选择:').waitFor()
  await page.getByRole('button', { name: '保存安排' }).click()
  await page.getByText('其他成员刚刚更新了安排').waitFor()
  assert.match(await page.locator('.selection-info').innerText(), /麻婆豆腐/)
  assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
  assert.equal(writes.filter(item => item.path === '/wishlist/wish-a/status').length, 1)
  conflictSchedule = false
  await page.getByRole('button', { name: '重新加载最新安排' }).click()
  await page.getByText('其他成员刚刚更新了安排').waitFor({ state: 'hidden' })
  assert.equal(await page.getByRole('button', { name: '保存安排' }).isEnabled(), true)

  dailySchedule = { date: today, meals: schedule.meals }
  await page.goto(`${base}/selection?date=${today}&mealType=dinner`)
  await page.getByText('无法读取完整的现有安排').waitFor()
  assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
  dailySchedule = { date: today, scheduleExists: false, scheduleVersion: null, meals: { breakfast: [], lunch: [], dinner: [] } }
  await page.goto(`${base}/selection?date=${today}&mealType=dinner`)
  await page.getByText('已选择:').waitFor()
  await page.getByRole('button', { name: '保存安排' }).click()
  await page.waitForURL('**/calendar')
  assert.equal(writes.filter(item => item.path.includes('/schedules/')).at(-1).body.expectedVersion, null)
  dailySchedule = schedule

  await page.goto(`${base}/meals`)
  await page.getByText('把好味道留给家人').waitFor()
  await Promise.all([
    page.waitForRequest(request => new URL(request.url()).pathname.endsWith('/meals') && new URL(request.url()).searchParams.get('category') === '川菜'),
    page.locator('.category-strip').getByRole('button', { name: '川菜' }).click()
  ])
  await page.waitForFunction(() => document.querySelector('.category-strip button[aria-pressed="true"]')?.textContent === '川菜')
  assert.equal(reads.some(item => item.includes('/meals?') && item.includes('category=')), true)
  await page.locator('.category-strip').getByRole('button', { name: '全部菜品' }).click()
  await page.getByRole('button', { name: '投喂灵感' }).click()
  await page.waitForFunction(() => document.body.innerText.includes('已加入小家的想吃清单'))
  assert.equal(writes.find(item => item.path === '/wishlist')?.body.mealId, 'meal-a')

  wishlist = [{ _id: 'convert-wish', title: '想吃的新菜', status: 'open', priority: 'normal', votes: [] }]
  await page.goto(`${base}/wishlist`)
  await page.getByText('想吃的新菜').waitFor()
  await page.getByRole('button', { name: '转菜品' }).click()
  await page.waitForFunction(() => document.body.innerText.includes('已创建并关联菜谱'))
  assert.equal(writes.find(item => item.path === '/wishlist/convert-wish/meal')?.body.mealId, 'created-meal')

  failWeekly = true
  await page.goto(`${base}/weekly-plan`)
  await page.getByText('无法读取当前日历安排').waitFor()
  assert.equal(await page.getByRole('button', { name: '生成草稿' }).isDisabled(), true)
  failWeekly = false
  await page.getByRole('button', { name: '重新加载' }).click()
  await page.getByText('无法读取当前日历安排').waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: '生成草稿' }).click()
  await page.getByText('规则生成草稿').waitFor()
  assert.match(await page.locator('.week-summary').innerText(), /已安排 1 餐/)
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-weekly-desktop.png'), fullPage: true })
  await page.getByRole('button', { name: '应用到日历' }).click()
  await page.getByText('应用草稿会替换这一周').waitFor()
  await page.getByRole('button', { name: '再检查一下' }).click()
  assert.equal(writes.some(item => item.path === '/weekly-plans/apply'), false)

  await page.goto(`${base}/meals/detail/meal-a`)
  await page.getByRole('button', { name: '记录做过' }).click()
  await page.getByRole('dialog', { name: '记录饭后回忆' }).waitFor()
  assert.equal(await page.locator('input').evaluateAll(items => items.some(item => item.value === '做过一次：番茄炒蛋')), true)
  assert.equal(writes.some(item => item.path === '/memories'), false)

  await page.goto(`${base}/settings`)
  await page.getByPlaceholder('输入伴侣的邀请码').fill('OTHER1')
  await page.getByRole('button', { name: '加入', exact: true }).click()
  await page.getByText('加入其他小家会切换当前账号所属家庭').waitFor()
  await page.getByRole('button', { name: '取消' }).last().click()
  assert.equal(writes.some(item => item.path === '/household/join'), false)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/dashboard`)
  await page.getByRole('heading', { name: /好好吃饭/ }).waitFor()
  await page.screenshot({ path: process.env.EATWHAT_MOBILE_SHOT || path.join(os.tmpdir(), 'eatwhat-web-dashboard-mobile.png'), fullPage: true })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  assert.equal(overflow, false, 'mobile page should not overflow horizontally')
  await page.getByRole('button', { name: '打开导航菜单' }).click()
  assert.equal(await page.locator('.mobile-nav').getAttribute('aria-hidden'), 'false')
  await page.locator('.mobile-nav').getByRole('link', { name: '购物清单' }).click()
  assert.equal(await page.locator('.mobile-nav').getAttribute('aria-hidden'), 'true')
  await page.getByText('鸡蛋', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile shopping list should not overflow horizontally')
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-shopping-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: '清空已购' }).click()
  await page.getByText('将删除 1 项已购食材。').waitFor()
  await page.getByRole('button', { name: '取消' }).last().click()
  await page.waitForFunction(() => !document.querySelector('[aria-label="删除鸡蛋"]')?.disabled)
  await Promise.all([
    page.waitForRequest(request => request.method() === 'PATCH' && new URL(request.url()).pathname.endsWith('/shopping-list/items/item-a')),
    page.getByText('鸡蛋', { exact: true }).click()
  ])
  await page.waitForFunction(() => document.querySelector('[aria-label="删除鸡蛋"]')?.disabled)
  assert.equal(await page.getByRole('button', { name: '从排餐生成' }).isDisabled(), true)
  assert.equal(await page.getByLabel('选择购物清单日期').isDisabled(), true)
  releaseShoppingUpdate()
  await page.waitForFunction(() => !document.querySelector('[aria-label="删除鸡蛋"]')?.disabled)
  failShopping = true
  await page.goto(`${base}/shopping-list`)
  await page.locator('.load-error').waitFor()
  assert.match(await page.locator('.load-error').innerText(), /购物清单测试读取失败/)
  assert.equal(await page.getByRole('button', { name: '从排餐生成' }).isDisabled(), true)
  assert.equal(await page.getByText('鸡蛋', { exact: true }).count(), 0)
  failShopping = false
  await page.getByRole('button', { name: '重试' }).click()
  await page.getByText('鸡蛋', { exact: true }).waitFor()
  await page.goto(`${base}/weekly-plan`)
  await page.getByText('当前日历安排').waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile weekly plan should not overflow horizontally')
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-weekly-mobile.png'), fullPage: true })
  assert.deepEqual(errors, [])
  const loginContext = await browser.newContext()
  const loginPage = await loginContext.newPage()
  await loginPage.addInitScript(() => localStorage.setItem('eatwhat_remember_login', JSON.stringify({ remember: true, username: 'old-user', password: 'old-plaintext' })))
  await loginPage.goto(`${base}/login`)
  await loginPage.getByPlaceholder('请输入用户名').waitFor()
  assert.equal(await loginPage.getByPlaceholder('请输入用户名').inputValue(), 'old-user')
  assert.equal(await loginPage.getByPlaceholder('请输入密码').inputValue(), '')
  const remembered = await loginPage.evaluate(() => JSON.parse(localStorage.getItem('eatwhat_remember_login')))
  assert.equal('password' in remembered, false)
  await loginContext.close()
  console.log('Web workflows passed: dashboard, safe selection, wishlist, weekly plan, shopping and mobile navigation')
  await browser.close()
}

main().catch(error => { console.error(error); process.exit(1) })
