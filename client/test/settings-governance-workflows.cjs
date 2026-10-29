const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Settings tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' }))
    })
    let invalid = true
    let profileFailed = false
    const profile = { user: { id: 'u1', householdId: 'home-a' }, household: { id: 'home-a', name: '甲家庭', inviteCode: 'CODE', members: [{ _id: 'u1' }] } }
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') return profileFailed ? route.fulfill({ status: 503, json: { error: '资料不可用' } }) : route.fulfill({ json: profile })
      if (path === '/api/default-meals/status') return route.fulfill({ json: invalid ? { total: 3, imported: 2, missing: 2 } : { total: 3, imported: 2, missing: 1 } })
      if (path === '/api/meal-image-issues') return route.fulfill({ json: invalid ? { items: [] } : [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/settings`)
    await page.getByText('默认菜品状态加载失败，请重试后再操作。').waitFor()
    await page.getByText('图片反馈加载失败，请重试。').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).count(), 0)
    assert.equal(await page.getByText('暂无待修正图片').count(), 0)
    invalid = false
    await page.locator('.settings-card').filter({ hasText: '默认菜品管理' }).getByRole('button', { name: '重新加载' }).click()
    await page.getByText('暂无待修正图片').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).isEnabled(), true)
    profileFailed = true
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.locator('.settings-page').getByText('资料不可用').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).count(), 0)
    assert.equal(await page.getByText('暂无待修正图片').count(), 0)
    assert.equal(await page.getByText('请先加载并核对当前小家。').count(), 2)
    console.log('Settings governance checks passed: malformed data, independent recovery and unavailable profile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
