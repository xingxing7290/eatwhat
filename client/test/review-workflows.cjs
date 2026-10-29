const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Review tests require a local server')

function fixture (type, label) {
  const month = type === 'month' ? label : `${label}-01`
  const [y, m] = month.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const date = `${month}-10`
  return {
    supportsHouseholdScopedReview: true, type, label,
    range: type === 'month' ? { start: `${month}-01`, end: `${month}-${String(last).padStart(2, '0')}` } : { start: `${label}-01-01`, end: `${label}-12-31` },
    summary: { memoryCount: 1, plannedMealCount: 2, reviewedDayCount: 1, photoCount: 1, wishlistOpen: 3, mealTotal: 15, favoriteTotal: 2, sentence: '样例私密服务端文案' },
    topMeals: [{ id: 'meal-a', name: '番茄炒蛋', count: 3, memoryCount: 1, scheduleCount: 2, imageUrl: '/api/uploads/missing.jpg' }],
    moodStats: [{ mood: '开心', count: 1 }], categoryStats: [{ category: '家常菜', count: 3 }], healthTagStats: [{ tag: '少油', count: 1 }],
    bestMemory: { id: 'memory-a', date, title: '温暖的晚餐', mealType: 'dinner', mood: '开心', note: '和家人一起', rating: 5, photos: ['/api/uploads/missing.jpg'] },
    photos: [{ memoryId: '0123456789abcdef01234567', photoIndex: 2, fingerprint: 'a'.repeat(64), date, title: '温暖的晚餐', photo: '/api/uploads/missing.jpg' }],
    recentMemories: [{ _id: 'memory-a', date, title: '温暖的晚餐', mealType: 'dinner', mood: '开心' }]
  }
}

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 29, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test', householdId: 'home-a' })) })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    let scenario = 'normal'; let slowStarted
    const slowRequest = new Promise(resolve => { slowStarted = resolve })
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const url = new URL(route.request().url())
      if (url.pathname === '/api/memories') {
        const month = url.searchParams.get('month') || ''
        return route.fulfill({ json: { supportsMemoryTimeline: true, page: 1, limit: 12, search: '', month, mealType: 'all', photos: 'all', total: 1, items: [{ _id: 'memory-a', date: `${month || '2026-10'}-10`, title: '温暖的晚餐', photos: [], mealIds: [] }] } })
      }
      if (url.pathname === '/api/photo-album') {
        const month = url.searchParams.get('month')
        const photo = { memoryId: '0123456789abcdef01234567', photoIndex: 2, date: `${month}-10`, title: '温暖的晚餐', photo: '/api/uploads/missing.jpg' }
        if (url.searchParams.get('view') === 'locate') return route.fulfill({ json: { supportsPhotoLocate: true, month, memoryId: photo.memoryId, photoIndex: photo.photoIndex, fingerprint: 'a'.repeat(64), photo: photo.photo, position: 1, page: 1, limit: 24 } })
        return route.fulfill({ json: { month, photos: [photo], total: 1, page: 1, limit: 24 } })
      }
      if (url.pathname.startsWith('/api/review/')) {
        const type = url.pathname.endsWith('/yearly') ? 'year' : 'month'; const label = url.searchParams.get(type === 'year' ? 'year' : 'month')
        if (label === '2026-02') { slowStarted(); await new Promise(resolve => setTimeout(resolve, 1200)) }
        if (scenario === 'failure') return route.fulfill({ status: 503, json: { error: '暂时无法读取' } })
        const data = fixture(type, label)
        if (scenario === 'legacy') delete data.supportsHouseholdScopedReview
        if (scenario === 'malformed') data.range.end = '1999-01-01'
        if (scenario === 'oldphoto') { delete data.photos[0].photoIndex; delete data.photos[0].fingerprint }
        if (scenario === 'invalidphoto') data.photos[0].date = `${label}-02-31`
        if (scenario === 'empty') { data.summary = { ...data.summary, memoryCount: 0, plannedMealCount: 0, reviewedDayCount: 0, photoCount: 0 }; data.topMeals = []; data.moodStats = []; data.categoryStats = []; data.healthTagStats = []; data.bestMemory = null; data.photos = []; data.recentMemories = [] }
        return route.fulfill({ json: data })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/review`)
    await page.getByRole('heading', { name: '把日子，慢慢记下来' }).waitFor()
    await page.getByRole('heading', { name: '这一段日常，值得回味' }).waitFor()
    await page.getByText('记录了 2 条排餐和 1 条回忆', { exact: false }).waitFor()
    assert.equal(await page.getByRole('link', { name: '本月回忆 →' }).getAttribute('href'), '/memories?month=2026-10')
    await page.getByRole('link', { name: '本月回忆 →' }).click()
    await page.waitForURL('**/memories?month=2026-10')
    await page.locator('.memory-card').getByText('温暖的晚餐', { exact: true }).waitFor()
    assert.equal(await page.getByLabel('按月份筛选回忆').inputValue(), '2026-10')
    await page.goBack(); await page.getByRole('heading', { name: '这一段日常，值得回味' }).waitFor()
    assert.equal(await page.getByRole('link', { name: /番茄炒蛋/ }).getAttribute('href'), '/meals/detail/meal-a')
    assert.match(await page.locator('.feature-link').getAttribute('href'), /\/memories\?edit=memory-a/)
    assert.match(await page.locator('.feature-link').getAttribute('href'), /month=2026-10/)
    assert.match(await page.locator('.recent-list a').first().getAttribute('href'), /month=2026-10/)
    const photoUrl = new URL(await page.locator('.photo-card').getAttribute('href'), base)
    assert.equal(photoUrl.pathname, '/photo-album')
    assert.equal(photoUrl.searchParams.get('month'), '2026-10')
    assert.equal(photoUrl.searchParams.get('photoIndex'), '2')
    assert.equal(photoUrl.searchParams.get('fingerprint'), 'a'.repeat(64))
    await page.locator('.photo-card').click()
    await page.getByRole('dialog', { name: '饭桌回忆' }).getByText('温暖的晚餐').waitFor()
    await page.goBack(); await page.locator('.photo-card').waitFor()
    scenario = 'oldphoto'; await page.reload()
    await page.locator('.photo-card').waitFor()
    assert.match(await page.locator('.photo-card').getAttribute('href'), /\/memories\?edit=0123456789abcdef01234567/)
    scenario = 'normal'; await page.reload(); await page.locator('.photo-card').waitFor()
    await page.getByAltText('图片暂不可用').first().waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_REVIEW_SHOT) await page.screenshot({ path: process.env.EATWHAT_REVIEW_SHOT })
    const logs = await page.evaluate(async () => JSON.stringify((await import('/src/services/api.js')).apiLogs.history))
    assert.equal(logs.includes('样例私密服务端文案'), false, 'review content must not enter API debug history')
    const navigation = page.getByRole('group', { name: '切换回顾时间' })
    assert.equal(await navigation.getByRole('button', { name: '回到本月' }).isDisabled(), true)
    await navigation.getByRole('button', { name: '上个月' }).click()
    await page.getByText('2026 年 9 月 · OUR STORY', { exact: true }).waitFor()
    assert.equal(await page.getByRole('link', { name: '打开本月相册 →' }).getAttribute('href'), '/photo-album?month=2026-09')
    await navigation.getByRole('button', { name: '下个月' }).click()
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '下个月' }).click()
    await page.getByText('2026 年 11 月 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('radio', { name: '年度' }).focus(); await page.keyboard.press('Space')
    await page.getByText('2026 年 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '下一年' }).click()
    await page.getByText('2027 年 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('radio', { name: '月度' }).focus(); await page.keyboard.press('Space')
    await page.getByText('2027 年 11 月 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '回到本月' }).click()
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await page.clock.setFixedTime(new Date(2026, 10, 1, 12)); await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    assert.equal(await navigation.getByRole('button', { name: '回到本月' }).isEnabled(), true, 'current-period control must refresh after a month rollover')
    await page.clock.setFixedTime(new Date(2026, 9, 29, 12)); await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.getByLabel('选择回顾月份').click()
    await page.locator('.el-month-table:visible').getByText('十二月', { exact: true }).click()
    await page.getByText('2026 年 12 月 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '下个月' }).click()
    await page.getByText('2027 年 1 月 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '上个月' }).click()
    await page.getByText('2026 年 12 月 · OUR STORY', { exact: true }).waitFor()
    await navigation.getByRole('button', { name: '回到本月' }).click()
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('radio', { name: '年度' }).focus(); await page.keyboard.press('Space')
    await page.getByText('2026 年 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('radio', { name: '月度' }).focus(); await page.keyboard.press('Space')
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await page.getByLabel('选择回顾月份').click()
    await page.locator('.el-month-table:visible').getByText('二月', { exact: true }).click()
    await slowRequest
    await page.getByLabel('选择回顾月份').click()
    await page.locator('.el-month-table:visible').getByText('三月', { exact: true }).click()
    await page.getByText('2026 年 3 月 · OUR STORY', { exact: true }).waitFor()
    await page.waitForTimeout(1500)
    assert.equal(await page.getByText('2026 年 2 月 · OUR STORY', { exact: true }).count(), 0, 'late responses must not replace the selected period')
    await page.waitForURL('**/review?month=2026-03')
    await page.reload()
    await page.getByText('2026 年 3 月 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('link', { name: '打开本月相册 →' }).click()
    await page.waitForURL('**/photo-album?month=2026-03')
    await page.goBack()
    await page.getByText('2026 年 3 月 · OUR STORY', { exact: true }).waitFor()
    scenario = 'legacy'; await page.getByLabel('选择回顾月份').click(); await page.locator('.el-month-table:visible').getByText('四月', { exact: true }).click()
    await page.getByText('服务器未提供安全的家庭回顾能力', { exact: false }).waitFor()
    assert.equal(await page.locator('.meal-row').count(), 0)
    scenario = 'malformed'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('回顾时间范围不完整', { exact: false }).waitFor()
    scenario = 'failure'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.locator('.state-card').getByText('暂时无法读取', { exact: false }).waitFor()
    scenario = 'empty'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByRole('heading', { name: '新的饭桌故事，等你开始' }).waitFor()
    assert.equal(await page.getByRole('link', { name: '查看本月日历 →' }).getAttribute('href'), '/calendar?month=2026-04')
    await page.getByRole('link', { name: '查看本月日历 →' }).click()
    await page.waitForURL('**/calendar?month=2026-04')
    await page.goBack()
    await page.getByRole('heading', { name: '新的饭桌故事，等你开始' }).waitFor()
    await page.getByRole('radio', { name: '年度' }).focus(); await page.keyboard.press('Space')
    await page.getByRole('link', { name: '查看本年一月日历 →' }).waitFor()
    assert.equal(await page.getByRole('link', { name: '查看本年一月日历 →' }).getAttribute('href'), '/calendar?month=2026-01')
    assert.equal(await page.getByRole('link', { name: '打开 2026-01 相册 →' }).getAttribute('href'), '/photo-album?month=2026-01')
    scenario = 'normal'
    await page.goto(`${base}/review?year=2024`)
    await page.getByText('2024 年 · OUR STORY', { exact: true }).waitFor()
    assert.equal(await page.getByRole('link', { name: '打开 2024-01 相册 →' }).getAttribute('href'), '/photo-album?month=2024-01')
    await page.setViewportSize({ width: 320, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.setViewportSize({ width: 390, height: 844 })
    scenario = 'invalidphoto'; await page.reload()
    await page.getByText('回顾照片数据不完整', { exact: false }).waitFor()
    scenario = 'normal'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('2024 年 · OUR STORY', { exact: true }).waitFor()
    await page.reload(); await page.getByText('2024 年 · OUR STORY', { exact: true }).waitFor()
    await page.goto(`${base}/review?year=2024&month=2026-03`)
    await page.getByText('回顾链接中的时间无效', { exact: false }).waitFor()
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push({ name: 'review', query: { year: '2023' } }))
    await page.getByText('2023 年 · OUR STORY', { exact: true }).waitFor()
    await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push({ name: 'review', query: { month: '2026-13' } }))
    await page.getByText('回顾链接中的时间无效', { exact: false }).waitFor()
    await page.getByText('2026 年 10 月 · OUR STORY', { exact: true }).waitFor()
    await page.getByRole('group', { name: '切换回顾时间' }).getByRole('button', { name: '上个月' }).click()
    await page.waitForURL('**/review?month=2026-09')
    assert.equal(await page.getByText('回顾链接中的时间无效', { exact: false }).count(), 0)
    assert.deepEqual(errors, [])
    console.log('Review workflows passed: month/year, scoped capability, race, invalid data and empty states')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
