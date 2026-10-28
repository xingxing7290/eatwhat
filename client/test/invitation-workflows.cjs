const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Invitation tests require a local test server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test', householdId: 'home-a' }))
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedInvite = text } } })
    })
    const page = await context.newPage()
    page.setDefaultTimeout(12000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let home = 'home-a'
    const codes = { 'home-a': 'HOMEA1', 'home-b': 'HOMEB1' }
    let refreshMode = 'uncertain'
    let invalidProfile = false
    let releaseRefresh
    let refreshCalls = 0
    let joinCalls = 0
    const household = id => ({ id, name: id === 'home-a' ? '甲家庭' : '乙家庭', inviteCode: codes[id], members: [{ _id: 'u1', username: 'test', displayName: '测试用户' }] })
    const profile = () => ({ user: { id: 'u1', username: 'test', displayName: '测试用户', householdId: home }, household: household(home) })
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request()
      const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = invalidProfile ? { user: { id: 'u1', householdId: 'wrong-home' }, household: household(home) } : profile()
      else if (req.method() === 'GET' && path === '/default-meals/status') data = { total: 0, imported: 0, missing: 0 }
      else if (req.method() === 'GET' && path === '/meal-image-issues') data = []
      else if (req.method() === 'POST' && path === '/household/invite/refresh') {
        refreshCalls++
        if (refreshMode === 'uncertain') { codes[home] = 'HOMEA2'; return route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
        if (refreshMode === 'malformed') { const old = codes[home]; codes[home] = 'HOMEA3'; data = { household: { ...household(home), inviteCode: old } } }
        if (refreshMode === 'hold') { await new Promise(resolve => { releaseRefresh = resolve }); codes[home] = 'HOMEA4'; data = { household: household(home) } }
      } else if (req.method() === 'POST' && path === '/household/join') {
        joinCalls++
        assert.equal(req.postDataJSON().inviteCode, 'HOMEB1')
        home = 'home-b'
        data = { ...profile(), user: { ...profile().user, householdId: 'home-a' } }
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/settings`)
    await page.getByText('甲家庭', { exact: true }).waitFor()
    const card = page.locator('.settings-card').filter({ hasText: '情侣小家' })
    await card.getByRole('button', { name: '复制邀请链接' }).click()
    assert.match(await page.evaluate(() => window.__copiedInvite), /\/apply-account#invite=HOMEA1$/)
    await card.getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByRole('button', { name: '刷新邀请码' }).click()
    await page.getByText('邀请码刷新结果未确认').waitFor()
    await card.getByPlaceholder('请先重新核对').waitFor()
    assert.equal(await card.getByRole('button', { name: '复制邀请链接' }).isDisabled(), true)
    invalidProfile = true
    await page.getByRole('button', { name: '重新核对邀请码' }).click()
    await page.getByText('家庭信息不完整，请重试').waitFor()
    assert.equal(await card.getByRole('button', { name: '复制邀请码' }).isDisabled(), true)
    invalidProfile = false
    await page.getByRole('button', { name: '重新核对邀请码' }).click()
    await page.getByText('邀请码刷新结果未确认').waitFor({ state: 'hidden' })
    await card.getByRole('button', { name: '复制邀请码' }).click()
    assert.equal(await page.evaluate(() => window.__copiedInvite), 'HOMEA2')

    refreshMode = 'malformed'
    await card.getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByRole('button', { name: '刷新邀请码' }).click()
    await page.getByText('邀请码刷新结果未确认').waitFor()
    await page.getByRole('button', { name: '重新核对邀请码' }).click()
    await page.getByText('邀请码刷新结果未确认').waitFor({ state: 'hidden' })
    refreshMode = 'hold'
    await card.getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByRole('button', { name: '刷新邀请码' }).click()
    await page.waitForFunction(() => document.querySelector('.settings-page') && [...document.querySelectorAll('button')].some(button => button.textContent.trim() === '复制邀请链接' && button.disabled))
    assert.equal(refreshCalls, 3)
    assert.equal(typeof releaseRefresh, 'function')
    releaseRefresh()
    await page.getByText('邀请码已刷新').waitFor()
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('user'))).household.inviteCode, 'HOMEA4')
    await card.getByRole('button', { name: '复制邀请链接' }).click()
    assert.match(await page.evaluate(() => window.__copiedInvite), /\/apply-account#invite=HOMEA4$/)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)

    await page.goto(`${base}/apply-account#invite=${'A'.repeat(21)}`)
    await page.getByText('邀请链接中的邀请码过长', { exact: false }).waitFor()
    assert.equal(await page.getByPlaceholder('请输入家人的邀请码').inputValue(), '')
    assert.equal(await page.getByRole('button', { name: '使用当前账号加入' }).isDisabled(), true)
    await page.waitForURL('**/apply-account')
    await page.goto(`${base}/settings#invite=${'B'.repeat(21)}`)
    await page.getByText('邀请链接中的邀请码过长', { exact: false }).waitFor()
    assert.equal(await page.getByPlaceholder('输入伴侣的邀请码').inputValue(), '')
    await page.waitForURL('**/settings')
    assert.equal(joinCalls, 0, 'oversized links are rejected rather than truncated into another invitation')
    await page.goto(`${base}/apply-account#invite=HOMEB1`)
    await page.getByRole('button', { name: '使用当前账号加入' }).click()
    await page.waitForURL('**/settings')
    assert.equal(await page.getByPlaceholder('输入伴侣的邀请码').inputValue(), 'HOMEB1')
    assert.equal(joinCalls, 0, 'opening a link never switches household automatically')
    await page.getByRole('button', { name: '加入', exact: true }).click()
    await page.getByRole('button', { name: '确认加入' }).click()
    await page.getByText('家庭切换结果未确认').waitFor()
    assert.equal(await page.getByRole('button', { name: '加入', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: '重新核对家庭' }).click()
    await page.getByText('乙家庭', { exact: true }).waitFor()
    assert.equal(await page.getByText('家庭切换结果未确认').count(), 0)
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('user'))).householdId, 'home-b')
    assert.deepEqual(errors, [])
    console.log('Invitation workflows passed: rotated links, uncertain responses, session joining and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
