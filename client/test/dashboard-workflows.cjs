const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Dashboard checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1', username: 'test' })) })
    let date = '2026-10-28'; let suggested = 'meal-a'; let wishTitle = '家人想吃的菜'; let archived = false; let mode = 'valid'; let calls = 0; let release
    let recipeWrites = 0
    const recipe = { _id: 'meal-a', name: '家常菜', ingredients: [], steps: [], photos: [], tags: [], healthTags: [], supportsConditionalEdit: true, editVersion: { revision: 'v1', updatedAt: null } }
    const meals = { breakfast: [], lunch: [], dinner: [] }
    const summary = () => {
      const days = Array.from({ length: 7 }, (_, index) => ({ date: new Date(Date.parse(`${date}T00:00:00Z`) + (index - 3) * 86400000).toISOString().slice(0, 10), meals }))
      return { today: date, todaySchedule: { meals, ...(mode === 'wrongdate' ? { date: '2020-01-01' } : {}) }, todayHints: [], week: { days: mode === 'badweek' ? [] : mode === 'reverse' ? days.reverse() : days }, partnerWishlist: mode === 'removed' ? [] : mode === 'long' ? [{ id: 'wish-a', title: '长名字'.repeat(30), mealId: { _id: 'meal-a' } }, { id: 'wish-b', title: '另一道想吃的菜', mealId: { _id: 'meal-b' } }] : [{ _id: 'wish-a', title: wishTitle, mealId: suggested ? { _id: suggested, name: '家常菜', archived } : null }], recentPhotos: [], defaultMeals: { imported: mode === 'badcount' ? 3 : 1, total: 2 }, imageIssues: mode === 'invalid' ? null : { open: 0 }, meals: { favorites: 0 } }
    }
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/dashboard/summary') {
        calls++
        const snapshot = summary()
        if (mode === 'hold') await new Promise(resolve => { release = resolve })
        if (mode === 'failed') return route.fulfill({ status: 503, json: { error: '饭桌暂时不可用' } })
        return route.fulfill({ json: snapshot })
      }
      if (path === '/api/wishlist') return route.fulfill({ json: [] })
      if (path === '/api/memories') return route.fulfill({ json: [] })
      if (path === '/api/meals/meal-a') { if (route.request().method() === 'PUT') recipeWrites++; return route.fulfill({ json: recipe }) }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/dashboard`)
    await page.getByText('家人想吃的菜').waitFor()
    assert.equal(calls, 1)
    date = '2026-10-29'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.getByText('日期或想吃内容已变化', { exact: false }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a new date requires renewed intent')
    suggested = 'meal-b'
    const changedResponse = page.waitForResponse(result => new URL(result.url()).pathname === '/api/dashboard/summary')
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await changedResponse
    await page.waitForFunction(() => document.querySelector('.dashboard-page')?.getAttribute('aria-busy') === 'false')
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a changed linked meal requires renewed intent')
    wishTitle = '更新后的想吃'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.getByText('更新后的想吃').waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a changed wish title requires renewed intent')
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.waitForURL('**/selection?*')
    let url = new URL(page.url())
    assert.equal(url.searchParams.get('date'), '2026-10-29')
    assert.equal(url.searchParams.get('suggestedMealId'), 'meal-b')
    assert.equal(url.searchParams.get('wishlistId'), 'wish-a')
    assert.equal(calls, 5, 'each action must refresh data before navigation')

    wishTitle = '家人想吃的菜'
    await page.goto(`${base}/dashboard`)
    await page.getByText('家人想吃的菜').waitFor()
    mode = 'removed'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.waitForURL('**/wishlist')
    await page.getByText('心愿已变化，请先在想吃清单中核对').waitFor()

    mode = 'valid'
    await page.goto(`${base}/dashboard`)
    await page.getByText('家人想吃的菜').waitFor()
    mode = 'failed'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.locator('.load-error').getByText('饭桌暂时不可用').waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard')
    assert.equal(await page.locator('.dashboard-grid').count(), 0)
    mode = 'valid'
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('家人想吃的菜').waitFor()
    mode = 'invalid'
    await page.getByRole('button', { name: '刷新饭桌' }).click()
    await page.getByText('饭桌信息不完整，请重新加载').waitFor()
    assert.equal(await page.locator('.dashboard-grid').count(), 0, 'missing counts must not be displayed as zero')
    mode = 'badweek'
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('饭桌信息不完整，请重新加载').waitFor()
    assert.equal(await page.locator('.dashboard-grid').count(), 0, 'an incomplete week must not be shown as an empty plan')
    for (const fault of ['badcount', 'wrongdate']) {
      mode = fault
      const response = page.waitForResponse(result => new URL(result.url()).pathname === '/api/dashboard/summary')
      await page.getByRole('button', { name: '重新加载' }).click()
      await response
      await page.waitForFunction(() => document.querySelector('.dashboard-page')?.getAttribute('aria-busy') === 'false')
      assert.equal(await page.locator('.dashboard-grid').count(), 0, `${fault} must not be displayed`)
      assert.equal(await page.locator('.load-error').isVisible(), true)
    }
    mode = 'valid'; suggested = ''
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByRole('button', { name: '查看心愿' }).waitFor()
    await page.getByText('尚无法安排，请在想吃清单中核对菜品').waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('button', { name: '查看心愿' }).click()
    await page.waitForURL('**/wishlist')

    suggested = 'meal-a'; archived = true
    await page.goto(`${base}/dashboard`)
    await page.getByText('关联菜品已移入回收站，请先核对').waitFor()
    assert.equal(await page.getByRole('button', { name: '安排晚餐' }).count(), 0)
    await page.getByRole('button', { name: '查看心愿' }).click()
    await page.waitForURL('**/wishlist')
    archived = false

    mode = 'valid'; suggested = 'meal-a'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: '安排晚餐' }).waitFor()
    mode = 'hold'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(typeof release, 'function')
    assert.equal(await page.getByRole('button', { name: '安排2026-10-29早餐' }).isDisabled(), true)
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/wishlist') })
    await page.waitForURL('**/wishlist')
    const response = page.waitForResponse(result => new URL(result.url()).pathname === '/api/dashboard/summary')
    mode = 'valid'; release(); await response
    await page.waitForTimeout(150)
    assert.equal(new URL(page.url()).pathname, '/wishlist', 'a late refresh must not redirect after leaving the dashboard')
    mode = 'reverse'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('link', { name: /查看 2026-10-29 的日历安排/ }).waitFor()
    const days = await page.locator('.week-day').evaluateAll(links => links.map(link => new URL(link.href).searchParams.get('date')))
    assert.deepEqual(days, [...days].sort(), 'week dates must be displayed in chronological order')
    assert.equal(await page.getByRole('link', { name: /查看 2026-10-29 的日历安排/ }).getAttribute('aria-current'), 'date')
    for (const link of await page.locator('.week-day').all()) assert.ok((await link.boundingBox()).height >= 44)
    date = '2026-10-30'
    await page.getByRole('button', { name: '安排2026-10-29早餐' }).click()
    await page.getByText('日期或餐次安排已变化', { exact: false }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a stale day must not navigate silently')
    meals.breakfast = [{ meal: { _id: 'meal-a', name: '家常菜' } }, { meal: null }]
    await page.getByRole('button', { name: '安排2026-10-30早餐' }).click()
    await page.getByRole('button', { name: '查看2026-10-30早餐' }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard', 'a newly filled slot must not navigate to stale empty selection')
    const recipeLink = page.getByRole('link', { name: '查看早餐的家常菜菜谱' })
    assert.equal(await recipeLink.getAttribute('href'), '/meals/detail/meal-a?fromDashboard=1')
    assert.equal(await page.getByText('菜品不可用', { exact: true }).count(), 1)
    assert.ok((await recipeLink.boundingBox()).height >= 44)
    await page.setViewportSize({ width: 320, height: 844 })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.today-recipe-link')
        assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme}: ${result.ratio}`)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await page.setViewportSize({ width: 390, height: 844 })
    await recipeLink.click()
    await page.getByRole('heading', { name: '家常菜' }).waitFor()
    await page.getByRole('button', { name: '返回首页' }).click()
    await page.waitForURL('**/dashboard')
    await page.getByRole('link', { name: '查看早餐的家常菜菜谱' }).click()
    await page.getByRole('button', { name: '编辑菜品' }).click()
    await page.getByText('保存后返回首页', { exact: false }).waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.waitForURL('**/meals/detail/meal-a?fromDashboard=1')
    await page.getByRole('button', { name: '编辑菜品' }).click()
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/dashboard')
    assert.equal(recipeWrites, 1)
    await page.getByRole('button', { name: '查看2026-10-30早餐' }).click()
    await page.waitForURL('**/calendar?date=2026-10-30')
    meals.breakfast = []
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: '安排2026-10-30早餐' }).click()
    await page.waitForURL('**/selection?date=2026-10-30&mealType=breakfast')
    date = '2026-10-29'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('link', { name: /查看 2026-10-30 的日历安排/ }).waitFor()
    await page.getByRole('link', { name: /查看 2026-10-30 的日历安排/ }).click()
    await page.waitForURL('**/calendar?date=2026-10-30')
    mode = 'long'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: '安排晚餐：另一道想吃的菜' }).waitFor()
    assert.equal(await page.locator('.wishlist-row').count(), 2)
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `long wish must not overflow at ${width}px`)
      for (const button of await page.locator('.wishlist-row button').all()) assert.ok((await button.boundingBox()).height >= 44)
    }
    await page.getByRole('button', { name: '安排晚餐：另一道想吃的菜' }).click()
    await page.waitForURL('**/selection?*')
    assert.equal(new URL(page.url()).searchParams.get('wishlistId'), 'wish-b')
    mode = 'removed'
    await page.goto(`${base}/dashboard`)
    await page.getByText('暂时没有新的想吃提醒').waitFor()
    await page.getByText('还没有饭后照片').waitFor()
    for (const [name, target] of [['查看想吃清单', '/wishlist'], ['打开饭桌相册', '/photo-album'], ['记录饭后回忆', '/memories']]) {
      const link = page.getByRole('link', { name })
      assert.equal(await link.getAttribute('href'), target)
      assert.ok((await link.boundingBox()).height >= 44, `${name} must be easy to tap`)
    }
    await page.getByRole('link', { name: '记录饭后回忆' }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL('**/memories')
    await page.goto(`${base}/dashboard`)
    await page.getByRole('link', { name: '打开饭桌相册' }).click()
    await page.waitForURL('**/photo-album')
    await page.goto(`${base}/dashboard`)
    await page.getByRole('link', { name: '查看想吃清单' }).click()
    await page.waitForURL('**/wishlist')
    await page.clock.setFixedTime(new Date(2026, 9, 28, 23, 59))
    mode = 'valid'; date = '2026-10-28'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: '安排2026-10-28早餐' }).waitFor()
    const callsBeforeFocus = calls
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    assert.equal(calls, callsBeforeFocus, 'same-day focus must not refresh repeatedly')
    date = '2026-10-29'
    await page.clock.setFixedTime(new Date(2026, 9, 29, 0, 1))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.getByRole('button', { name: '安排2026-10-29早餐' }).waitFor()
    assert.equal(calls, callsBeforeFocus + 1, 'cross-day focus refreshes the displayed server date')
    const beforePending = calls
    release = null; mode = 'hold'
    await page.getByRole('button', { name: '刷新饭桌' }).click()
    for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof release, 'function')
    date = '2026-10-30'; mode = 'valid'
    await page.clock.setFixedTime(new Date(2026, 9, 30, 0, 1))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    release()
    await page.getByRole('button', { name: '安排2026-10-30早餐' }).waitFor()
    assert.equal(calls, beforePending + 2, 'cross-day refresh must follow an already-running request')
    date = '2026-10-31'
    await page.getByRole('button', { name: '安排今天', exact: true }).click()
    await page.getByText('日期已变化，请核对更新后的首页再安排').waitFor()
    assert.equal(new URL(page.url()).pathname, '/dashboard')
    await page.getByRole('button', { name: '安排今天', exact: true }).click()
    await page.waitForURL('**/calendar?date=2026-10-31')
    assert.deepEqual(errors, [])
    console.log('Dashboard checks passed: refreshed date and wish, unavailable and malformed data, and retry')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
