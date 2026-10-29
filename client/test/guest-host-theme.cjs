const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Theme checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'theme-token'); localStorage.setItem('user', JSON.stringify({ username: 'theme', householdId: 'home-a' })) })
    const home = '111111111111111111111111'; const id = '222222222222222222222222'
    const longName = 'SpicyChicken'.repeat(8); const longNote = 'NoSalt'.repeat(20)
    const session = { id, householdId: home, title: '周末家庭聚餐', status: 'open', storedStatus: 'open', eventAt: null, expiresAt: '2099-01-01T00:00:00.000Z', shareUrl: 'https://example.test/guest-order/token', supportsConditionalSession: true, editVersion: { revision: 'test', updatedAt: '2026-10-29T00:00:00.000Z' }, guestCount: 1, totalQuantity: 2 }
    await page.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const pathname = new URL(route.request().url()).pathname
      if (pathname.endsWith('/capabilities')) return route.fulfill({ json: { householdId: home, supportsConditionalSession: true, supportsIdempotentSessionCreate: true } })
      if (pathname.endsWith('/guest-orders')) return route.fulfill({ json: { sessions: [session] } })
      return route.fulfill({ json: { session: { ...session, summary: { guestCount: 1, totalQuantity: 2, dishes: [{ name: longName, mealId: 'meal', quantity: 2, guestNames: ['家人'], notes: [longNote] }] }, orders: [{ id: 'order-1', guestName: '家人', items: [{ mealId: 'meal', name: longName, quantity: 2 }] }] } } })
    })
    await page.goto(`${base}/guest-orders`)
    await page.getByRole('button', { name: '查看详情' }).click()
    await page.getByRole('heading', { name: '大家想吃' }).waitFor()
    const checks = ['.session-card h3', '.session-card p', '.card-top > span:last-child', '.card-top .el-tag__content', '.card-bottom small', '.detail-head .el-tag__content', '.detail-head h2', '.detail-head p', '.share-panel p', '.summary-head > span', '.dish-row strong', '.dish-row small']
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const [width, height] of [[1280, 900], [390, 844], [320, 844]]) {
        await page.setViewportSize({ width, height })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of checks) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector} contrast ${result.ratio.toFixed(2)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${dark ? 'dark' : 'light'} ${width} ${theme} overflows`)
          assert.equal(await page.locator('.dish-row').evaluate(node => node.scrollWidth <= node.clientWidth), true, `${width} dish content must not overflow`)
        }
      }
    }
    console.log('Guest host theme checks passed across six palettes, light/dark modes and three viewports')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
