const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Dashboard checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1', username: 'test' })) })
    let date = '2026-10-28'; let suggested = 'meal-a'; let mode = 'valid'; let calls = 0; let release
    const meals = { breakfast: [], lunch: [], dinner: [] }
    const summary = () => ({ today: date, todaySchedule: { meals }, todayHints: [], week: { days: mode === 'badweek' ? [] : Array.from({ length: 7 }, (_, index) => ({ date: new Date(Date.parse(`${date}T00:00:00Z`) + (index - 3) * 86400000).toISOString().slice(0, 10), meals })) }, partnerWishlist: mode === 'removed' ? [] : [{ _id: 'wish-a', title: '家人想吃的菜', mealId: suggested ? { _id: suggested, name: '家常菜' } : null }], recentPhotos: [], defaultMeals: { imported: 1, total: 2 }, imageIssues: mode === 'invalid' ? null : { open: 0 }, meals: { favorites: 0 } })
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/dashboard/summary') {
        calls++
        if (mode === 'hold') await new Promise(resolve => { release = resolve })
        if (mode === 'failed') return route.fulfill({ status: 503, json: { error: '饭桌暂时不可用' } })
        return route.fulfill({ json: summary() })
      }
      if (path === '/api/wishlist') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/dashboard`)
    await page.getByText('家人想吃的菜').waitFor()
    assert.equal(calls, 1)
    date = '2026-10-29'; suggested = 'meal-b'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    await page.waitForURL('**/selection?*')
    let url = new URL(page.url())
    assert.equal(url.searchParams.get('date'), '2026-10-29')
    assert.equal(url.searchParams.get('suggestedMealId'), 'meal-b')
    assert.equal(url.searchParams.get('wishlistId'), 'wish-a')
    assert.equal(calls, 2, 'the action must refresh stale data before navigation')

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
    mode = 'valid'; suggested = ''
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByRole('button', { name: '查看心愿' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('button', { name: '查看心愿' }).click()
    await page.waitForURL('**/wishlist')

    mode = 'valid'; suggested = 'meal-a'
    await page.goto(`${base}/dashboard`)
    await page.getByRole('button', { name: '安排晚餐' }).waitFor()
    mode = 'hold'
    await page.getByRole('button', { name: '安排晚餐' }).click()
    for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(typeof release, 'function')
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/wishlist') })
    await page.waitForURL('**/wishlist')
    const response = page.waitForResponse(result => new URL(result.url()).pathname === '/api/dashboard/summary')
    mode = 'valid'; release(); await response
    await page.waitForTimeout(150)
    assert.equal(new URL(page.url()).pathname, '/wishlist', 'a late refresh must not redirect after leaving the dashboard')
    assert.deepEqual(errors, [])
    console.log('Dashboard checks passed: refreshed date and wish, unavailable and malformed data, and retry')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
