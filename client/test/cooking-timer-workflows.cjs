const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Timer checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let writes = 0
    await page.route('**/api/**', route => {
      const req = route.request(); const path = new URL(req.url()).pathname
      if (req.method() !== 'GET') writes++
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/a') return route.fulfill({ json: { _id: 'a', name: '计时菜谱', ingredients: [], steps: ['煮熟'], photos: [], tags: [], healthTags: [] } })
      if (path === '/api/memories') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/meals/detail/a`)
    const timer = page.getByLabel('烹饪计时器')
    await timer.getByText('不保证后台提醒，没有声音', { exact: false }).waitFor()
    await page.clock.setFixedTime(new Date('2026-10-28T12:00:00Z'))
    await timer.getByLabel('计时时长').selectOption('1')
    assert.equal(await timer.locator('output').innerText(), '01:00')
    await timer.getByRole('button', { name: '开始计时' }).focus(); await page.keyboard.press('Enter')
    assert.equal(await timer.getByRole('button', { name: '暂停计时' }).evaluate(node => document.activeElement === node), true)
    assert.equal(await timer.getByLabel('计时时长').isDisabled(), true)
    await timer.getByRole('button', { name: '暂停计时' }).click()
    await timer.getByText('计时已暂停。').waitFor()
    await page.clock.setFixedTime(new Date('2026-10-28T12:05:00Z'))
    assert.equal(await timer.locator('output').innerText(), '01:00', 'paused time must not decrease')
    await timer.getByRole('button', { name: '继续计时' }).click()
    await page.clock.setFixedTime(new Date('2026-10-28T12:06:01Z'))
    await timer.getByText('计时结束，请检查食物。').waitFor()
    assert.equal(await timer.locator('output').innerText(), '00:00')
    await timer.getByRole('button', { name: '重置计时' }).focus(); await page.keyboard.press('Enter')
    assert.equal(await timer.getByRole('button', { name: '重置计时' }).evaluate(node => document.activeElement === node), true)
    assert.equal(await timer.locator('output').innerText(), '01:00')
    assert.equal(writes, 0, 'the timer must not write to the recipe or calendar')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.reload()
    await page.getByLabel('烹饪计时器').getByText('05:00').waitFor()
    console.log('Cooking timer checks passed: pause, elapsed time, reset, focus and no writes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
