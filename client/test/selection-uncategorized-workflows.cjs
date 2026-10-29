const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Selection tests require a local server')
const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
const meals = [{ _id: 'one', name: '已分类菜', category: '家常菜', tags: [] }, { _id: 'two', name: '空分类菜', category: '', tags: [] }]
const empty = () => ({ breakfast: [], lunch: [], dinner: [] })
async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let mode = 'new'
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()); const path = url.pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/categories') return route.fulfill({ json: [{ category: '家常菜', subcategory: '' }] })
      if (path === '/api/meals/tags') return route.fulfill({ json: [] })
      if (path === '/api/meals') {
        if (mode === 'legacy') return route.fulfill({ json: meals })
        const rows = mode === 'new' && url.searchParams.get('uncategorized') === '1' ? meals.filter(meal => !meal.category) : meals
        return route.fulfill({ json: { data: rows, total: rows.length, page: 1, limit: 8, ...(mode === 'new' ? { supportsUncategorizedFilter: true } : {}) } })
      }
      if (path === '/api/schedules/day/2026-10-29') return route.fulfill({ json: { date: '2026-10-29', scheduleExists: false, scheduleVersion: null, meals: empty() } })
      if (path === '/api/weekly-plans') return route.fulfill({ json: { weekStart: dates[0], supportsConditionalApply: true, days: dates.map(date => ({ date, meals: empty(), scheduleExists: false, scheduleVersion: null })) } })
      if (path === '/api/weekly-plans/generate') {
        const days = dates.map(date => ({ date, meals: empty() }))
        return route.fulfill({ json: { weekStart: dates[0], days, preview: days.map(day => ({ ...day, hints: [] })) } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/selection?date=2026-10-29&mealType=dinner`)
    await page.getByRole('button', { name: '选择已分类菜' }).click()
    await page.getByRole('complementary', { name: '菜品分类' }).getByRole('button', { name: '未填写分类' }).click()
    await page.getByText('筛选结果 · 1 道').waitFor()
    await page.getByRole('button', { name: '选择空分类菜' }).waitFor()
    assert.equal(await page.getByRole('button', { name: '选择已分类菜' }).count(), 0)
    await page.getByRole('button', { name: '移除已分类菜' }).waitFor()
    await page.getByRole('button', { name: '选择空分类菜' }).click()
    await page.getByRole('button', { name: '移除空分类菜' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    mode = 'old'; const sidebar = page.getByRole('complementary', { name: '菜品分类' })
    await sidebar.getByRole('button', { name: '全部分类' }).click()
    await page.getByText('全部菜品 · 2 道').waitFor()
    await sidebar.getByRole('button', { name: '未填写分类' }).click()
    await page.getByText('当前服务器不支持未分类筛选', { exact: false }).waitFor()
    await page.getByRole('button', { name: '移除空分类菜' }).waitFor()
    mode = 'legacy'; await page.getByRole('button', { name: '重新加载菜品' }).click()
    await page.getByText('筛选结果 · 1 道').waitFor()
    await page.getByRole('button', { name: '移除已分类菜' }).waitFor()
    mode = 'new'
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/weekly-plan?week=2026-10-26') })
    await page.getByRole('button', { name: '放弃并离开' }).click()
    await page.waitForURL('**/weekly-plan?week=2026-10-26')
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByRole('button', { name: '调整2026-10-26晚餐' }).click()
    const dialog = page.getByRole('dialog', { name: '调整 2026-10-26 晚餐' })
    await dialog.getByRole('button', { name: '选择已分类菜' }).click()
    await dialog.getByRole('complementary', { name: '周计划菜品分类' }).getByRole('button', { name: '未填写分类' }).click()
    await dialog.getByRole('button', { name: '取消选择已分类菜' }).waitFor({ state: 'hidden' })
    await dialog.getByRole('button', { name: '选择空分类菜' }).waitFor()
    await dialog.getByRole('button', { name: '移除已分类菜' }).waitFor()
    await dialog.getByRole('button', { name: '选择空分类菜' }).click()
    mode = 'old'
    const weeklySidebar = dialog.getByRole('complementary', { name: '周计划菜品分类' })
    await weeklySidebar.getByRole('button', { name: '全部', exact: true }).click()
    await dialog.getByRole('button', { name: '取消选择已分类菜' }).waitFor()
    await weeklySidebar.getByRole('button', { name: '未填写分类' }).click()
    await dialog.getByText('当前服务器不支持未分类筛选', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '移除空分类菜' }).waitFor()
    mode = 'legacy'; await dialog.getByRole('button', { name: '重试' }).click()
    await dialog.getByRole('button', { name: '取消选择空分类菜' }).waitFor()
    await dialog.getByRole('button', { name: '保存到草稿' }).click()
    await page.getByRole('link', { name: '在新标签页查看草稿中2026-10-26晚餐的空分类菜菜谱' }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('Selection uncategorized filtering passed: chosen dishes remain across filters and weekly draft editing')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
