const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Registration tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 760 } })
    let mode = 'invalid'; let calls = 0
    await page.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname === '/api/auth/register') {
        calls++
        if (mode === 'invalid') return route.fulfill({ status: 400, json: { error: '邀请码无效' } })
        if (mode === 'duplicate') return route.fulfill({ status: 409, json: { error: '用户名已存在' } })
        return route.fulfill({ status: 503, json: { error: '响应丢失' } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/apply-account#invite=HOMEA1`)
    await page.waitForURL('**/apply-account')
    assert.equal(await page.getByPlaceholder('请输入家人的邀请码').inputValue(), 'HOMEA1')
    await page.getByText('邀请码来自邀请链接', { exact: false }).waitFor()
    await page.getByLabel('用户名', { exact: true }).fill('tester')
    await page.getByLabel('密码', { exact: true }).fill('password123')
    await page.getByLabel('确认密码', { exact: true }).fill('password123')
    assert.equal(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented }), true)
    await page.getByRole('link', { name: '返回登录' }).click()
    await page.getByText('离开后未提交的信息会丢失', { exact: false }).waitFor()
    await page.getByRole('button', { name: '继续填写', exact: true }).click()
    assert.equal(await page.getByLabel('密码', { exact: true }).inputValue(), 'password123')
    await page.getByLabel('确认密码', { exact: true }).press('Enter')
    await page.locator('.registration-error').getByText('邀请码无效').waitFor()
    assert.equal(calls, 1)
    assert.equal(await page.locator('.el-message--error').count(), 0)
    assert.equal(await page.getByLabel('密码', { exact: true }).inputValue(), 'password123')
    await page.getByPlaceholder('请输入家人的邀请码').fill('HOMEB1')
    assert.equal(await page.locator('.registration-error').count(), 0)
    assert.equal(await page.getByText('邀请码来自邀请链接', { exact: false }).count(), 0)
    mode = 'duplicate'; await page.getByLabel('确认密码', { exact: true }).press('Enter')
    await page.locator('.registration-error').getByText('用户名已存在').waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 760 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.page-subtitle', '.mode-heading', '.mode-hint', '.apply-form .el-form-item__label', '.registration-error .el-alert__title', '.mode-picker .el-radio-button:nth-child(1) .el-radio-button__inner', '.mode-picker .el-radio-button:nth-child(2) .el-radio-button__inner']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.getByLabel('用户名', { exact: true }).fill('another')
    mode = 'uncertain'; await page.getByLabel('确认密码', { exact: true }).press('Enter')
    await page.getByText('注册结果未确认').waitFor()
    assert.equal(await page.getByRole('button', { name: '创建账号', exact: true }).isDisabled(), true)
    assert.equal(calls, 3)
    assert.equal(await page.locator('.el-message--error').count(), 0)
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.uncertain-alert .el-alert__title', '.uncertain-alert .el-alert__description', '.uncertain-alert .el-button']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
      }
    }
    await page.locator('.uncertain-alert').getByRole('button', { name: '继续填写' }).click()
    await page.getByRole('button', { name: '返回核对' }).click()
    assert.equal(await page.getByRole('button', { name: '创建账号', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: '前往登录' }).click()
    await page.getByText('离开后密码和本页输入不会保留', { exact: false }).waitFor()
    await page.getByRole('button', { name: '确认离开' }).click()
    await page.waitForURL('**/login?username=another')
    assert.equal(await page.getByLabel('用户名', { exact: true }).inputValue(), 'another')
    assert.equal(await page.getByLabel('密码', { exact: true }).inputValue(), '')
    console.log('Registration checks passed: invite context, persistent errors, uncertain result and themes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
