const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Catalog tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const meals = [{ _id: 'one', name: '无分类菜', category: '', tags: [] }, { _id: 'two', name: '有分类菜', category: '热菜', tags: [] }]
    let mode = 'new'; const requests = []
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()); const path = url.pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/categories') return route.fulfill({ json: [{ category: '', subcategory: '', count: 1 }, { category: '热菜', subcategory: '', count: 1 }] })
      if (path === '/api/meals/tags') return route.fulfill({ json: [] })
      if (path === '/api/meals') {
        requests.push(url.searchParams.toString())
        if (mode === 'legacy') return route.fulfill({ json: meals })
        const rows = mode === 'new' && url.searchParams.get('uncategorized') === '1' ? meals.filter(item => !item.category) : meals
        return route.fulfill({ json: { data: rows, total: rows.length, page: 1, limit: 8, ...(mode === 'new' ? { supportsUncategorizedFilter: true } : {}) } })
      }
      return route.fulfill({ json: [] })
    })
    await page.goto(`${base}/meals`)
    const sidebar = page.getByRole('complementary', { name: '菜品分类' })
    await page.getByRole('button', { name: '查看有分类菜' }).first().waitFor()
    await sidebar.getByRole('button', { name: '未分类' }).click()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    await page.waitForFunction(() => new URL(location.href).searchParams.get('uncategorized') === '1')
    assert.ok(requests.some(query => new URLSearchParams(query).get('uncategorized') === '1'))
    await page.reload()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await sidebar.getByRole('button', { name: '未分类' }).getAttribute('aria-pressed'), 'true')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    mode = 'old-paged'; await page.reload()
    await page.getByText('当前服务器不支持未分类筛选', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    mode = 'legacy'; await page.reload()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    await page.getByRole('button', { name: '移除分类：未分类筛选' }).click()
    await page.getByText('全部菜品 · 2 道').waitFor()
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('uncategorized'))
    console.log('Catalog uncategorized filtering passed: scoped capability, links, legacy servers and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
