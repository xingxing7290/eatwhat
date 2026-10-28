const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const path = require('node:path')
const os = require('node:os')

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
const meals = [
  { _id: 'meal-a', name: '番茄炒蛋', category: '家常菜', description: '家常味道', tags: [] },
  { _id: 'meal-b', name: '麻婆豆腐', category: '川菜', description: '麻辣鲜香', tags: [] },
  { _id: 'meal-c', name: '清炒青菜', category: '家常菜', description: '清爽', tags: [] },
  { _id: 'created-meal', name: '想吃的新菜', category: '家常菜', description: '', tags: [] }
]
const today = '2026-10-28'
const schedule = { date: today, _id: 'schedule-a', updatedAt: '2026-10-28T08:00:00.000Z', scheduleExists: true, scheduleVersion: '2026-10-28T08:00:00.000Z', meals: { breakfast: [], lunch: [], dinner: [{ meal: meals[0] }, { meal: meals[2] }] } }
const weekDates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
const weekDays = weekDates.map(date => date === today ? { ...schedule, hints: [] } : { date, scheduleExists: false, scheduleVersion: null, meals: { breakfast: [], lunch: [], dinner: [] }, hints: [] })
const draftDays = weekDates.map(date => ({ date, meals: { breakfast: [], lunch: [], dinner: ['meal-a'] } }))
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
  await page.clock.setFixedTime(new Date('2026-10-28T12:00:00'))
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
  let weeklyApplyMode = 'success'
  let supportsWeeklyVersions = true
  let failAttach = false
  let failAlbum = false
  let failMealCreate = false
  let failMemories = false
  let failAnniversaries = false
  let failAnniversarySave = false
  let failMonth = false
  let failEditorSave = false
  let blockEditorSave = false
  let releaseEditorSave
  let conflictMealEdit = false
  let supportsMealEdit = true
  const mealEditVersion = { revision: 'fixture-revision', updatedAt: '2026-10-28T08:00:00.000Z' }
  const anniversaryMenus = [{ _id: 'ann-a', title: '周年晚餐', date: today, theme: '纪念日', meals: { breakfast: [], lunch: [], dinner: [meals[0]] }, photos: [] }]
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') console.error('Browser:', message.text()) })
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户' }))
    const createObjectURL = URL.createObjectURL.bind(URL)
    window.__testObjectUrlNames = {}
    URL.createObjectURL = blob => { const url = createObjectURL(blob); window.__testObjectUrlNames[url] = blob.name; return url }
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
    else if (method === 'GET' && path === '/meals/meal-a') data = { ...meals[0], supportsConditionalEdit: supportsMealEdit, editVersion: mealEditVersion }
    else if (method === 'GET' && path === '/memories' && failMemories) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '回忆测试读取失败' }) })
    else if (method === 'GET' && path === '/memories') data = []
    else if (method === 'GET' && path === `/schedules/day/${today}` && failSchedule) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试读取失败' }) })
    else if (method === 'GET' && path === `/schedules/day/${today}`) data = dailySchedule
    else if (method === 'GET' && path === '/wishlist') data = wishlist
    else if (method === 'PUT' && path === `/schedules/${today}/dinner`) {
      writes.push({ path, body: request.postDataJSON() })
      if (conflictSchedule) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'SCHEDULE_CONFLICT', error: '餐食安排已被更新，请重新加载' }) })
      data = request.postDataJSON().mealIds.length === 0 ? { ...schedule, updatedAt: '2026-10-28T09:00:00.000Z', meals: { ...schedule.meals, dinner: [] } } : schedule
    }
    else if (method === 'PATCH' && path === '/wishlist/wish-a/status') { writes.push({ path, body: request.postDataJSON() }); data = { status: 'planned' } }
    else if (method === 'POST' && path === '/wishlist') { writes.push({ path, body: request.postDataJSON() }); data = { _id: 'new-wish' } }
    else if (method === 'POST' && path === '/meals') {
      if ((request.headers()['content-type'] || '').includes('multipart/form-data')) {
        writes.push({ path, editor: true, body: request.postData() })
        if (failEditorSave) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '编辑器测试保存未确认' }) })
        if (blockEditorSave) await new Promise(resolve => { releaseEditorSave = resolve })
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'editor-meal', name: '测试菜谱' }) })
      }
      writes.push({ path, body: request.postDataJSON() })
      if (failMealCreate) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试创建结果不确定' }) })
      data = { _id: 'created-meal', name: '想吃的新菜' }
    }
    else if (method === 'PUT' && path === '/meals/meal-a') {
      writes.push({ path, editorUpdate: true, body: request.postData() })
      if (conflictMealEdit) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'MEAL_CONFLICT', error: '菜谱已被更新，请核对最新内容' }) })
      data = { ...meals[0], name: '更新菜谱' }
    }
    else if (method === 'PATCH' && (path === '/wishlist/convert-wish/meal' || path === '/wishlist/wish-existing/meal')) {
      writes.push({ path, body: request.postDataJSON() })
      if (failAttach) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试关联失败' }) })
      const id = path.split('/')[2]
      wishlist = wishlist.map(item => item._id === id ? { ...item, mealId: meals.find(meal => meal._id === request.postDataJSON().mealId) } : item)
      data = {}
    }
    else if (method === 'GET' && path === '/weekly-plans' && failWeekly) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '周计划测试读取失败' }) })
    else if (method === 'GET' && path === '/weekly-plans') data = { weekStart: weekDates[0], supportsConditionalApply: supportsWeeklyVersions, days: weekDays }
    else if (method === 'POST' && path === '/weekly-plans/generate') data = { days: draftDays, preview: draftDays.map(day => ({ ...day, meals: { breakfast: [], lunch: [], dinner: [meals[0]] }, hints: [] })) }
    else if (method === 'POST' && path === '/weekly-plans/apply') {
      writes.push({ path, body: request.postDataJSON() })
      if (weeklyApplyMode === 'conflict') return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'WEEKLY_PLAN_CONFLICT', error: '安排已变化', conflictDate: weekDates[2], appliedDates: weekDates.slice(0, 2) }) })
      if (weeklyApplyMode === 'incomplete') return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'WEEKLY_PLAN_INCOMPLETE', error: '未完整应用', uncertainDate: weekDates[1], appliedDates: weekDates.slice(0, 1) }) })
      data = { applied: 7 }
    }
    else if (method === 'GET' && path === '/schedules' && failMonth) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '日历测试读取失败' }) })
    else if (method === 'GET' && path === '/schedules') data = [schedule]
    else if (method === 'GET' && path === '/shopping-list' && failShopping) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '购物清单测试读取失败' }) })
    else if (method === 'GET' && path === '/shopping-list') data = { items: [{ _id: 'item-a', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: false }] }
    else if (method === 'PATCH' && path === '/shopping-list/items/item-a') {
      writes.push({ path, body: request.postDataJSON() })
      await new Promise(resolve => { releaseShoppingUpdate = resolve })
      data = { items: [{ _id: 'item-a', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: false, manual: false }] }
    }
    else if (method === 'GET' && path === '/auth/me') data = { user: { id: 'user-a', username: 'test', displayName: '测试用户' }, household: { name: '测试小家', inviteCode: 'ABC123', members: [] } }
    else if (method === 'GET' && path === '/photo-album' && failAlbum) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '相册测试读取失败' }) })
    else if (method === 'GET' && path === '/photo-album') data = { photos: [{ photo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23d49a75"/%3E%3C/svg%3E', memoryId: 'memory-a', date: today, mealType: 'dinner', title: '测试晚餐' }] }
    else if (method === 'GET' && path === '/anniversaries' && failAnniversaries) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '纪念日测试读取失败' }) })
    else if (method === 'GET' && path === '/anniversaries') data = anniversaryMenus
    else if (method === 'GET' && path === '/anniversary-templates') data = [{ key: 'birthday', title: '生日小餐桌', theme: '生日', description: '一起庆祝', structure: ['主菜'] }]
    else if (method === 'POST' && path === '/anniversaries') {
      writes.push({ path })
      if (failAnniversarySave) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试保存未确认' }) })
      data = { _id: 'ann-new' }
    }
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
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled))
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

  wishlist = [{ _id: 'convert-wish', title: '想吃的新菜', status: 'open', priority: 'normal', votes: [], supportsSafeMealLink: true }]
  failAttach = true
  await page.goto(`${base}/wishlist`)
  await page.getByText('想吃的新菜').waitFor()
  await page.getByRole('button', { name: '转菜品' }).click()
  await page.getByText('关联尚未确认').waitFor()
  assert.equal(writes.filter(item => item.path === '/meals').length, 1)
  failAttach = false
  await page.getByRole('button', { name: '重试关联' }).click()
  await page.getByRole('button', { name: '安排今天晚餐' }).waitFor()
  assert.equal(writes.filter(item => item.path === '/meals').length, 1)
  assert.equal(writes.find(item => item.path === '/wishlist/convert-wish/meal')?.body.mealId, 'created-meal')
  assert.equal(writes.find(item => item.path === '/wishlist/convert-wish/meal')?.body.onlyIfUnlinked, true)

  wishlist = [{ _id: 'wish-old-server', title: '旧服务器想吃', status: 'open', priority: 'normal', votes: [] }]
  await page.goto(`${base}/wishlist`)
  await page.getByText('服务器未提供安全关联能力').waitFor()
  assert.equal(await page.getByRole('button', { name: '转菜品' }).isDisabled(), true)

  wishlist = [{ _id: 'wish-uncertain', title: '创建状态不确定', status: 'open', priority: 'normal', votes: [], supportsSafeMealLink: true }]
  failMealCreate = true
  await page.goto(`${base}/wishlist`)
  await page.getByRole('button', { name: '转菜品' }).click()
  await page.getByText('创建结果不确定，请先搜索').waitFor()
  assert.equal(await page.getByRole('button', { name: '转菜品' }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: '关联已有菜谱' }).isEnabled(), true)
  failMealCreate = false

  wishlist = [{ _id: 'wish-existing', title: '想吃鸡蛋', status: 'open', priority: 'normal', votes: [], supportsSafeMealLink: true }]
  await page.goto(`${base}/wishlist`)
  await page.getByRole('button', { name: '关联已有菜谱' }).click()
  await page.getByRole('dialog', { name: '关联已有菜谱' }).locator('.el-select').click()
  await page.getByRole('option', { name: '番茄炒蛋' }).click()
  await page.getByRole('button', { name: '确认关联' }).click()
  await page.getByRole('button', { name: '安排今天晚餐' }).click()
  await page.waitForURL('**/selection?*')
  assert.equal(new URL(page.url()).searchParams.get('suggestedMealId'), 'meal-a')
  assert.equal(new URL(page.url()).searchParams.get('wishlistId'), 'wish-existing')
  assert.equal(writes.some(item => item.path === '/wishlist/wish-existing/status'), false)

  failAlbum = true
  await page.goto(`${base}/photo-album`)
  await page.getByText('相册暂时无法加载').waitFor()
  assert.equal(await page.getByText('这个月还没有饭桌照片').count(), 0)
  failAlbum = false
  await page.getByRole('button', { name: '重新加载' }).click()
  await page.locator('.photo-card').click()
  await page.getByRole('dialog', { name: '饭桌回忆' }).waitFor()

  failMonth = true
  await page.goto(`${base}/calendar`)
  await page.getByText('无法加载月度安排').waitFor()
  assert.equal(await page.locator('.calendar-grid:visible').count(), 0)
  failMonth = false
  await page.getByRole('button', { name: '重新加载' }).click()
  const deleteDinner = page.locator('.desktop-only').getByRole('button', { name: `删除${today}晚餐` })
  await deleteDinner.waitFor()
  conflictSchedule = true
  await deleteDinner.click()
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await page.getByText('这天的安排已被更新').waitFor()
  const calendarDelete = writes.filter(item => item.path === `/schedules/${today}/dinner`).at(-1)
  assert.equal(calendarDelete.body.expectedVersion, schedule.scheduleVersion)
  assert.deepEqual(calendarDelete.body.mealIds, [])
  conflictSchedule = false
  await deleteDinner.waitFor()
  await deleteDinner.click()
  await page.getByRole('button', { name: '确认', exact: true }).click()
  await deleteDinner.waitFor({ state: 'hidden' })

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
  weeklyApplyMode = 'conflict'
  await page.getByRole('button', { name: '应用到日历' }).click()
  await page.getByRole('button', { name: '确认替换' }).click()
  await page.getByText('2026-10-28的安排已变化').waitFor()
  const firstApply = writes.find(item => item.path === '/weekly-plans/apply')
  assert.equal(firstApply.body.expectedVersions[today], schedule.scheduleVersion)
  assert.equal(firstApply.body.expectedVersions[weekDates[0]], null)
  assert.match(await page.locator('.el-alert').innerText(), /已写入：2026-10-26、2026-10-27/)
  assert.equal(await page.getByText('规则生成草稿').count(), 0)
  weeklyApplyMode = 'incomplete'
  await page.getByRole('button', { name: '生成草稿' }).click()
  await page.getByRole('button', { name: '应用到日历' }).click()
  await page.getByRole('button', { name: '确认替换' }).click()
  await page.getByText('2026-10-27 的写入结果不确定').waitFor()
  assert.equal(await page.getByText('规则生成草稿').count(), 0)
  supportsWeeklyVersions = false
  await page.goto(`${base}/weekly-plan`)
  await page.getByText('服务器未提供完整的安排版本').waitFor()
  await page.getByRole('button', { name: '生成草稿' }).click()
  await page.getByText('规则生成草稿').waitFor()
  assert.equal(await page.getByRole('button', { name: '应用到日历' }).isDisabled(), true)
  supportsWeeklyVersions = true

  await page.goto(`${base}/meals/detail/meal-a`)
  failMemories = true
  await page.getByRole('button', { name: '记录做过' }).click()
  await page.getByText('无法加载回忆').waitFor()
  assert.equal(await page.getByText('还没有饭后回忆').count(), 0)
  assert.equal(new URL(page.url()).searchParams.get('mealId'), 'meal-a')
  failMemories = false
  await page.getByRole('button', { name: '重新加载' }).click()
  await page.getByRole('dialog', { name: '记录饭后回忆' }).waitFor()
  assert.equal(await page.locator('input').evaluateAll(items => items.some(item => item.value === '做过一次：番茄炒蛋')), true)
  await page.getByRole('dialog', { name: '记录饭后回忆' }).locator('input[type=file]').setInputFiles([
    { name: 'valid.png', mimeType: 'image/png', buffer: Buffer.from('test') },
    { name: 'not-image.txt', mimeType: 'text/plain', buffer: Buffer.from('test') }
  ])
  await page.waitForFunction(() => document.querySelectorAll('.el-upload-list__item').length === 1)
  assert.equal(await page.locator('.el-upload-list__item img').evaluate(img => window.__testObjectUrlNames[img.src]), 'valid.png')
  assert.equal(writes.some(item => item.path === '/memories'), false)

  failAnniversaries = true
  await page.goto(`${base}/anniversaries`)
  await page.getByText('无法加载纪念日菜单').waitFor()
  assert.equal(await page.getByText('还没有纪念日菜单').count(), 0)
  assert.equal(await page.getByRole('button', { name: '新增菜单' }).isDisabled(), true)
  failAnniversaries = false
  await page.getByRole('button', { name: '重新加载' }).click()
  await page.getByText('周年晚餐').waitFor()
  await page.getByRole('button', { name: '删除周年晚餐' }).click()
  await page.getByText('确定删除这个纪念日菜单吗').waitFor()
  await page.getByRole('button', { name: '取消' }).last().click()
  await page.getByRole('button', { name: '新增菜单' }).click()
  await page.getByPlaceholder('比如：三周年晚餐').fill('自己的标题')
  await page.getByRole('button', { name: '生日小餐桌' }).click()
  await page.getByText('使用模板会替换当前标题').waitFor()
  await page.getByRole('button', { name: '取消' }).last().click()
  assert.equal(await page.getByPlaceholder('比如：三周年晚餐').inputValue(), '自己的标题')
  await page.getByRole('dialog', { name: '新增纪念日菜单' }).locator('input[type=file]').setInputFiles({ name: 'not-image.txt', mimeType: 'text/plain', buffer: Buffer.from('test') })
  await page.getByText('只支持 JPG、PNG').waitFor()
  await page.waitForFunction(() => document.querySelectorAll('.el-upload-list__item').length === 0)
  failAnniversarySave = true
  await page.getByRole('dialog', { name: '新增纪念日菜单' }).getByRole('button', { name: '保存' }).click()
  await page.getByText('保存结果未确认，请先返回菜单核对').waitFor()
  assert.equal(await page.getByRole('dialog', { name: '新增纪念日菜单' }).getByRole('button', { name: '保存' }).isDisabled(), true)
  assert.equal(writes.filter(item => item.path === '/anniversaries').length, 1)
  failAnniversarySave = false
  await page.getByRole('button', { name: '返回并核对' }).click()
  await page.getByText('周年晚餐').waitFor()

  await page.goto(`${base}/meals/editor`)
  await page.getByPlaceholder('给这道菜起个名字').fill('测试菜谱')
  await page.getByPlaceholder('食材', { exact: true }).fill('鸡蛋')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByText('还有未添加到列表的食材或步骤').waitFor()
  await page.getByRole('button', { name: '返回添加' }).click()
  assert.equal(writes.some(item => item.editor), false)
  await page.getByRole('button', { name: '添加食材' }).click()
  await page.getByPlaceholder('写下一个步骤').fill('煎熟鸡蛋')
  await page.getByRole('button', { name: '添加步骤' }).click()
  await page.getByText('无步骤图').waitFor()
  const coverUpload = page.locator('.side-column .el-card').first().locator('input[type=file]')
  await coverUpload.setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') })
  await page.getByText('只支持 JPG、PNG').waitFor()
  assert.equal(await page.getByAltText('菜品封面预览').count(), 0)
  await coverUpload.setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: Buffer.from('cover') })
  await page.getByAltText('菜品封面预览').waitFor()
  const galleryUpload = page.locator('.side-column .el-card').nth(1).locator('input[type=file]')
  await galleryUpload.setInputFiles([
    { name: 'valid.png', mimeType: 'image/png', buffer: Buffer.from('valid') },
    { name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') }
  ])
  await page.waitForFunction(() => document.querySelectorAll('.side-column .el-upload-list__item').length === 1)
  assert.equal(await page.locator('.side-column .el-upload-list__item img').evaluate(img => window.__testObjectUrlNames[img.src]), 'valid.png')
  blockEditorSave = true
  await Promise.all([
    page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/meals')),
    page.getByRole('button', { name: '保存', exact: true }).click()
  ])
  assert.equal(await page.getByRole('button', { name: '取消', exact: true }).isDisabled(), true)
  assert.equal(writes.filter(item => item.editor).length, 1)
  const editorPayload = writes.find(item => item.editor).body
  assert.match(editorPayload, /cover\.png/)
  assert.match(editorPayload, /valid\.png/)
  assert.doesNotMatch(editorPayload, /bad\.txt/)
  releaseEditorSave()
  blockEditorSave = false
  await page.waitForURL('**/meals')

  await page.goto(`${base}/meals/editor/meal-a`)
  await page.getByPlaceholder('给这道菜起个名字').fill('修改后菜名')
  assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByText('当前编辑内容尚未保存').waitFor()
  await page.getByRole('button', { name: '继续编辑' }).click()
  assert.equal(await page.getByPlaceholder('给这道菜起个名字').inputValue(), '修改后菜名')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '放弃并离开' }).click()
  await page.waitForURL('**/meals')

  conflictMealEdit = true
  await page.goto(`${base}/meals/editor/meal-a`)
  await page.getByPlaceholder('给这道菜起个名字').fill('冲突时保留的菜名')
  await page.locator('.side-column .el-card').first().locator('input[type=file]').setInputFiles({ name: 'conflict.png', mimeType: 'image/png', buffer: Buffer.from('image') })
  await page.getByAltText('菜品封面预览').waitFor()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByText('这道菜已被其他成员修改，本次未保存').waitFor()
  assert.equal(await page.getByPlaceholder('给这道菜起个名字').inputValue(), '冲突时保留的菜名')
  assert.equal(await page.getByAltText('菜品封面预览').count(), 1)
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('link', { name: '查看最新菜谱' }).getAttribute('target'), '_blank')
  assert.match(writes.find(item => item.editorUpdate).body, /fixture-revision/)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '放弃并离开' }).click()
  await page.waitForURL('**/meals')
  conflictMealEdit = false
  supportsMealEdit = false
  await page.goto(`${base}/meals/editor/meal-a`)
  await page.getByText('服务器未提供有效的菜谱版本').waitFor()
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.waitForURL('**/meals')
  supportsMealEdit = true

  failEditorSave = true
  await page.goto(`${base}/meals/editor`)
  await page.getByPlaceholder('给这道菜起个名字').fill('待核对菜品')
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.locator('.meal-editor .el-alert').waitFor()
  assert.match(await page.locator('.meal-editor .el-alert').innerText(), /保存结果未确认/)
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: '已核对，允许重试' }).click()
  await page.getByRole('button', { name: '取消', exact: true }).last().click()
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
  failEditorSave = false
  await page.getByRole('button', { name: '取消', exact: true }).first().click()
  await page.getByRole('button', { name: '放弃并离开' }).click()
  await page.waitForURL('**/meals')

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
  await page.goto(`${base}/wishlist`)
  await page.getByRole('heading', { name: '想吃清单' }).waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile wishlist should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-wishlist-mobile.png'), fullPage: true })
  await page.goto(`${base}/photo-album`)
  await page.locator('.photo-card').waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile album should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-album-mobile.png'), fullPage: true })
  await page.goto(`${base}/memories`)
  await page.getByText('还没有饭后回忆').waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile memories should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-memories-mobile.png'), fullPage: true })
  await page.goto(`${base}/anniversaries`)
  await page.getByText('周年晚餐').waitFor()
  await page.waitForTimeout(700)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile anniversaries should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-anniversaries-mobile.png'), fullPage: true })
  await page.goto(`${base}/calendar`)
  await page.locator('.mobile-date-list').getByRole('button', { name: `删除${today}晚餐` }).waitFor()
  assert.equal(await page.locator('.mobile-date-list').getByRole('button', { name: `删除${today}早餐` }).count(), 0)
  assert.equal(await page.locator('.mobile-date-list').getByRole('button', { name: `安排${today}早餐` }).count(), 1)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile calendar should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-calendar-mobile.png') })
  await page.goto(`${base}/meals/editor`)
  await page.getByPlaceholder('给这道菜起个名字').waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile meal editor should not overflow horizontally')
  await page.screenshot({ path: path.join(os.tmpdir(), 'eatwhat-web-editor-mobile.png') })
  assert.deepEqual(errors, [])
  const loginContext = await browser.newContext()
  const loginPage = await loginContext.newPage()
  let loginCalls = 0
  let releaseLogin
  let delayLogin = true
  await loginPage.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname.endsWith('/auth/login')) {
      loginCalls++
      if (delayLogin) await new Promise(resolve => { releaseLogin = resolve })
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'login-token', user: { username: 'old-user' } }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pathname.endsWith('/weekly-plans') ? { days: [] } : {}) })
  })
  await loginPage.addInitScript(() => localStorage.setItem('eatwhat_remember_login', JSON.stringify({ remember: true, username: 'old-user', password: 'old-plaintext' })))
  await loginPage.goto(`${base}/login?redirect=%2Fweekly-plan`)
  await loginPage.getByPlaceholder('请输入用户名').waitFor()
  assert.equal(await loginPage.getByPlaceholder('请输入用户名').inputValue(), 'old-user')
  assert.equal(await loginPage.getByPlaceholder('请输入密码').inputValue(), '')
  const remembered = await loginPage.evaluate(() => JSON.parse(localStorage.getItem('eatwhat_remember_login')))
  assert.equal('password' in remembered, false)
  await loginPage.getByPlaceholder('请输入密码').fill('test-password')
  await Promise.all([
    loginPage.waitForRequest(request => new URL(request.url()).pathname.endsWith('/auth/login')),
    loginPage.getByPlaceholder('请输入密码').press('Enter')
  ])
  await loginPage.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  assert.equal(loginCalls, 1)
  releaseLogin()
  await loginPage.waitForURL('**/weekly-plan')
  assert.equal(await loginPage.evaluate(() => localStorage.getItem('token')), 'login-token')
  delayLogin = false
  await loginPage.goto(`${base}/login?redirect=%2F%2Fevil.example`)
  await loginPage.getByPlaceholder('请输入密码').fill('test-password')
  await loginPage.getByPlaceholder('请输入密码').press('Enter')
  await loginPage.waitForURL('**/dashboard')
  assert.equal(new URL(loginPage.url()).origin, new URL(base).origin)
  await loginContext.close()
  console.log('Web workflows passed: dashboard, safe selection, wishlist, weekly plan, shopping and mobile navigation')
  await browser.close()
}

main().catch(error => { console.error(error); process.exit(1) })
