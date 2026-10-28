const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Session expiry checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    for (const expiry of ['probe', 'write']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' })) })
      let writes = 0
      await page.route('**/api/**', route => {
        const req = route.request(); const path = new URL(req.url()).pathname
        if (path === '/api/auth/household-scope') return expiry === 'probe' ? route.fulfill({ status: 401, json: { error: '无效令牌' } }) : route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
        if (path === '/api/meals' && req.method() === 'POST') { writes++; return route.fulfill({ status: 401, json: { error: '无效令牌' } }) }
        return route.fulfill({ json: {} })
      })
      await page.goto(`${base}/meals/editor`)
      await page.getByPlaceholder('给这道菜起个名字').fill('登录失效时的草稿')
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await page.locator('.session-warning').getByText('登录状态已失效').waitFor()
      assert.equal(writes, expiry === 'probe' ? 0 : 1)
      assert.equal(await page.getByPlaceholder('给这道菜起个名字').inputValue(), '登录失效时的草稿')
      const blockedAgain = await page.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); return api.dashboard.summary().then(() => null, error => ({ code: error.code, requestSent: error.requestSent })) })
      assert.deepEqual(blockedAgain, { code: 'SESSION_EXPIRED', requestSent: false })
      if (expiry === 'write') await page.getByText('保存结果未确认', { exact: false }).first().waitFor()
      await page.locator('.session-warning').getByRole('button', { name: '重新登录' }).click()
      await page.getByRole('button', { name: '继续保留草稿' }).click()
      assert.equal(await page.getByPlaceholder('给这道菜起个名字').inputValue(), '登录失效时的草稿')
      assert.equal(await page.locator('.session-warning').getByText('暂时无法确认家庭保护').count(), 0)
      await page.close()
    }

    const login = await browser.newPage()
    await login.route('**/api/**', route => route.fulfill({ status: 401, json: { error: '用户名或密码错误' } }))
    await login.goto(`${base}/login`)
    await login.getByPlaceholder('请输入用户名').fill('wrong')
    await login.getByPlaceholder('请输入密码').fill('wrong-password')
    await login.getByRole('button', { name: '立即登录' }).click()
    await login.getByText('用户名或密码错误').first().waitFor()
    assert.equal(await login.locator('.session-warning').count(), 0, 'failed login must not be treated as an expired authenticated session')
    await login.close()

    const context = await browser.newContext()
    const first = await context.newPage()
    let release; let started
    const pendingStart = new Promise(resolve => { started = resolve })
    await context.route('**/api/**', async route => {
      const req = route.request()
      if (req.url().endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      started(); await new Promise(resolve => { release = resolve })
      return route.fulfill({ status: 401, json: { error: '旧账号令牌失效' } })
    })
    await first.goto(`${base}/login`)
    await first.evaluate(() => { localStorage.setItem('token', 'old-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' })) })
    await first.goto(`${base}/meals/editor`)
    await first.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); window.late = api.dashboard.summary().then(() => null, error => error.code) })
    await pendingStart
    const second = await context.newPage(); await second.goto(`${base}/login`)
    await second.evaluate(() => localStorage.setItem('token', 'new-token'))
    await first.locator('.session-warning').getByText('账号或小家已变化').waitFor()
    release()
    assert.equal(await first.evaluate(() => window.late), 'SESSION_CHANGED')
    assert.equal(await first.locator('.session-warning').getByText('登录状态已失效').count(), 0, 'a late 401 must not invalidate a newer session')
    await context.close()

    const relogin = await browser.newPage()
    let releaseOld; let oldStarted
    const oldRequest = new Promise(resolve => { oldStarted = resolve })
    let held = false
    await relogin.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname
      if (path === '/api/auth/login') return route.fulfill({ json: { token: 'new-session', user: { id: 'u2', householdId: 'home-b', username: 'new' } } })
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: req.headers()['x-eatwhat-household'] } })
      if (path === '/api/dashboard/summary' && !held) { held = true; oldStarted(); await new Promise(resolve => { releaseOld = resolve }); return route.fulfill({ status: 401, json: { error: '旧账号令牌失效' } }) }
      return route.fulfill({ json: {} })
    })
    await relogin.goto(`${base}/login`)
    await relogin.evaluate(() => { localStorage.setItem('token', 'old-session'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' })) })
    await relogin.goto(`${base}/meals/editor`)
    await relogin.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); window.lateOld = api.dashboard.summary().then(() => null, error => error.code) })
    await oldRequest
    await relogin.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/login'))
    await relogin.getByPlaceholder('请输入用户名').fill('new')
    await relogin.getByPlaceholder('请输入密码').fill('test-password')
    await relogin.getByRole('button', { name: '立即登录' }).click()
    await relogin.waitForURL('**/dashboard')
    releaseOld()
    assert.equal(await relogin.evaluate(() => window.lateOld), 'SESSION_CHANGED')
    assert.equal(await relogin.locator('.session-warning').count(), 0, 'old 401 must not lock a newly authenticated account in the same tab')
    assert.equal(await relogin.evaluate(() => localStorage.getItem('token')), 'new-session')
    await relogin.close()
    console.log('Session expiry checks passed: probe, in-flight request, failed login and stale response')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
