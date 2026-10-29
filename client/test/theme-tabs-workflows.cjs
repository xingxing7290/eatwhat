const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Theme tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' }))
    })
    await context.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') return route.fulfill({ json: { user: { id: 'u1', householdId: 'home-a' }, household: { id: 'home-a', name: '小家', members: [] } } })
      if (path === '/api/default-meals/status') return route.fulfill({ json: { total: 0, imported: 0, missing: 0 } })
      if (path === '/api/meal-image-issues') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    const first = await context.newPage()
    const second = await context.newPage()
    await Promise.all([first.goto(`${base}/settings`), second.goto(`${base}/settings`)])
    await first.getByRole('button', { name: /抹茶和风/ }).click()
    await second.waitForFunction(() => document.documentElement.dataset.theme === 'matcha')
    assert.equal(await second.getByRole('button', { name: /抹茶和风/ }).getAttribute('aria-pressed'), 'true')
    await second.getByRole('button', { name: /晨雾蓝/ }).click()
    await first.waitForFunction(() => document.documentElement.dataset.theme === 'mist')
    assert.equal(await first.getByRole('button', { name: /晨雾蓝/ }).getAttribute('aria-pressed'), 'true')
    await first.getByRole('button', { name: '切换到暗色模式' }).click()
    await second.waitForFunction(() => document.documentElement.classList.contains('dark'))
    await second.getByRole('button', { name: '切换到亮色模式' }).click()
    await first.waitForFunction(() => !document.documentElement.classList.contains('dark'))
    await first.evaluate(() => { localStorage.removeItem('colorTheme'); localStorage.removeItem('darkMode') })
    await second.waitForFunction(() => document.documentElement.dataset.theme === 'cream')
    assert.equal(await second.getByRole('button', { name: /奶油原木/ }).getAttribute('aria-pressed'), 'true')
    console.log('Theme tabs checks passed: color, selection, dark mode and reset')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
