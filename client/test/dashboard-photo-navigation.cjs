const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Photo navigation checks require a local server')
const id = '0123456789abcdef01234567'
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const photos = Array.from({ length: 30 }, (_, index) => ({ memoryId: id, photoIndex: index, date: '2025-02-18', title: `旧照片${index + 1}`, photo: `${image}#${index}`, meals: [] }))
const fingerprint = createHash('sha256').update(photos[25].photo).digest('hex')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const errors = []; const reads = []; let mode = 'normal'; let release
    page.on('pageerror', error => errors.push(error.message))
    const meals = { breakfast: [], lunch: [], dinner: [] }; const today = '2026-10-28'
    const summary = { today, todaySchedule: { meals }, todayHints: [], week: { days: Array.from({ length: 7 }, (_, i) => ({ date: new Date(Date.parse(`${today}T00:00:00Z`) + (i - 3) * 86400000).toISOString().slice(0, 10), meals })) }, partnerWishlist: [], recentPhotos: [{ ...photos[25], fingerprint }], defaultMeals: { imported: 0, total: 0 }, imageIssues: { open: 0 }, meals: { favorites: 0 } }
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/dashboard/summary') return route.fulfill({ json: summary })
      if (path === '/photo-album') {
        const query = Object.fromEntries(url.searchParams); reads.push(query)
        if (query.view === 'locate') {
          if (mode === 'hold') await new Promise(resolve => { release = resolve })
          if (mode === 'missing') return route.fulfill({ status: 404, json: { code: 'PHOTO_NOT_FOUND', error: '照片已移动、修改或不属于当前家庭' } })
          if (mode === 'legacy') return route.fulfill({ json: { month: query.month, photos } })
          return route.fulfill({ json: { supportsPhotoLocate: true, month: query.month, memoryId: id, photoIndex: 25, fingerprint, photo: photos[25].photo, position: 26, page: 2, limit: 24 } })
        }
        const number = Number(query.page || 1); const limit = Number(query.limit || 24)
        const rows = query.month === '2025-02' ? photos.map(row => mode === 'moved' && row.photoIndex === 25 ? { ...row, photo: `${image}#changed` } : row) : []
        return route.fulfill({ json: { month: query.month, page: number, limit, total: rows.length, photos: rows.slice((number - 1) * limit, number * limit) } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/dashboard`)
    const link = page.getByRole('link', { name: '前往饭桌相册：旧照片26' }); await link.waitFor()
    const href = await link.getAttribute('href'); assert.ok(href.includes('month=2025-02')); assert.ok(!href.includes('data%3A'), 'raw photo data must not enter the URL')
    await link.click()
    const viewer = page.getByRole('dialog', { name: '饭桌回忆' }); await viewer.getByText('26 / 30').waitFor()
    await viewer.getByRole('heading', { name: '旧照片26' }).waitFor()
    assert.equal(reads[0].view, 'locate'); assert.equal(reads[1].page, '2'); assert.equal(reads[1].month, '2025-02')
    await page.keyboard.press('Escape'); await viewer.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label')?.includes('第 26 张'))
    await page.getByRole('button', { name: '上个月' }).click()
    await page.getByText('这个月还没有饭桌照片').waitFor()
    await page.waitForURL('**/photo-album')
    mode = 'moved'; await page.goto(`${base}${href}`)
    await page.getByText('照片位置或内容已发生变化', { exact: false }).waitFor()
    assert.equal(await viewer.isVisible(), false)
    mode = 'normal'; await page.getByRole('button', { name: '重新定位' }).click()
    await viewer.getByText('26 / 30').waitFor()
    mode = 'missing'; await page.goto(`${base}${href}`)
    await page.getByText('照片已移动、修改或不属于当前家庭', { exact: false }).waitFor()
    assert.equal(await viewer.isVisible(), false)
    mode = 'legacy'; await page.goto(`${base}${href}`)
    await page.getByText('当前服务器不支持精确定位', { exact: false }).waitFor()
    await page.getByText('2025-02 · 30 张照片').waitFor()
    mode = 'normal'; delete summary.recentPhotos[0].fingerprint
    await page.goto(`${base}/dashboard`)
    const oldLink = await page.getByRole('link', { name: '前往饭桌相册：旧照片26' }).getAttribute('href')
    assert.ok(oldLink.includes('month=2025-02')); assert.ok(!oldLink.includes('memoryId='))
    await page.goto(`${base}${oldLink}`)
    await page.getByText('2025-02 · 30 张照片').waitFor()
    assert.equal(await viewer.isVisible(), false)
    summary.recentPhotos[0].fingerprint = fingerprint
    await page.goto(`${base}/photo-album?month=not-a-month&memoryId=${id}`)
    await page.getByText('相册链接中的月份无效', { exact: false }).waitFor()
    await page.getByText('2026-10 · 0 张照片').waitFor()
    mode = 'hold'; await page.goto(`${base}${href}`, { waitUntil: 'domcontentloaded' })
    for (let i = 0; i < 100 && !release; i++) await page.waitForTimeout(25)
    assert.equal(typeof release, 'function')
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push({ name: 'photoAlbum', query: { month: '2025-03' } }) })
    await page.getByText('2025-03 · 0 张照片').waitFor()
    release(); await page.waitForTimeout(250)
    assert.equal(await viewer.isVisible(), false, 'late location results must not open a photo in another month')
    assert.deepEqual(errors, [])
    console.log('Dashboard photo navigation passed: exact cross-month location, stale links, old servers and races')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
