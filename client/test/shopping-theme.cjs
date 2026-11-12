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
        { _id: 'b', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: false, quantityComplete: false }
      ] } })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/shopping-list`)
    await page.getByText('显示 2 / 2 项 · 本周待买 1 项').waitFor()
    const firstRow = page.locator('.item-row').first()
    const shortCheckbox = await firstRow.locator('.el-checkbox').boundingBox()
    const shortActions = await firstRow.locator('.item-actions').boundingBox()
    assert.ok(Math.abs(shortCheckbox.y - shortActions.y) < 5, 'short items should use one compact row at 390px')
    assert.equal(await firstRow.evaluate(row => {
      const text = row.querySelector('.el-checkbox__label strong'); const original = text.textContent
      text.textContent = '很长的食材名称需要在手机屏幕内完整换行'.repeat(4)
      const label = row.querySelector('.el-checkbox').getBoundingClientRect(); const actions = row.querySelector('.item-actions').getBoundingClientRect()
      const fits = label.right <= actions.left && document.documentElement.scrollWidth <= innerWidth
      text.textContent = original; return fits
    }), true, 'long names must wrap without colliding with actions')
    if (process.env.EATWHAT_SHOPPING_SHOT) await page.screenshot({ path: process.env.EATWHAT_SHOPPING_SHOT, fullPage: true })
    await page.locator('.extra-tools summary').click()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.shopping-page .eyebrow', '.shopping-page h1', '.page-header p', '.week-link', '.generation-context strong', '.generation-context p', '.progress-card strong', '.list-heading h2', '.list-heading p', '.filter-count-note', '.filter-buttons button.active', '.filter-buttons button:not(.active)', '.filter-buttons button:has-text("仅看用量待核对")', '.group-heading strong', '.group-heading span', '.item-row:not(.checked) .el-checkbox__label strong', '.item-row.checked .el-checkbox__label strong', '.quantity-notice']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          for (const checkbox of await page.locator('.item-row .el-checkbox').all()) {
            const box = await checkbox.boundingBox()
            assert.ok(box.width >= 44 && box.height >= 44, `${width} ingredient checkbox must have a usable touch target`)
          }
          for (const tag of await page.locator('.item-actions .el-tag').all()) {
            assert.equal(await tag.evaluate(node => node.clientWidth >= node.scrollWidth && node.clientWidth >= 35), true, 'source labels must not be clipped')
          }
          for (const selector of ['.group-jump > span', '.group-jump button', '.extra-tools summary', '.item-actions .el-tag']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    const ingredient = page.getByRole('checkbox', { name: /菠菜/ })
    await ingredient.focus()
    assert.notEqual(await ingredient.locator('xpath=ancestor::label').evaluate(label => getComputedStyle(label).outlineStyle), 'none', 'keyboard focus must be visible around the ingredient')
    await page.getByRole('button', { name: '待买', exact: true }).click()
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.filter-reset')
        assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} reset: ${result.ratio}`)
      }
    }
    console.log('Shopping theme checks passed: contrast and mobile layout')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
