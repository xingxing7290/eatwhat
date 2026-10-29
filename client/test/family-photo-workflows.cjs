const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Family photo checks require a local server')
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="green"/></svg>'
async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const errors = []; const images = []; page.on('pageerror', error => errors.push(error.message))
    const local = 'http://127.0.0.1/uploads/family.png?v=2#photo'; const external = 'https://cdn.example.test/uploads/external.png'
    const memory = { _id: 'memory-a', date: '2026-10-28', title: '家宴回忆', mealType: 'dinner', photos: [local, external], mealIds: [] }
    const rows = memory.photos.map((photo, photoIndex) => ({ memoryId: 'memory-a', photoIndex, date: memory.date, title: memory.title, mealType: 'dinner', photo, meals: [] }))
    const meals = { breakfast: [], lunch: [], dinner: [] }; const today = '2026-10-28'
    const summary = { today, todaySchedule: { meals }, todayHints: [], week: { days: Array.from({ length: 7 }, (_, index) => ({ date: new Date(Date.parse(`${today}T00:00:00Z`) + (index - 3) * 86400000).toISOString().slice(0, 10), meals })) }, partnerWishlist: [], recentPhotos: rows, defaultMeals: { imported: 0, total: 0 }, imageIssues: { open: 0 }, meals: { favorites: 0 } }
    await page.route('**/uploads/**', route => { images.push(route.request().url()); return route.fulfill({ status: 404, body: '' }) })
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/dashboard/summary') return route.fulfill({ json: summary })
      if (path === '/memories') return route.fulfill({ json: [memory] })
      if (path === '/anniversaries') return route.fulfill({ json: [{ _id: 'menu-a', title: '家庭纪念日', date: today, photos: memory.photos, meals: { breakfast: [], lunch: [], dinner: [] } }] })
      if (path === '/anniversary-templates') return route.fulfill({ json: [] })
      if (path === '/photo-album') return route.fulfill({ json: { month: '2026-10', page: 1, limit: 24, total: rows.length, photos: rows } })
      if (path === '/review/monthly') return route.fulfill({ json: { supportsHouseholdScopedReview: true, type: 'month', label: '2026-10', range: { start: '2026-10-01', end: '2026-10-31' }, summary: { memoryCount: 1, plannedMealCount: 0, reviewedDayCount: 1, photoCount: 2, wishlistOpen: 0, mealTotal: 0, favoriteTotal: 0 }, topMeals: [], moodStats: [], categoryStats: [], healthTagStats: [], bestMemory: null, recentMemories: [], photos: rows.map(row => ({ ...row, memoryId: row.memoryId })) } })
      return route.fulfill({ json: {} })
    })
    await page.route('**/api/uploads/**', route => { images.push(route.request().url()); return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg }) })
    const loaded = async selector => {
      const image = page.locator(selector).first(); await image.scrollIntoViewIfNeeded()
      await image.waitFor(); await page.waitForFunction(selector => { const img = document.querySelector(selector); return img?.complete && img.naturalWidth > 0 && img.src.includes('/api/uploads/family.png?v=2') }, selector)
    }
    await page.goto(`${base}/dashboard`)
    await loaded('.photo-strip a:first-child img')
    await page.locator('.photo-strip a').nth(1).scrollIntoViewIfNeeded()
    await page.getByText('照片暂不可用', { exact: false }).first().waitFor()
    await page.goto(`${base}/memories`)
    await loaded('.memory-photo:first-child img')
    await page.getByRole('button', { name: '查看家宴回忆的第 1 张照片' }).click()
    await loaded('.photo-preview')
    await page.keyboard.press('Escape')
    await page.goto(`${base}/anniversaries`)
    await loaded('.photo-button:first-child img')
    await page.goto(`${base}/photo-album?month=2026-10`)
    await loaded('.album-grid .photo-card:first-child img')
    await page.goto(`${base}/review?month=2026-10`)
    await loaded('.photo-grid .photo-card:first-child img')
    assert.ok(images.some(url => url.startsWith(`${base}/uploads/family.png?v=2`)))
    assert.ok(images.some(url => url.startsWith(`${base}/api/uploads/family.png?v=2`)))
    assert.equal(images.some(url => url.includes('/api/uploads/external.png')), false, 'a failed external photo must not be replaced by a local path')
    assert.deepEqual(errors, [])
    console.log('Family photo checks passed: dashboard, memories, anniversaries, album and review')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
