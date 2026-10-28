const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Album tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const photos = Array.from({ length: 30 }, (_, index) => ({ memoryId: 'memory-a', photoIndex: index, date: '2026-10-28', mealType: 'dinner', title: `照片${index + 1}`, photo: index === 3 ? '/broken-photo.png' : `${image}#${index}`, meals: [] }))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test' })) })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let legacy = false
    let malformed = false
    let failPage = false
    const reads = []
    await page.route('**/broken-photo.png', route => route.fulfill({ status: 404, body: '' }))
    await page.route('**/api/**', async route => {
      const req = route.request()
      const url = new URL(req.url())
      const path = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/photo-album') {
        const month = url.searchParams.get('month')
        const current = Number(url.searchParams.get('page') || 1)
        const limit = Number(url.searchParams.get('limit') || 24)
        reads.push({ month, page: current, limit })
        if (failPage && current === 2) return route.fulfill({ status: 503, json: { error: '相册读取失败' } })
        const rows = month === '2026-10' ? photos : []
        data = legacy ? { month, photos: rows } : { month, total: rows.length, page: current, limit, photos: malformed ? [] : rows.slice((current - 1) * limit, current * limit) }
      } else if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/photo-album`)
    await page.getByText('2026-10 · 30 张照片').waitFor()
    assert.equal(await page.locator('.photo-card').count(), 24)
    assert.ok(reads.every(read => read.limit === 24 && read.page >= 1))
    await page.locator('.photo-card img[alt="图片暂不可用"]').waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_ALBUM_SHOT) await page.screenshot({ path: process.env.EATWHAT_ALBUM_SHOT })
    await page.getByRole('button', { name: '下一页' }).click()
    await page.getByRole('button', { name: /第 25 张/ }).click()
    const viewer = page.getByRole('dialog', { name: '饭桌回忆' })
    await viewer.getByText('25 / 30').waitFor()
    await page.keyboard.press('ArrowLeft')
    await viewer.getByText('24 / 30').waitFor()
    await page.keyboard.press('ArrowRight')
    await viewer.getByText('25 / 30').waitFor()
    await viewer.getByRole('button', { name: '下一张照片' }).click()
    await viewer.getByText('26 / 30').waitFor()
    await page.keyboard.press('Escape')
    await viewer.waitFor({ state: 'hidden' })
    legacy = true
    await page.reload()
    await page.getByText('2026-10 · 30 张照片').waitFor()
    assert.equal(await page.locator('.photo-card').count(), 24)
    await page.getByRole('button', { name: '下一页' }).click()
    await page.getByRole('button', { name: /第 25 张/ }).waitFor()
    assert.equal(await page.locator('.photo-card').count(), 6)
    legacy = false
    failPage = true
    await page.getByRole('button', { name: '上一页' }).click()
    await page.getByRole('button', { name: /第 1 张/ }).waitFor()
    await page.getByRole('button', { name: '下一页' }).click()
    await page.getByText('相册暂时无法加载', { exact: false }).waitFor()
    assert.equal(await page.locator('.photo-card').count(), 0)
    failPage = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByRole('button', { name: /第 25 张/ }).waitFor()
    await page.getByRole('button', { name: '下个月' }).click()
    await page.getByText('这个月还没有饭桌照片').waitFor()
    await page.getByRole('button', { name: '上个月' }).click()
    await page.getByText('2026-10 · 30 张照片').waitFor()
    malformed = true
    await page.reload()
    await page.getByText('相册分页数据不完整', { exact: false }).waitFor()
    assert.equal(await page.getByText('这个月还没有饭桌照片').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Album workflows passed: pagination, cross-page viewer, failures, legacy compatibility and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
