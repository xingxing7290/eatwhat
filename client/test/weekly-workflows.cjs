const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Weekly tests require a local test server')
const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
const meal = { _id: 'meal-a', name: '番茄炒蛋' }
const emptyMeals = () => ({ breakfast: [], lunch: [], dinner: [] })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户' }))
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let currentDays = dates.map(date => ({ date, meals: emptyMeals(), scheduleExists: false, scheduleVersion: null }))
    let draftMode = 'valid'
    let applyMode = 'incomplete'
    let malformedCurrent = false
    let generateCalls = 0
    let applyCalls = 0
    const planned = () => dates.map(date => ({ date, meals: { ...emptyMeals(), dinner: [meal._id] } }))
    await page.route('**/api/**', async route => {
      const req = route.request()
      const pathname = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && pathname === '/weekly-plans') {
        data = { weekStart: dates[0], supportsConditionalApply: true, days: malformedCurrent ? currentDays.map((day, i) => i === 0 ? { ...day, meals: {} } : day) : currentDays }
      } else if (req.method() === 'POST' && pathname === '/weekly-plans/generate') {
        generateCalls++
        const days = planned()
        const preview = days.map(day => ({ date: day.date, meals: { ...emptyMeals(), dinner: [meal] }, hints: [] }))
        if (draftMode === 'mismatch') preview[0].meals.dinner = [{ _id: 'meal-b', name: '另一道菜' }]
        data = { weekStart: dates[0], days, preview }
      } else if (req.method() === 'POST' && pathname === '/weekly-plans/apply') {
        applyCalls++
        const body = req.postDataJSON()
        assert.deepEqual(body.days, planned())
        assert.deepEqual(Object.keys(body.expectedVersions), dates)
        currentDays = dates.map(date => ({ date, meals: { ...emptyMeals(), dinner: [{ meal }] }, scheduleExists: true, scheduleVersion: '2026-10-28T09:00:00.000Z' }))
        data = applyMode === 'incomplete' ? { applied: 7 } : { weekStart: dates[0], applied: 7, days: currentDays.map(day => ({ ...day, updatedAt: day.scheduleVersion })) }
      } else if (req.method() === 'GET' && pathname === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      await route.fulfill({ status: 200, json: data })
    })

    await page.goto(`${base}/weekly-plan`)
    await page.getByRole('heading', { name: /周一.*2026-10-26/ }).waitFor()
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByText('规则生成草稿').waitFor()
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByRole('button', { name: '保留草稿' }).click()
    assert.equal(generateCalls, 1)
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await page.locator('.mobile-nav').getByRole('link', { name: '首页' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByText('规则生成草稿').count(), 1)
    await page.getByLabel('选择周计划日期').click()
    await page.locator('.el-date-picker:visible td.next-month').filter({ hasText: /^2$/ }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByLabel('选择周计划日期').inputValue(), dates[0])

    draftMode = 'mismatch'
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByRole('button', { name: '重新生成', exact: true }).click()
    await page.getByText('草稿预览与提交菜品不一致').waitFor()
    assert.equal(generateCalls, 2)
    assert.equal(await page.getByText('规则生成草稿').count(), 1, 'invalid replacement must not destroy the existing draft')
    await page.getByRole('button', { name: '应用到日历' }).click()
    await page.getByRole('button', { name: '确认替换' }).click()
    await page.getByText('可能有部分日期已写入', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '生成草稿' }).isDisabled(), true)
    assert.equal(await page.getByText('规则生成草稿').count(), 0)
    await page.getByRole('button', { name: '已核对，继续' }).click()
    draftMode = 'valid'
    applyMode = 'success'
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByText('规则生成草稿').waitFor()
    await page.getByRole('button', { name: '应用到日历' }).click()
    await page.getByRole('button', { name: '确认替换' }).click()
    await page.getByText('已应用到日历').waitFor()
    assert.equal(applyCalls, 2)
    assert.equal(await page.getByText('规则生成草稿').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_WEEKLY_SHOT) {
      await page.locator('.el-overlay:visible').waitFor({ state: 'hidden' })
      await page.waitForTimeout(500)
      await page.screenshot({ path: process.env.EATWHAT_WEEKLY_SHOT, fullPage: true })
    }
    malformedCurrent = true
    await page.goto(`${base}/weekly-plan`)
    await page.getByText('无法读取当前日历安排', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '生成草稿' }).isDisabled(), true)
    assert.deepEqual(errors, [])
    console.log('Weekly workflows passed: draft guards, date switching, preview integrity, uncertain writes and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
