const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Login tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 760 } })
    let mode = 'wrong'; let calls = 0
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/login') {
        calls++
        if (mode === 'wrong') return route.fulfill({ status: 401, json: { error: '用户名或密码错误' } })
        if (mode === 'network') return route.abort('failed')
        if (mode === 'malformed') return route.fulfill({ json: { token: 'x' } })
        return route.fulfill({ json: { token: 'token', user: { id: 'u1', householdId: 'home-a', username: 'test' } } })
      }
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/login`)
    const username = page.getByRole('textbox', { name: '用户名' })
    const password = page.getByLabel('密码', { exact: true })
    await username.fill('   ')
    await password.fill('private-password')
    await password.press('Enter')
    await page.getByText('请输入用户名', { exact: true }).last().waitFor()
    assert.equal(calls, 0)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.el-form-item__error')
        assert.ok(result.ratio >= 4.5, `validation ${dark ? 'dark' : 'light'} ${theme}: ${result.ratio}`)
      }
    }
    await username.fill(' test ')
    await password.press('Enter')
    await page.getByRole('alert').getByText('用户名或密码错误').waitFor()
    assert.equal(await password.inputValue(), 'private-password')
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null)
    assert.equal(await page.locator('.el-message--error').count(), 0)
    await password.fill('new-password')
    assert.equal(await page.locator('.login-error').count(), 0)
    mode = 'network'; await password.press('Enter')
    await page.getByRole('alert').getByText('网络错误，请检查您的网络连接').waitFor()
    mode = 'malformed'; await password.press('Enter')
    await page.getByRole('alert').getByText('登录响应不完整').waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null)
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 760 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.field-label', '.login-error', '.app-subtitle']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    mode = 'ok'; await password.press('Enter')
    await page.waitForURL('**/dashboard')
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), 'token')
    console.log('Login checks passed: labels, validation, errors, responsive themes and success')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
