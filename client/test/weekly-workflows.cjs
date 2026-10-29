const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Weekly tests require a local test server')
const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
const meal = { _id: 'meal-a', name: '番茄炒蛋', category: '家常菜', imageUrl: '/uploads/legacy-weekly.png?v=2' }
const extra = { _id: 'meal-b', name: '麻婆豆腐', category: '川菜' }
const catalog = [meal, extra, ...Array.from({ length: 10 }, (_, i) => ({ _id: `other-${i + 1}`, name: `测试菜${String(i + 1).padStart(2, '0')}`, category: '家常菜' }))]
const emptyMeals = () => ({ breakfast: [], lunch: [], dinner: [] })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户', householdId: 'home-a' }))
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let currentDays = dates.map(date => ({ date, meals: emptyMeals(), scheduleExists: false, scheduleVersion: null }))
    let draftMode = 'valid'
    let applyMode = 'invalid'
    let malformedCurrent = false
    let generateCalls = 0
    let applyCalls = 0
    let releaseSlow
    let legacyCatalog = false
    let failCatalog = false
    let holdCurrent = true; let releaseCurrent
    const planned = () => dates.map(date => ({ date, meals: { ...emptyMeals(), dinner: [meal._id] } }))
    let expectedPlan = planned()
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request()
      const url = new URL(req.url())
      const pathname = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && pathname === '/meals/categories') data = [{ category: '家常菜' }, { category: '川菜' }]
      else if (req.method() === 'GET' && pathname === '/meals') {
        if (failCatalog) return route.fulfill({ status: 503, json: { error: '菜品暂不可用' } })
        const search = url.searchParams.get('search') || ''
        if (search === 'slow') await new Promise(resolve => { releaseSlow = resolve })
        const rows = search === 'slow' ? [meal] : search === 'fast' ? [extra] : catalog.filter(item => (!search || item.name.includes(search)) && (!url.searchParams.get('category') || item.category === url.searchParams.get('category')))
        const current = Number(url.searchParams.get('page') || 1)
        const limit = Number(url.searchParams.get('limit') || 8)
        if (search === '坏页') data = { data: [meal], page: 2, limit, total: 1 }
        else if (search === '重复') data = { data: [meal, meal], page: 1, limit, total: 2 }
        else if (search === '缺项') data = { data: [meal], page: 1, limit, total: 2 }
        else if (search === '无分页') data = { data: [meal], total: 10 }
        else data = legacyCatalog ? catalog : { data: rows.slice((current - 1) * limit, current * limit), page: current, limit, total: rows.length }
      } else if (req.method() === 'GET' && pathname === '/weekly-plans') {
        if (holdCurrent) await new Promise(resolve => { releaseCurrent = resolve })
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
        assert.deepEqual(body.days, expectedPlan)
        assert.deepEqual(Object.keys(body.expectedVersions), dates)
        if (applyMode === 'invalid') return route.fulfill({ status: 400, json: { code: 'WEEKLY_PLAN_INVALID', error: '计划中包含无效菜品', appliedDates: [] } })
        currentDays = body.days.map(day => ({ date: day.date, meals: Object.fromEntries(Object.entries(day.meals).map(([type, ids]) => [type, ids.map(id => ({ meal: catalog.find(item => item._id === id) }))])), scheduleExists: true, scheduleVersion: '2026-10-28T09:00:00.000Z' }))
        data = applyMode === 'incomplete' ? { applied: 7 } : { weekStart: dates[0], applied: 7, days: currentDays.map(day => ({ ...day, updatedAt: day.scheduleVersion })) }
      } else if (req.method() === 'GET' && pathname === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      await route.fulfill({ status: 200, json: data })
    })
    await page.route('**/uploads/**', route => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/uploads/legacy-weekly.png') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>' })
      return route.fulfill({ status: 404, body: '' })
    })

    await page.goto(`${base}/weekly-plan`)
    await page.getByRole('status').getByText('正在读取所选周的日历安排…').waitFor()
    assert.equal(await page.getByText('当前日历安排', { exact: true }).count(), 0, 'loading must not present an empty calendar card as loaded data')
    for (let i = 0; i < 100 && !releaseCurrent; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof releaseCurrent, 'function')
    holdCurrent = false; releaseCurrent()
    await page.getByRole('heading', { name: /周一.*2026-10-26/ }).waitFor()
    await page.getByText('购物清单不会随排餐变动自动更新', { exact: false }).waitFor()
    const dateLink = page.getByRole('link', { name: '查看 2026-11-01 的日历安排' })
    assert.ok((await dateLink.boundingBox()).height >= 44)
    await dateLink.click()
    await page.waitForURL('**/calendar?date=2026-11-01')
    await page.goBack()
    await page.getByRole('heading', { name: /周一.*2026-10-26/ }).waitFor()
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByText('规则生成草稿').waitFor()
    await page.getByText('草稿尚未写入日历，不会计入生成结果。').waitFor()
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.getByRole('link', { name: '查看 2026-11-01 的日历安排' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(new URL(page.url()).pathname, '/weekly-plan')
    assert.equal(await page.getByText('规则生成草稿').count(), 1)
    assert.equal(applyCalls, 0)
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByRole('button', { name: '保留草稿' }).click()
    assert.equal(generateCalls, 1)
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await page.locator('.mobile-nav').getByRole('link', { name: '首页' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByText('规则生成草稿').count(), 1)
    await page.locator('.mobile-nav').getByRole('button', { name: '关闭导航菜单' }).click()
    await page.getByRole('group', { name: '切换周计划日期' }).getByRole('button', { name: '下一周' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByLabel('选择周计划日期').inputValue(), dates[0], 'cancelling week navigation preserves the draft and selected week')
    await page.getByLabel('选择周计划日期').click()
    await page.locator('.el-date-picker:visible td.next-month').filter({ hasText: /^2$/ }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByLabel('选择周计划日期').inputValue(), dates[0])

    await page.getByRole('button', { name: '调整2026-10-26晚餐' }).click()
    const dialog = page.getByRole('dialog', { name: '调整 2026-10-26 晚餐' })
    await dialog.getByRole('button', { name: '移除番茄炒蛋' }).waitFor()
    await page.waitForFunction(() => [...document.querySelectorAll('.weekly-meal-picker .meal-option img')].some(image => image.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/legacy-weekly.png?v=2')))
    const search = dialog.getByRole('textbox', { name: '搜索周计划菜品' })
    await search.fill('slow')
    await page.waitForTimeout(250)
    assert.equal(typeof releaseSlow, 'function')
    await search.fill('fast')
    await dialog.getByRole('button', { name: '选择麻婆豆腐' }).waitFor()
    releaseSlow()
    await page.waitForTimeout(250)
    assert.equal(await dialog.getByRole('button', { name: '选择麻婆豆腐' }).count(), 1)
    await dialog.getByRole('button', { name: '选择麻婆豆腐' }).click()
    for (const fault of ['坏页', '重复', '缺项', '无分页']) {
      await search.fill(fault)
      await dialog.locator('.catalog-error').waitFor()
      assert.equal(await dialog.locator('.meal-option').count(), 0, `${fault} must not display unreliable choices`)
      assert.equal(await dialog.getByRole('button', { name: '移除麻婆豆腐' }).count(), 1, 'existing selections must remain intact')
    }
    await search.fill('')
    await dialog.getByRole('button', { name: '下一页' }).click()
    await dialog.getByRole('button', { name: '选择测试菜09' }).click()
    await dialog.getByRole('button', { name: '移除测试菜09' }).click()
    await dialog.getByRole('button', { name: '移除麻婆豆腐' }).waitFor()
    await dialog.getByRole('complementary', { name: '周计划菜品分类' }).getByRole('button', { name: '川菜' }).click()
    await dialog.getByRole('button', { name: '取消选择麻婆豆腐' }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: '选择测试菜01' }).count(), 0)
    if (process.env.EATWHAT_WEEKLY_PICKER_SHOT) await page.screenshot({ path: process.env.EATWHAT_WEEKLY_PICKER_SHOT })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: '继续选择' }).click()
    assert.equal(await dialog.isVisible(), true)
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '继续选择' }).click()
    await dialog.getByRole('button', { name: '保存到草稿' }).click()
    await page.getByText('已调整，请自行核对当天搭配。').first().waitFor()
    assert.equal(applyCalls, 0, 'editing a draft must not write to the server')
    failCatalog = true
    await page.getByRole('button', { name: '调整2026-10-26晚餐' }).click()
    await dialog.getByRole('alert').waitFor()
    await dialog.getByRole('button', { name: '移除番茄炒蛋' }).waitFor()
    failCatalog = false
    legacyCatalog = true
    await dialog.getByRole('button', { name: '重试' }).click()
    await dialog.getByRole('button', { name: '取消选择番茄炒蛋' }).waitFor()
    await dialog.getByRole('complementary', { name: '周计划菜品分类' }).getByRole('button', { name: '川菜' }).click()
    await dialog.getByRole('button', { name: '取消选择麻婆豆腐' }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: '取消选择番茄炒蛋' }).count(), 0, 'legacy catalog filtering remains local and paginated')
    await dialog.getByRole('button', { name: '移除番茄炒蛋' }).click()
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '放弃调整' }).click()
    await page.getByRole('button', { name: '调整2026-10-26晚餐' }).click()
    await dialog.getByRole('button', { name: '移除番茄炒蛋' }).waitFor()
    await dialog.getByRole('button', { name: '移除番茄炒蛋' }).click()
    await dialog.getByRole('button', { name: '保存到草稿' }).click()
    expectedPlan[0].meals.dinner = ['meal-b']
    await page.getByRole('button', { name: '调整2026-10-27晚餐' }).click()
    const tuesdayDialog = page.getByRole('dialog', { name: '调整 2026-10-27 晚餐' })
    await tuesdayDialog.getByRole('button', { name: '移除番茄炒蛋' }).click()
    await tuesdayDialog.getByRole('button', { name: '保存到草稿' }).click()
    expectedPlan[1].meals.dinner = []

    draftMode = 'mismatch'
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByRole('button', { name: '重新生成', exact: true }).click()
    await page.getByText('草稿预览与提交菜品不一致').waitFor()
    assert.equal(generateCalls, 2)
    assert.equal(await page.getByText('规则生成草稿').count(), 1, 'invalid replacement must not destroy the existing draft')
    await page.getByRole('button', { name: '应用到日历' }).click()
    await page.getByRole('button', { name: '确认替换' }).click()
    await page.getByText('草稿已保留，请调整无效菜品或重新检查后重试。').waitFor()
    assert.equal(await page.getByText('规则生成草稿').count(), 1)
    applyMode = 'incomplete'
    await page.getByRole('button', { name: '应用到日历' }).click()
    await page.getByRole('button', { name: '确认替换' }).click()
    await page.getByText('可能有部分日期已写入', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '生成草稿' }).isDisabled(), true)
    assert.equal(await page.getByText('规则生成草稿').count(), 1, 'uncertain writes must retain the adjusted draft for reference')
    await page.locator('.draft-card').getByText('麻婆豆腐', { exact: true }).waitFor()
    await page.getByText('这份草稿保留供参考，不能直接应用', { exact: false }).waitFor()
    for (const width of [320, 1280]) for (const dark of [false, true]) for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
      await page.setViewportSize({ width, height: 844 })
      await page.evaluate(({ dark, theme }) => { document.documentElement.classList.toggle('dark', dark); document.querySelector('.app-container').classList.toggle('dark-mode', dark); document.documentElement.dataset.theme = theme }, { dark, theme })
      assert.ok((await contrast(page, '.draft-card .unavailable-alert .el-alert__title')).ratio >= 4.5, `${width} ${dark} ${theme}`)
      assert.ok((await contrast(page, '.today-link')).ratio >= 4.5, `today link ${width} ${dark} ${theme}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    assert.equal(await page.getByRole('button', { name: '调整2026-10-26晚餐' }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: '应用到日历' }).isDisabled(), true)
    assert.equal(await page.getByText('草稿尚未写入日历，不会计入生成结果。').count(), 0, 'partial writes must not be described as entirely unapplied')
    await page.getByRole('button', { name: '已核对，继续' }).click()
    assert.equal(await page.getByRole('button', { name: '应用到日历' }).isDisabled(), true, 'reviewing alone must not make an old draft safe to apply')
    await page.getByRole('button', { name: '基于最新日历继续草稿' }).click()
    const rebase = page.getByRole('dialog', { name: '基于最新日历继续草稿？' })
    await rebase.getByText('先前请求仍可能稍后完成', { exact: false }).waitFor()
    await rebase.getByRole('button', { name: '保持只读' }).click()
    assert.equal(await page.getByRole('button', { name: '应用到日历' }).isDisabled(), true)
    await page.getByRole('button', { name: '基于最新日历继续草稿' }).click()
    await rebase.getByRole('button', { name: '继续核对草稿' }).click()
    await page.getByText('草稿已保留，请逐餐核对后再决定是否应用').waitFor()
    assert.equal(await page.getByRole('button', { name: '应用到日历' }).isEnabled(), true)
    assert.equal(applyCalls, 2, 'reviewing a retained draft must not write to the calendar')
    await page.locator('.draft-card').getByText('麻婆豆腐', { exact: true }).waitFor()
    await page.getByText('先前应用可能已写入部分日期', { exact: false }).waitFor()
    applyMode = 'success'
    await page.getByRole('button', { name: '应用到日历' }).click()
    await page.getByRole('button', { name: '确认替换' }).click()
    await page.getByText('已应用到日历').waitFor()
    assert.equal(await page.getByText('草稿尚未写入日历，不会计入生成结果。').count(), 0)
    await page.getByText('购物清单不会随排餐变动自动更新', { exact: false }).waitFor()
    assert.equal(applyCalls, 3)
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
    console.log('Weekly workflows passed: draft editing, search, pagination, guards, preview integrity, uncertain writes and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
