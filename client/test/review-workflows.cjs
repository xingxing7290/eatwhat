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
    photos: [{ memoryId: 'memory-a', date, title: '温暖的晚餐', photo: '/api/uploads/missing.jpg' }],
    recentMemories: [{ _id: 'memory-a', date, title: '温暖的晚餐', mealType: 'dinner', mood: '开心' }]
  }
}

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 29, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test' })) })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    let scenario = 'normal'; let slowStarted
    const slowRequest = new Promise(resolve => { slowStarted = resolve })
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url())
      if (url.pathname.startsWith('/api/review/')) {
        const type = url.pathname.endsWith('/yearly') ? 'year' : 'month'; const label = url.searchParams.get(type === 'year' ? 'year' : 'month')
        if (label === '2026-02') { slowStarted(); await new Promise(resolve => setTimeout(resolve, 1200)) }
        if (scenario === 'failure') return route.fulfill({ status: 503, json: { error: '暂时无法读取' } })
        const data = fixture(type, label)
        if (scenario === 'legacy') delete data.supportsHouseholdScopedReview
        if (scenario === 'malformed') data.range.end = '1999-01-01'
        if (scenario === 'empty') { data.summary = { ...data.summary, memoryCount: 0, plannedMealCount: 0, reviewedDayCount: 0, photoCount: 0 }; data.topMeals = []; data.moodStats = []; data.categoryStats = []; data.healthTagStats = []; data.bestMemory = null; data.photos = []; data.recentMemories = [] }
        return route.fulfill({ json: data })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/review`)
    await page.getByRole('heading', { name: '把日子，慢慢记下来' }).waitFor()
    await page.getByRole('heading', { name: '这一段日常，值得回味' }).waitFor()
    await page.getByText('记录了 2 条排餐和 1 条回忆', { exact: false }).waitFor()
    assert.equal(await page.getByRole('link', { name: /番茄炒蛋/ }).getAttribute('href'), '/meals/detail/meal-a')
    assert.match(await page.locator('.feature-link').getAttribute('href'), /\/memories\?edit=memory-a/)
    assert.match(await page.locator('.photo-card').getAttribute('href'), /\/memories\?edit=memory-a/)
    await page.getByAltText('图片暂不可用').first().waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_REVIEW_SHOT) await page.screenshot({ path: process.env.EATWHAT_REVIEW_SHOT })
    const logs = await page.evaluate(async () => JSON.stringify((await import('/src/services/api.js')).apiLogs.history))
    assert.equal(logs.includes('样例私密服务端文案'), false, 'review content must not enter API debug history')
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
    scenario = 'legacy'; await page.getByLabel('选择回顾月份').click(); await page.locator('.el-month-table:visible').getByText('四月', { exact: true }).click()
    await page.getByText('服务器未提供安全的家庭回顾能力', { exact: false }).waitFor()
    assert.equal(await page.locator('.meal-row').count(), 0)
    scenario = 'malformed'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('回顾时间范围不完整', { exact: false }).waitFor()
    scenario = 'failure'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.locator('.state-card').getByText('暂时无法读取', { exact: false }).waitFor()
    scenario = 'empty'; await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByRole('heading', { name: '新的饭桌故事，等你开始' }).waitFor()
    assert.equal(await page.getByRole('link', { name: '去安排一餐 →' }).getAttribute('href'), '/calendar')
    assert.deepEqual(errors, [])
    console.log('Review workflows passed: month/year, scoped capability, race, invalid data and empty states')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
