const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Session checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const first = await context.newPage()
    let release; let requestStarted
    const started = new Promise(resolve => { requestStarted = resolve })
    const blocked = new Promise(resolve => { release = resolve })
    let writes = 0; let sentAuthorization = ''
    await context.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname
      if (path === '/api/dashboard/summary') {
        sentAuthorization = req.headers().authorization || ''
        requestStarted(); await blocked
        return route.fulfill({ json: { privateValue: 'old-account-data' } })
      }
      if (path === '/api/meals' && req.method() === 'POST') writes++
      return route.fulfill({ json: {} })
    })
    await first.goto(`${base}/login`)
    await first.evaluate(() => { localStorage.setItem('token', 'account-a'); localStorage.setItem('user', JSON.stringify({ id: 'a', username: 'a' })) })
    await first.goto(`${base}/meals/editor`)
    await first.getByRole('heading', { name: '创建菜品' }).waitFor()
    await first.getByPlaceholder('给这道菜起个名字').fill('需要保留的草稿')
    await first.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); window.pendingResult = api.dashboard.summary().then(() => ({ success: true }), error => ({ code: error.code, requestSent: error.requestSent })) })
    await started
    const second = await context.newPage()
    await second.goto(`${base}/login`)
    await second.evaluate(() => { localStorage.setItem('token', 'account-b'); localStorage.setItem('user', JSON.stringify({ id: 'b', username: 'b' })) })
    await first.getByRole('alert').filter({ hasText: '账号或小家已在其他页面变化' }).waitFor()
    release()
    assert.deepEqual(await first.evaluate(() => window.pendingResult), { code: 'SESSION_CHANGED', requestSent: true })
    assert.equal(sentAuthorization, 'Bearer account-a', 'in-flight request must keep its original account')
    await first.getByRole('button', { name: '保存', exact: true }).click()
    await first.getByText('本次请求未发送', { exact: false }).first().waitFor()
    assert.equal(writes, 0, 'draft must not be submitted under the new account')
    assert.equal(await first.getByPlaceholder('给这道菜起个名字').inputValue(), '需要保留的草稿')
    await second.evaluate(() => localStorage.setItem('token', 'account-a'))
    assert.equal(await first.getByRole('alert').filter({ hasText: '账号或小家已在其他页面变化' }).count(), 1, 'reverting a token must not silently unlock the stale page')
    await first.getByRole('button', { name: '重新加载', exact: true }).click()
    await first.getByRole('button', { name: '继续保留草稿' }).click()
    assert.equal(await first.getByPlaceholder('给这道菜起个名字').inputValue(), '需要保留的草稿')
    await context.close()

    const householdContext = await browser.newContext()
    const householdPage = await householdContext.newPage()
    await householdContext.route('**/api/**', route => route.fulfill({ json: {} }))
    await householdPage.goto(`${base}/login`)
    await householdPage.evaluate(() => { localStorage.setItem('token', 'same-account'); localStorage.setItem('user', JSON.stringify({ id: 'same-user', householdId: 'home-a', displayName: '原昵称' })) })
    await householdPage.goto(`${base}/meals/editor`)
    await householdPage.getByPlaceholder('给这道菜起个名字').fill('家庭草稿')
    const householdOtherTab = await householdContext.newPage()
    await householdOtherTab.goto(`${base}/login`)
    await householdOtherTab.evaluate(() => { const user = JSON.parse(localStorage.getItem('user')); user.displayName = '新昵称'; localStorage.setItem('user', JSON.stringify(user)) })
    await householdPage.waitForTimeout(150)
    assert.equal(await householdPage.locator('.session-warning').count(), 0, 'profile-only changes must not lock the page')
    await householdOtherTab.evaluate(() => { const user = JSON.parse(localStorage.getItem('user')); user.householdId = 'home-b'; localStorage.setItem('user', JSON.stringify(user)) })
    await householdPage.getByRole('alert').filter({ hasText: '账号或小家已在其他页面变化' }).waitFor()
    const rejected = await householdPage.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); return api.meal.createMeal({}).then(() => null, error => ({ code: error.code, requestSent: error.requestSent })) })
    assert.deepEqual(rejected, { code: 'SESSION_CHANGED', requestSent: false })
    assert.equal(await householdPage.getByPlaceholder('给这道菜起个名字').inputValue(), '家庭草稿')
    await householdContext.close()

    const loginContext = await browser.newContext()
    const page = await loginContext.newPage()
    let dashboardAuth = ''
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/login') return route.fulfill({ json: { token: 'login-token', user: { id: 'c', username: 'c' } } })
      if (path === '/api/dashboard/summary') dashboardAuth = route.request().headers().authorization || ''
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/login`)
    await page.getByPlaceholder('请输入用户名').fill('c')
    await page.getByPlaceholder('请输入密码').fill('test-only')
    await page.getByRole('button', { name: '立即登录' }).click()
    await page.waitForURL('**/dashboard')
    await page.waitForFunction(() => document.title.includes('小家仪表盘'))
    await page.waitForTimeout(300)
    assert.equal(dashboardAuth, 'Bearer login-token', 'normal same-tab login must bind its new token')
    assert.equal(await page.locator('.session-warning').count(), 0)
    await loginContext.close()
    console.log('Session checks passed: cross-tab switch, pending response, draft safety and normal login')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
