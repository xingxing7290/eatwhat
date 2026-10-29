const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Settings pagination tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' })) })
    let issues = Array.from({ length: 45 }, (_, i) => ({ _id: `issue-${i}`, mealId: null, note: `反馈 ${String(i).padStart(2, '0')}` }))
    let bad = ''; const reads = []; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') return route.fulfill({ json: { user: { id: 'u1', householdId: 'home-a' }, household: { id: 'home-a', name: '我的家', inviteCode: 'CODE', members: [{ _id: 'u1' }] } } })
      if (path === '/api/default-meals/status') return route.fulfill({ json: { total: 0, imported: 0, missing: 0 } })
      if (path === '/api/meal-image-issues') {
        const number = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit'))
        reads.push(number); assert.equal(limit, 20)
        const total = issues.length; const rows = issues.slice((number - 1) * limit, number * limit)
        if (bad === 'duplicate' && rows.length > 1) rows[1] = rows[0]
        return route.fulfill({ json: { supportsImageIssuePagination: true, householdId: bad === 'foreign' ? 'home-b' : 'home-a', page: number, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), items: rows } })
      }
      if (path === '/api/meal-image-issues/issue-20' && request.method() === 'PATCH') {
        issues = issues.filter(issue => issue._id !== 'issue-20')
        return route.fulfill({ json: { _id: 'issue-20', status: 'fixed' } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/settings?section=issues`)
    const pagination = page.getByRole('navigation', { name: '图片反馈分页' })
    await pagination.getByText('第 1 / 3 页 · 共 45 条').waitFor()
    assert.equal(await page.locator('.issue-item').count(), 20)
    assert.equal(await page.getByText('反馈 00', { exact: true }).count(), 1)
    assert.equal(await page.getByText('反馈 20', { exact: true }).count(), 0)
    const nickname = page.getByPlaceholder('请输入昵称'); await nickname.fill('保留的昵称')
    await pagination.getByRole('button', { name: '下一页' }).click()
    await pagination.getByText('第 2 / 3 页 · 共 45 条').waitFor()
    await page.getByText('反馈 20', { exact: true }).waitFor()
    assert.equal(await nickname.inputValue(), '保留的昵称')
    await pagination.getByRole('button', { name: '下一页' }).click()
    await pagination.getByText('第 3 / 3 页 · 共 45 条').waitFor()
    assert.equal(await page.locator('.issue-item').count(), 5)
    issues = issues.slice(0, 21)
    await page.getByRole('button', { name: '刷新图片反馈' }).click()
    await pagination.getByText('第 2 / 2 页 · 共 21 条').waitFor()
    assert.equal(await page.locator('.issue-item').count(), 1)
    assert.deepEqual(reads.slice(-2), [3, 2], 'a removed last page reloads the new final page')
    await page.getByRole('button', { name: '标记已修正：未知菜品' }).focus(); await page.keyboard.press('Enter')
    await page.getByText('反馈 00', { exact: true }).waitFor()
    assert.equal(await page.locator('.issue-item').count(), 20)
    assert.equal(await pagination.count(), 0, 'one remaining page does not need pagination controls')
    assert.equal(await nickname.inputValue(), '保留的昵称')
    bad = 'duplicate'; await page.getByRole('button', { name: '刷新图片反馈' }).click()
    await page.getByText('图片反馈加载失败，请重试。').waitFor()
    assert.equal(await page.locator('.issue-item').count(), 0, 'invalid results must not display stale records')
    bad = 'foreign'; const foreignResponse = page.waitForResponse(response => response.url().includes('/api/meal-image-issues?'))
    await page.getByRole('region', { name: '待修正图片' }).getByRole('button', { name: '重新加载' }).click(); await foreignResponse
    await page.waitForFunction(() => !document.querySelector('[aria-label="待修正图片"] .el-button.is-loading'))
    await page.getByText('图片反馈加载失败，请重试。').waitFor()
    assert.equal(await page.locator('.issue-item').count(), 0, 'another household must not be displayed')
    bad = ''; await page.getByRole('region', { name: '待修正图片' }).getByRole('button', { name: '重新加载' }).click()
    await page.getByText('反馈 00', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log('Settings image feedback pagination passed: paging, household scope, shrinking lists and recovery')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
