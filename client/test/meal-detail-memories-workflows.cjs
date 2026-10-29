const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Meal detail tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const rows = Array.from({ length: 14 }, (_, i) => ({ _id: `memory-${i}`, date: '2026-10-01', title: `菜谱回忆${String(i).padStart(2, '0')}`, note: '家庭故事', mealType: 'dinner', photos: [], mealIds: [], editVersion: { revision: `v${i}`, updatedAt: '2026-01-01T00:00:00.000Z' }, supportsConditionalEdit: true }))
    rows[1] = { ...rows[1], id: rows[1]._id }; delete rows[1]._id
    const otherRows = [{ ...rows[0], _id: 'other-memory', title: '另一道菜的回忆' }]
    let hold = false; let release; let fail = false; let legacy = false; const requests = []; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/meals/a' || path === '/meals/b') return route.fulfill({ json: { _id: path.endsWith('/a') ? 'a' : 'b', name: path.endsWith('/a') ? '第一道菜' : '第二道菜' } })
      if (path === '/memories' && request.method() === 'GET') {
        const query = Object.fromEntries(url.searchParams); requests.push(query)
        if (hold && query.mealId === 'a' && query.page === '2') await new Promise(resolve => { release = resolve })
        if (fail && query.page === '2') return route.fulfill({ status: 503, json: { error: '模拟回忆读取失败' } })
        if (legacy) return route.fulfill({ json: Array.from({ length: 200 }, (_, i) => ({ ...rows[i % rows.length], _id: `legacy-${i}` })) })
        const data = query.mealId === 'a' ? rows : otherRows; const number = Number(query.page); const limit = Number(query.limit)
        return route.fulfill({ json: { supportsMemoryTimeline: true, page: number, limit, search: '', month: '', mealId: query.mealId, mealType: 'all', photos: 'all', total: data.length, items: data.slice((number - 1) * limit, number * limit) } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/meals/detail/a`)
    await page.getByRole('heading', { name: '第一道菜' }).waitFor()
    await page.getByText('共 14 条相关回忆 · 第 1 / 3 页').waitFor()
    await page.getByRole('status').filter({ hasText: '共 14 条相关回忆，第 1 / 3 页' }).waitFor()
    assert.match(await page.locator('.memory-item').filter({ hasText: '菜谱回忆01' }).getByRole('link').getAttribute('href'), /edit=memory-1/)
    assert.equal(requests[0].view, 'timeline'); assert.equal(requests[0].mealId, 'a'); assert.equal(await page.locator('.memory-item').count(), 6)
    const nav = page.getByRole('navigation', { name: '相关回忆分页' })
    await nav.getByRole('button', { name: '下一页' }).focus(); await page.keyboard.press('Enter')
    await page.getByText('共 14 条相关回忆 · 第 2 / 3 页').waitFor()
    await page.getByRole('status').filter({ hasText: '共 14 条相关回忆，第 2 / 3 页' }).waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '下一页')
    await page.keyboard.press('Enter')
    await page.getByText('共 14 条相关回忆 · 第 3 / 3 页').waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '上一页')
    assert.equal(await page.locator('.memory-item').count(), 2)
    fail = true
    await page.keyboard.press('Enter')
    await page.getByText('无法加载相关回忆：模拟回忆读取失败', { exact: true }).waitFor()
    await page.getByRole('status').filter({ hasText: '相关回忆加载失败' }).waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('重新加载'))
    assert.equal(await page.getByRole('heading', { name: '第一道菜' }).count(), 1, 'memory failure must not hide meal detail')
    fail = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('共 14 条相关回忆 · 第 2 / 3 页').waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.memory-date', '.memory-link', '.memory-pagination']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await nav.getByRole('button', { name: '上一页' }).click()
    await page.getByText('共 14 条相关回忆 · 第 1 / 3 页').waitFor()
    hold = true
    await nav.getByRole('button', { name: '下一页' }).click()
    for (let i = 0; i < 100 && !release; i++) await page.waitForTimeout(25)
    assert.equal(typeof release, 'function')
    await page.getByRole('status').filter({ hasText: '正在加载相关回忆' }).waitFor()
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/meals/detail/b') })
    await page.getByRole('heading', { name: '第二道菜' }).waitFor()
    await page.getByText('另一道菜的回忆').waitFor()
    release(); await page.waitForTimeout(250)
    assert.equal(await page.getByText('菜谱回忆06', { exact: true }).count(), 0, 'late response must not replace another meal')
    legacy = true; hold = false
    await page.goto(`${base}/meals/detail/a`)
    await page.getByText('旧服务器最多显示最近 200 条相关回忆', { exact: false }).waitFor()
    assert.equal(await page.getByRole('navigation', { name: '相关回忆分页' }).count(), 0)
    assert.deepEqual(errors, [])
    console.log('Meal detail memory checks passed: paging, focus, errors, scope races and legacy fallback')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
