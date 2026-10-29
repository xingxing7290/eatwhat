const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Memory timeline tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const rows = Array.from({ length: 205 }, (_, index) => ({ _id: `memory-${index}`, date: `2025-01-${String(28 - index % 28).padStart(2, '0')}`, title: `历史回忆${String(index).padStart(3, '0')}`, note: index === 204 ? '最后一条特别记号' : '', mood: '温馨', mealType: index % 2 ? 'lunch' : 'dinner', photos: index % 3 ? [] : ['/uploads/photo.png'], mealIds: [], supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: { revision: `v${index}`, updatedAt: '2026-01-01T00:00:00.000Z' } }))
    let legacy = false; let releaseSlow; const requests = []; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path !== '/memories' || req.method() !== 'GET') return route.fulfill({ json: {} })
      const query = Object.fromEntries(url.searchParams); requests.push(query)
      if (legacy) return route.fulfill({ json: rows.slice(0, 200) })
      if (query.search === '历史回忆001') await new Promise(resolve => { releaseSlow = resolve })
      const filtered = rows.filter(row => (!query.month || row.date.startsWith(`${query.month}-`)) && (query.mealType === 'all' || row.mealType === query.mealType) && (query.photos === 'all' || (row.photos.length > 0) === (query.photos === 'yes')) && (!query.search || [row.title, row.note, row.mood].some(value => value.includes(query.search))))
      const number = Number(query.page); const limit = Number(query.limit)
      return route.fulfill({ json: { supportsMemoryTimeline: true, page: number, limit, search: query.search, month: query.month || '', mealType: query.mealType, photos: query.photos, total: filtered.length, items: filtered.slice((number - 1) * limit, number * limit) } })
    })
    await page.goto(`${base}/memories?month=2025-01`)
    await page.getByText('共 205 条回忆 · 第 1 / 18 页').waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '2025-01')
    assert.equal(requests[0].month, '2025-01')
    const related = page.getByRole('navigation', { name: '查看所选月份的其他内容' })
    assert.equal(await related.getByRole('link', { name: '查看 2025-01 相册 →' }).getAttribute('href'), '/photo-album?month=2025-01')
    assert.equal(await related.getByRole('link', { name: '查看 2025-01 饭桌回顾 →' }).getAttribute('href'), '/review?month=2025-01')
    await related.getByText('仅保留月份', { exact: false }).waitFor()
    await page.setViewportSize({ width: 320, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    for (const link of await related.getByRole('link').all()) assert.ok((await link.boundingBox()).height >= 44)
    await page.setViewportSize({ width: 390, height: 844 })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.related-period a', '.related-period p']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
      }
    }
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await page.reload()
    await page.getByText('共 205 条回忆 · 第 1 / 18 页').waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '2025-01')
    await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push({ name: 'memories', query: { month: '2024-01' } }))
    await page.getByText('没有符合条件的饭后回忆').waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '2024-01')
    await page.goBack()
    await page.getByText('共 205 条回忆 · 第 1 / 18 页').waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '2025-01')
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.waitForURL('**/memories')
    await page.goto(`${base}/memories?month=2025-13`)
    await page.getByText('回忆链接中的月份无效', { exact: false }).waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '')
    await page.goto(`${base}/memories?month=1999-01`)
    await page.getByText('饭桌回顾支持 2000 至 2100 年。').waitFor()
    assert.equal(await page.getByRole('link', { name: '查看 1999-01 相册 →' }).getAttribute('href'), '/photo-album?month=1999-01')
    assert.equal(await page.getByRole('link', { name: /1999-01 饭桌回顾/ }).count(), 0)
    await page.goto(`${base}/memories`)
    await page.getByText('共 205 条回忆 · 第 1 / 18 页').waitFor()
    assert.equal(await page.locator('.memory-card').count(), 12)
    assert.equal(requests[0].view, 'timeline')
    await page.getByRole('button', { name: '下一页' }).click()
    await page.getByText('共 205 条回忆 · 第 2 / 18 页').waitFor()
    await page.getByText('历史回忆012', { exact: true }).waitFor()
    const search = page.getByRole('searchbox', { name: '搜索回忆' })
    await search.fill('历史回忆001')
    await page.waitForRequest(request => request.url().includes('search=%E5%8E%86%E5%8F%B2%E5%9B%9E%E5%BF%86001'))
    await search.fill('最后一条特别记号')
    await page.getByText('共 1 条回忆 · 第 1 / 1 页').waitFor()
    await page.getByText('历史回忆204', { exact: true }).waitFor()
    releaseSlow(); await page.waitForTimeout(250)
    assert.equal(await page.getByText('历史回忆001', { exact: true }).count(), 0)
    await search.fill('')
    await page.getByLabel('按餐次筛选回忆').selectOption('dinner')
    await page.getByLabel('按照片筛选回忆').selectOption('yes')
    await page.getByText('共 35 条回忆 · 第 1 / 3 页').waitFor()
    await page.getByLabel('按月份筛选回忆').fill('2024-01')
    await page.getByText('没有符合条件的饭后回忆').waitFor()
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('共 205 条回忆 · 第 1 / 18 页').waitFor()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.filter-kicker', '.filter-heading h2', '.filter-heading p', '.filter-row label', '.timeline-pagination']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    legacy = true
    await page.reload()
    await page.getByText('当前服务器最多返回最近 200 条', { exact: false }).waitFor()
    await page.getByRole('searchbox', { name: '搜索回忆' }).fill('历史回忆199')
    await page.getByText('历史回忆199', { exact: true }).waitFor()
    assert.deepEqual(errors, [])
    console.log('Memory timeline checks passed: historic search, filters, stale response, themes and legacy warning')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
