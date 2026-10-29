const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
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
    let profileFault = 'mismatch'
    let releaseRefresh
    let notifyRefreshStarted
    const refreshStarted = new Promise(resolve => { notifyRefreshStarted = resolve })
    let refreshCalls = 0
    let joinCalls = 0
    const household = id => ({ id, name: id === 'home-a' ? '甲家庭' : '乙家庭', inviteCode: codes[id], members: [{ _id: 'u1', username: 'test', displayName: '测试用户' }] })
    const profile = () => ({ user: { id: 'u1', username: 'test', displayName: '测试用户', householdId: home }, household: household(home) })
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request()
      const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') {
        data = invalidProfile || profileFault === 'mismatch' ? { user: { id: 'u1', householdId: 'wrong-home' }, household: household(home) } : profile()
        if (profileFault === 'wrong-user') data = { user: { id: 'other-user', householdId: home }, household: { ...household(home), members: [{ _id: 'other-user' }] } }
        if (profileFault === 'foreign-home') data = { user: { id: 'u1', householdId: 'home-b' }, household: household('home-b') }
        if (profileFault === 'not-member') data = { ...profile(), household: { ...household(home), members: [] } }
        if (profileFault === 'long-code') data = { ...profile(), household: { ...household(home), inviteCode: 'A'.repeat(21) } }
      }
      else if (req.method() === 'PUT' && path === '/auth/profile') data = profileFault === 'save-foreign' ? { user: { id: 'u1', householdId: 'home-b' }, household: household('home-b') } : profile()
      else if (req.method() === 'POST' && path === '/auth/avatar') data = profileFault === 'avatar-foreign' ? { user: { id: 'other-user', householdId: home }, household: { ...household(home), members: [{ _id: 'other-user' }] } } : profile()
      else if (req.method() === 'GET' && path === '/default-meals/status') data = { total: 0, imported: 0, missing: 0 }
      else if (req.method() === 'GET' && path === '/meal-image-issues') data = []
      else if (req.method() === 'POST' && path === '/household/invite/refresh') {
        refreshCalls++
        if (refreshMode === 'uncertain') { codes[home] = 'HOMEA2'; return route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
        if (refreshMode === 'malformed') { const old = codes[home]; codes[home] = 'HOMEA3'; data = { household: { ...household(home), inviteCode: old } } }
        if (refreshMode === 'hold') { await new Promise(resolve => { releaseRefresh = resolve; notifyRefreshStarted() }); codes[home] = 'HOMEA4'; data = { household: household(home) } }
      } else if (req.method() === 'POST' && path === '/household/join') {
        joinCalls++
        assert.equal(req.postDataJSON().inviteCode, 'HOMEB1')
        home = 'home-b'
        data = { ...profile(), user: { ...profile().user, householdId: 'home-a' } }
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/settings`)
    await page.getByText('家庭信息不完整，请重试').waitFor()
    const card = page.locator('.settings-card').filter({ hasText: '情侣小家' })
    assert.equal(await card.getByRole('button', { name: '复制邀请链接' }).isDisabled(), true)
    for (const fault of ['wrong-user', 'foreign-home', 'not-member', 'long-code']) {
      profileFault = fault
      await page.getByRole('button', { name: '重新加载', exact: true }).click()
      await page.getByText('家庭信息不完整，请重试').waitFor()
      assert.equal(await card.getByRole('button', { name: '复制邀请码' }).isDisabled(), true)
    }
    profileFault = ''
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await page.getByText('甲家庭', { exact: true }).waitFor()
    profileFault = 'save-foreign'
    await page.getByPlaceholder('请输入昵称').fill('未确认的昵称')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('个人资料更新结果未确认').waitFor()
    assert.equal(await card.getByRole('button', { name: '复制邀请链接' }).isDisabled(), true)
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('user'))).householdId, 'home-a')
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.profile-uncertain-alert .el-alert__title', '.profile-uncertain-alert .el-alert__description', '.profile-uncertain-alert .el-button']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.getByRole('button', { name: '重新核对资料' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByPlaceholder('请输入昵称').inputValue(), '未确认的昵称')
    profileFault = ''
    await page.getByRole('button', { name: '重新核对资料' }).click()
    await page.getByRole('button', { name: '放弃并刷新' }).click()
    await page.getByText('个人资料更新结果未确认').waitFor({ state: 'hidden' })
    profileFault = 'avatar-foreign'
    await page.locator('input[type="file"]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('test-image') })
    await page.getByRole('button', { name: '上传头像' }).click()
    await page.getByText('个人资料更新结果未确认').waitFor()
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem('user'))).householdId, 'home-a')
    assert.equal(await card.getByRole('button', { name: '复制邀请码' }).isDisabled(), true)
    profileFault = ''
    await page.getByRole('button', { name: '重新核对资料' }).click()
    await page.getByRole('button', { name: '放弃并刷新' }).click()
    await page.getByText('个人资料更新结果未确认').waitFor({ state: 'hidden' })
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
    await Promise.race([refreshStarted, new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh request did not start')), 12000))])
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
