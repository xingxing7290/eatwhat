const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Calendar checks require a local server')
const time = '2026-10-28T08:00:00.000Z'
const schedule = (date, dinner) => ({ date, scheduleExists: true, scheduleVersion: time, meals: { breakfast: [], lunch: [], dinner } })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let mode = 'populated'; let failB = true; let wishFailed = false; let release; let catalogCalls = 0; let inflight = 0; let peak = 0; const mealCalls = []
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/schedules') {
        const month = Number(url.searchParams.get('month'))
        if (mode === 'invalid') return route.fulfill({ json: [{ date: '2026-10-99', meals: { breakfast: [], lunch: [], dinner: [] } }] })
        if (mode === 'invalid-items') return route.fulfill({ json: [schedule('2026-10-28', [null])] })
        if (mode === 'bulk') return route.fulfill({ json: [schedule('2026-10-28', Array.from({ length: 13 }, (_, index) => ({ meal: `legacy-${index}` })))] })
        if (mode === 'populated') return route.fulfill({ json: [schedule('2026-10-28', [{ meal: { _id: 'a', name: '已填充的菜' } }])] })
        if (mode === 'race') return route.fulfill({ json: [schedule(month === 10 ? '2026-10-28' : '2026-11-01', [{ meal: 'a' }])] })
        return route.fulfill({ json: [schedule('2026-10-28', [{ meal: 'a' }, { meal: 'b' }])] })
      }
      if (path === '/meals') { catalogCalls++; return route.fulfill({ status: 503, json: { error: '不应请求完整菜谱' } }) }
      if (path.startsWith('/meals/')) {
        const id = path.split('/').pop(); mealCalls.push(id)
        if (mode === 'bulk') { inflight++; peak = Math.max(peak, inflight); await new Promise(resolve => setTimeout(resolve, 80)); inflight--; return route.fulfill({ json: { _id: id, name: `补全菜品 ${id}` } }) }
        const oldRequest = mode === 'race' && id === 'a' && !release
        if (oldRequest) await new Promise(resolve => { release = resolve })
        if (id === 'b' && failB) return route.fulfill({ status: 503, json: { error: '单项菜品读取失败' } })
        return route.fulfill({ json: { _id: id, name: mode === 'race' ? (oldRequest ? '旧月份菜名' : '新月份菜名') : id === 'a' ? '旧版菜甲' : '旧版菜乙' } })
      }
      if (path === '/wishlist') return wishFailed ? route.fulfill({ status: 503, json: { error: '提醒读取失败' } }) : route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/calendar`)
    await page.locator('.desktop-only .meal-item').filter({ hasText: '已填充的菜' }).waitFor()
    assert.equal(catalogCalls, 0)
    assert.deepEqual(mealCalls, [])
    assert.equal(await page.getByText('无法加载月度安排', { exact: false }).count(), 0)

    mode = 'legacy'; wishFailed = true
    await page.reload()
    await page.locator('.desktop-only .meal-item').filter({ hasText: '旧版菜甲' }).waitFor()
    await page.getByText('部分菜品已不可用或名称暂时无法读取', { exact: false }).waitFor()
    await page.getByText('暂时无法读取想吃提醒，不影响查看日历。').waitFor()
    assert.equal(await page.getByText('单项菜品读取失败', { exact: true }).count(), 0, 'background name errors must not create one toast per item')
    assert.equal(catalogCalls, 0)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.calendar-notice span', '.calendar-notice .el-button']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    failB = false; wishFailed = false
    await page.getByRole('button', { name: '重试菜品名称' }).click()
    await page.locator('.desktop-only .meal-item').filter({ hasText: '旧版菜乙' }).waitFor()
    await page.getByText('部分菜品已不可用或名称暂时无法读取', { exact: false }).waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '重试提醒' }).click()
    await page.getByText('暂时无法读取想吃提醒，不影响查看日历。').waitFor({ state: 'hidden' })

    mode = 'race'; release = null
    await page.reload()
    for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(typeof release, 'function')
    await page.locator('.month-navigation').getByRole('button', { name: '下个月' }).click()
    await page.getByText('2026年11月').first().waitFor()
    await page.locator('.desktop-only .meal-item').filter({ hasText: '新月份菜名' }).waitFor()
    const late = page.waitForResponse(response => new URL(response.url()).pathname === '/api/meals/a')
    release(); await late
    assert.equal(await page.getByText('2026年11月').first().isVisible(), true)
    assert.equal(await page.locator('.desktop-only .meal-item').filter({ hasText: '新月份菜名' }).count(), 1)

    mode = 'bulk'; peak = 0
    await page.reload()
    await page.locator('.desktop-only .meal-item').filter({ hasText: '补全菜品 legacy-12' }).waitFor()
    assert.ok(peak > 1 && peak <= 6, `legacy lookups must be bounded: ${peak}`)
    mode = 'invalid'
    await page.reload()
    await page.getByText('月度安排日期或餐次不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.calendar-grid:visible').count(), 0)
    mode = 'invalid-items'
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('月度安排日期或餐次不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.calendar-grid:visible').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Calendar loading checks passed: populated recipes, legacy lookups, partial failures and stale requests')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
