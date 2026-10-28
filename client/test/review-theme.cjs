const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Theme checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.clock.setFixedTime(new Date(2026, 9, 29, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'theme-token'); localStorage.setItem('user', JSON.stringify({ username: 'theme' })) })
    const data = { supportsHouseholdScopedReview: true, type: 'month', label: '2026-10', range: { start: '2026-10-01', end: '2026-10-31' }, summary: { memoryCount: 1, plannedMealCount: 2, reviewedDayCount: 1, photoCount: 1, wishlistOpen: 3, mealTotal: 15, favoriteTotal: 2 }, topMeals: [{ id: 'meal', name: '番茄炒蛋', count: 3, scheduleCount: 2, memoryCount: 1 }], moodStats: [{ mood: '开心', count: 1 }], categoryStats: [{ category: '家常菜', count: 3 }], healthTagStats: [{ tag: '少油', count: 1 }], bestMemory: { id: 'memory', date: '2026-10-10', title: '温暖的晚餐', mood: '开心', photos: [] }, photos: [], recentMemories: [{ _id: 'memory', date: '2026-10-10', title: '温暖的晚餐' }] }
    await page.route('**/api/**', route => route.fulfill({ json: data }))
    await page.goto(`${base}/review`)
    await page.getByRole('heading', { name: '常出现在饭桌上的菜' }).waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    const checks = ['.intro h2', '.intro p', '.metric span', '.metric strong', '.metric small', '.metric-note', '.favorites h2', '.explain', '.meal-row strong', '.meal-row small', '.rank', '.bar-row span', '.bar-row strong', '.mood-list span', '.current-note', '.recent-list strong', '.period-controls .el-radio-button.is-active .el-radio-button__inner']
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const [width, height] of [[1280, 900], [390, 844]]) {
        await page.setViewportSize({ width, height })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of checks) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector} contrast ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${dark ? 'dark' : 'light'} ${width} ${theme} overflows`)
        }
        if (width === 390) assert.ok((await page.locator('.period-controls .el-radio-button__inner').first().boundingBox()).height >= 44, 'period controls need a touch-sized target')
      }
    }
    await page.getByRole('radio', { name: '年度' }).focus()
    const focused = await page.getByRole('radio', { name: '年度' }).evaluate(input => ({ visible: input.matches(':focus-visible'), outline: getComputedStyle(input.nextElementSibling).outlineStyle }))
    assert.equal(focused.visible, true)
    assert.notEqual(focused.outline, 'none')
    console.log('Review theme checks passed across six palettes, light/dark modes and two viewports')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
