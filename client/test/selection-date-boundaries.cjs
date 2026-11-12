const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Selection boundary tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const meal = { _id: 'meal-a', name: '家常菜', category: '家常菜', tags: [] }
    const writes = []
    await page.route('**/api/**', route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/meals/categories') return route.fulfill({ json: [{ category: '家常菜' }] })
      if (path === '/meals/tags') return route.fulfill({ json: [] })
      if (path === '/meals') return route.fulfill({ json: { data: [meal], page: 1, limit: 8, total: 1 } })
      if (path.startsWith('/schedules/day/')) return route.fulfill({ json: { date: path.split('/').pop(), scheduleExists: false, scheduleVersion: null, meals: { breakfast: [], lunch: [], dinner: [] } } })
      if (req.method() === 'PUT' && path.startsWith('/schedules/')) {
        const body = req.postDataJSON(); writes.push(body)
        return route.fulfill({ json: { date: path.split('/')[2], updatedAt: '2026-10-29T09:00:00.000Z', meals: { breakfast: [], lunch: [], dinner: body.mealIds.map(() => ({ meal })) } } })
      }
      if (path === '/weekly-plans') {
        const week = url.searchParams.get('weekStart'); const start = Date.parse(`${week}T12:00:00Z`)
        return route.fulfill({ json: { weekStart: week, supportsConditionalApply: true, days: Array.from({ length: 7 }, (_, i) => ({ date: new Date(start + i * 86400000).toISOString().slice(0, 10), scheduleExists: false, scheduleVersion: null, meals: { breakfast: [], lunch: [], dinner: [] } })) } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/selection?date=0100-01-04&mealType=dinner`)
    await page.getByText('此日期超出日历支持范围；保存后将打开对应周计划。').waitFor()
    await page.getByRole('button', { name: '选择家常菜' }).click()
    await page.getByRole('button', { name: '保存安排', exact: true }).click()
    await page.waitForURL('**/weekly-plan?week=0100-01-04')
    assert.equal(writes[0].expectedVersion, null)

    await page.goto(`${base}/selection?date=0100-01-01&mealType=dinner`)
    await page.getByText('此日期超出日历和完整周计划支持范围；保存后会留在本页供核对。').waitFor()
    await page.getByRole('button', { name: '选择家常菜' }).click()
    await page.getByRole('button', { name: '保存安排', exact: true }).click()
    await page.getByText('安排已保存；此日期无法在日历或周计划中打开，当前内容可留在本页核对。').waitFor()
    assert.equal(new URL(page.url()).pathname, '/selection')
    await page.getByRole('button', { name: '移除家常菜' }).click()
    await page.getByText('上次安排已保存；本页之后的改动尚未保存。此日期无法在日历或周计划中打开。').waitFor()
    await page.getByRole('button', { name: '保存安排', exact: true }).click()
    await page.getByRole('button', { name: '确认清空' }).click()
    await page.getByText('安排已保存；此日期无法在日历或周计划中打开，当前内容可留在本页核对。').waitFor()
    assert.equal(writes[2].expectedVersion, '2026-10-29T09:00:00.000Z', 'a second save uses the version from the confirmed first save')
    console.log('Selection date boundary checks passed')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
