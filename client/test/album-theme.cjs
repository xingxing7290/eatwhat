const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Album theme checks require a local server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (url.pathname === '/api/photo-album') return route.fulfill({ json: { month: '2026-10', total: 25, page: 1, limit: 24, photos: Array.from({ length: 24 }, (_, index) => ({ memoryId: 'm1', photoIndex: index, date: '2026-10-28', title: '温暖晚餐', note: '一起做饭的时光', photo: `${image}#${index}`, meals: [] })) } })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/photo-album`)
    await page.getByText('2026-10 · 25 张照片').waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.album-page .eyebrow', '.album-page h1', '.page-header p', '.photo-count', '.photo-card span', '.pagination > span']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.getByRole('button', { name: /第 1 张/ }).click()
    await page.getByRole('dialog', { name: '饭桌回忆' }).waitFor()
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.el-dialog h3', '.el-dialog .note', '.el-dialog .viewer-nav > span', '.el-dialog .memory-link a']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
      }
    }
    console.log('Album theme checks passed: contrast and mobile layout')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
