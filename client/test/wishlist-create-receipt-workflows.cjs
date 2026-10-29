const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Wishlist receipt tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let mode = 'bad'; let writes = 0
    await page.route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/wishlist' && request.method() === 'GET') return route.fulfill({ json: [] })
      if (path === '/api/wishlist' && request.method() === 'POST') {
        writes++
        const body = request.postDataJSON()
        return route.fulfill({ json: { _id: 'created', ...body, note: mode === 'bad' ? '错误备注' : body.note, status: 'open' } })
      }
      return route.fulfill({ json: [] })
    })
    await page.goto(`${base}/wishlist`)
    await page.getByRole('button', { name: '添加想吃' }).click()
    let dialog = page.getByRole('dialog', { name: '添加想吃' })
    const title = dialog.getByPlaceholder('比如：冬阴功火锅、楼下那家牛肉面')
    await title.fill('  家人想吃  ')
    await dialog.locator('textarea').fill('  少放辣  ')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('想吃记录保存结果未确认').waitFor()
    assert.equal(await title.inputValue(), '  家人想吃  ')
    assert.equal(await dialog.locator('textarea').inputValue(), '  少放辣  ')
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
    await dialog.getByRole('button', { name: '刷新列表并核对' }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '已核对，允许重试' }).click()
    await page.getByRole('dialog', { name: '确认重新提交？' }).getByRole('button', { name: '已核对，允许重试' }).click()
    dialog = page.getByRole('dialog', { name: '添加想吃' })
    assert.equal(await dialog.locator('textarea').inputValue(), '  少放辣  ')
    mode = 'valid'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(writes, 2)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('Wishlist creation receipts passed: mismatch preserves draft and confirmed retry succeeds')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
