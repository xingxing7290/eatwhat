const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Shopping theme checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/shopping-list') return route.fulfill({ json: { weekStart: '2026-10-26', supportsConditionalUpdates: true, listVersion: 1, items: [
        { _id: 'a', name: '菠菜', amount: '1把', category: 'vegetable', checked: false, manual: true },
        { _id: 'b', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: false }
      ] } })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/shopping-list`)
    await page.getByText('显示 2 / 2 项 · 本周待买 1 项').waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.shopping-page .eyebrow', '.shopping-page h1', '.page-header p', '.progress-card strong', '.list-heading h2', '.list-heading p', '.filter-buttons button.active', '.filter-buttons button:not(.active)', '.group-heading strong', '.group-heading span', '.item-row:not(.checked) .el-checkbox__label strong', '.item-row.checked .el-checkbox__label strong']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    console.log('Shopping theme checks passed: contrast and mobile layout')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
