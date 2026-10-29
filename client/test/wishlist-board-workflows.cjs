const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Wishlist checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const rows = Array.from({ length: 29 }, (_, i) => ({ _id: `w${String(i).padStart(2, '0')}`, title: `心愿${String(i).padStart(2, '0')}`, note: '', category: '家常', status: i < 20 ? 'open' : i < 26 ? 'planned' : i < 28 ? 'done' : 'legacy', priority: 'normal', votes: [], supportsSafeMealLink: true, supportsMealLinkVisibility: true, mealLinkStatus: 'unlinked', createdAt: new Date(1700000000000 - i * 1000).toISOString() }))
    const errors = []; const requests = []; let releaseSlow; let detailError = false
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/meals' && request.method() === 'POST') return route.fulfill({ status: 503, json: { error: '模拟创建响应丢失' } })
      if (path.startsWith('/wishlist/') && request.method() === 'GET') return detailError ? route.fulfill({ status: 404, json: { code: 'WISH_NOT_FOUND', error: '模拟记录暂时不可读' } }) : route.fulfill({ json: rows.find(row => row._id === path.split('/').pop()) || {} })
      if (path === '/wishlist' && request.method() === 'GET') {
        const query = Object.fromEntries(url.searchParams); requests.push(query)
        if (query.search === '心愿01') await new Promise(resolve => { releaseSlow = resolve })
        const bucket = row => ['open', 'planned', 'done'].includes(row.status) ? row.status : 'unknown'
        const totals = { open: 0, planned: 0, done: 0, unknown: 0 }; const matched = { ...totals }
        rows.forEach(row => totals[bucket(row)]++)
        const filtered = rows.filter(row => (query.status === 'all' || bucket(row) === query.status) && (query.priority === 'all' || row.priority === query.priority) && (!query.search || [row.title, row.note, row.category].some(value => value.includes(query.search))))
        filtered.forEach(row => matched[bucket(row)]++)
        const number = Number(query.page); const limit = Number(query.limit)
        return route.fulfill({ json: { supportsWishlistBoard: true, page: number, limit, search: query.search, status: query.status, priority: query.priority, matched, totals, total: filtered.length, items: filtered.slice((number - 1) * limit, number * limit) } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/wishlist`)
    await page.getByText('共 29 条匹配记录 · 第 1 / 3 页').waitFor()
    assert.equal(await page.locator('.wish-card').count(), 12)
    assert.equal(requests[0].view, 'board')
    await page.locator('.wish-card').filter({ hasText: '心愿00' }).getByRole('button', { name: '转菜品' }).click()
    await page.locator('.wish-card').filter({ hasText: '心愿00' }).getByText('创建结果不确定', { exact: false }).waitFor()
    await page.getByRole('button', { name: '下一页' }).click()
    await page.getByText('共 29 条匹配记录 · 第 2 / 3 页').waitFor()
    await page.getByText('有 1 条关联或创建结果待核对的记录不在当前结果中。').waitFor()
    detailError = true
    await page.getByRole('button', { name: '查看待核对记录' }).click()
    await page.getByText('想吃清单暂时无法加载', { exact: false }).waitFor()
    await page.getByRole('button', { name: '返回全部清单' }).click()
    await page.getByRole('button', { name: '查看待核对记录' }).waitFor()
    detailError = false
    await page.getByRole('button', { name: '查看待核对记录' }).click()
    await page.locator('.wish-card').filter({ hasText: '心愿00' }).getByText('创建结果不确定', { exact: false }).waitFor()
    await page.getByRole('button', { name: '返回全部清单' }).click()
    await page.getByText('共 29 条匹配记录 · 第 2 / 3 页').waitFor()
    const search = page.getByRole('textbox', { name: '搜索想吃记录' })
    await search.fill('心愿01')
    await page.waitForFunction(() => document.querySelector('.filter-heading p')?.textContent.includes('正在更新'))
    await page.waitForRequest(request => request.url().includes('search=%E5%BF%83%E6%84%BF01'))
    await search.fill('心愿02')
    await page.getByText('共 1 条匹配记录 · 第 1 / 1 页').waitFor()
    await page.getByText('心愿02', { exact: true }).waitFor()
    releaseSlow()
    await page.waitForTimeout(300)
    assert.equal(await page.getByText('心愿01', { exact: true }).count(), 0, 'stale response must not replace newer search')
    await search.fill('')
    await page.getByText('共 29 条匹配记录 · 第 1 / 3 页').waitFor()
    await page.getByRole('group', { name: '按状态筛选' }).getByRole('button', { name: '待核对' }).click()
    await page.getByText('共 1 条匹配记录 · 第 1 / 1 页').waitFor()
    const unknown = page.locator('.wish-card').filter({ hasText: '心愿28' })
    await unknown.getByText('记录状态无法识别', { exact: false }).waitFor()
    assert.equal(await unknown.getByRole('button').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log('Wishlist board checks passed: pagination, stale searches and hidden pending recovery')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
