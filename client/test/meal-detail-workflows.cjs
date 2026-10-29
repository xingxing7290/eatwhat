const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Meal detail tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test', householdId: 'home-a' })) })
    const errors = []; let releaseMemories; let slowMemories = true; let failReports = true; let reportMode = 'unknown'; let reportWrites = 0; let malformed = false; let scheduleWrites = 0
    const meal = { _id: 'meal-a', name: '测试菜', imageUrl: 'http://127.0.0.1/uploads/old.jpg', ingredients: ['鸡蛋', { name: '番茄', amount: '2个' }], steps: [{ description: '切好', imageUrl: '/broken-step.png' }, '炒熟'], photos: [image, '/broken-wall.png'], tags: [], healthTags: [] }
    const memory = { _id: 'memory-a', date: '2026-10-28', mealType: 'dinner', title: '好吃的一餐', note: '很满足', mood: '开心', photos: [], mealIds: [meal], supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: { revision: 'v1', updatedAt: '2026-10-28T12:00:00.000Z' } }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/broken-*.png', route => route.fulfill({ status: 404, body: '' }))
    await page.route('**/uploads/old.jpg', route => route.fulfill({ status: 404, body: '' }))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, ''); let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/meals/meal-a') data = malformed ? { _id: 'other', name: '错误菜品' } : meal
      else if (req.method() === 'GET' && path === '/meals/meal-b') data = { _id: 'meal-b', name: '第二道菜' }
      else if (path.startsWith('/schedules/day/')) data = { date: path.split('/').pop(), scheduleExists: true, scheduleVersion: '2026-10-28T08:00:00.000Z', meals: { breakfast: [], lunch: [{ meal: { _id: 'meal-b', name: '第二道菜' } }], dinner: [] } }
      else if (path.startsWith('/schedules') && req.method() !== 'GET') { scheduleWrites++; data = {} }
      else if (path === '/meals') data = { data: [meal], page: 1, limit: 8, total: 1 }
      else if (path === '/meals/categories' || path === '/meals/tags' || path === '/wishlist') data = []
      else if (req.method() === 'GET' && path === '/memories') { if (slowMemories) await new Promise(resolve => { releaseMemories = resolve }); data = [memory] }
      else if (req.method() === 'GET' && path === '/memories/memory-a') data = memory
      else if (req.method() === 'POST' && path === '/meal-image-issues') {
        reportWrites++
        if (reportMode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        data = { _id: 'issue-a', mealId: { _id: 'meal-a' }, issueType: 'wrong_image' }
      } else if (req.method() === 'GET' && path === '/meal-image-issues') {
        if (failReports) return route.fulfill({ status: 503, json: { error: '反馈读取失败' } })
        data = [{ _id: 'issue-a', mealId: { _id: 'meal-a' }, issueType: 'wrong_image' }]
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/meals/detail/meal-a`)
    await page.getByRole('heading', { name: '测试菜' }).waitFor()
    assert.equal(await page.getByText('进入详情不会自动提交反馈', { exact: false }).count(), 0)
    await page.getByText('正在加载相关回忆…', { exact: true }).waitFor()
    assert.equal(await page.getByText('还没有相关回忆').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.locator('.hero img[alt="图片暂不可用"]').waitFor()
    await page.getByText('鸡蛋', { exact: true }).waitFor()
    await page.getByText('炒熟', { exact: true }).waitFor()
    await page.getByRole('button', { name: '查看第 1 张菜品照片' }).click()
    const viewer = page.getByRole('dialog', { name: '菜品照片' })
    await viewer.getByText('1 / 2').waitFor()
    await page.keyboard.press('ArrowRight')
    await viewer.getByText('2 / 2').waitFor()
    await viewer.locator('img[alt="图片暂不可用"]').waitFor()
    await page.keyboard.press('Escape'); await viewer.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '查看第 2 张菜品照片')
    await page.getByRole('button', { name: '查看第 1 步照片' }).click()
    await viewer.getByText('1 / 1').waitFor()
    await viewer.locator('img[alt="图片暂不可用"]').waitFor()
    await page.keyboard.press('Escape'); await viewer.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '查看第 1 步照片')
    await page.getByRole('button', { name: '查看测试菜封面照片' }).click()
    await viewer.getByText('1 / 1').waitFor()
    await page.keyboard.press('Escape'); await viewer.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '查看测试菜封面照片')
    releaseMemories(); slowMemories = false
    await page.getByText('好吃的一餐').waitFor()
    if (process.env.EATWHAT_MEAL_DETAIL_SHOT) await page.screenshot({ path: process.env.EATWHAT_MEAL_DETAIL_SHOT })
    await page.getByRole('button', { name: '图片不对' }).click()
    await page.getByText('图片反馈提交结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '图片不对' }).isDisabled(), true)
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/meals/detail/meal-b') })
    await page.getByText('图片反馈结果尚未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '继续核对', exact: true }).click()
    assert.match(page.url(), /meal-a$/)
    await page.getByRole('button', { name: '核对待修正反馈' }).click()
    await page.locator('.meal-detail').getByText('反馈读取失败', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '已核对，允许重试' }).count(), 0)
    failReports = false
    await page.getByRole('button', { name: '核对待修正反馈' }).click()
    await page.getByText('当前列表有 1 条', { exact: false }).waitFor()
    await page.getByRole('button', { name: '已核对，允许重试' }).click()
    await page.getByRole('button', { name: '已核对，允许重试', exact: true }).last().click()
    reportMode = 'success'
    await page.getByRole('button', { name: '图片不对' }).click()
    await page.getByRole('button', { name: '已反馈' }).waitFor()
    assert.equal(reportWrites, 2)
    assert.equal(await page.getByRole('button', { name: '已反馈' }).isDisabled(), true)
    await page.getByRole('link', { name: '查看并编辑回忆' }).click()
    const editor = page.getByRole('dialog', { name: '编辑饭后回忆' })
    assert.equal(await editor.getByPlaceholder('比如：周五晚上的番茄牛腩').inputValue(), '好吃的一餐')
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    malformed = true
    await page.goto(`${base}/meals/detail/meal-a`)
    await page.getByText('无法加载菜品：菜品数据不完整', { exact: false }).waitFor()
    assert.equal(await page.getByRole('heading', { name: '错误菜品' }).count(), 0)
    malformed = false
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await page.getByRole('heading', { name: '测试菜' }).waitFor()
    meal.archived = true
    await page.reload()
    await page.getByRole('heading', { name: '测试菜' }).waitFor()
    assert.equal(await page.getByRole('button', { name: '安排到日历' }).isDisabled(), true)
    meal.archived = false
    await page.goto(`${base}/meals/detail/meal-a?calendarDate=2026-12-31`)
    await page.getByRole('heading', { name: '测试菜' }).waitFor()
    await page.getByRole('button', { name: '安排到日历' }).click()
    const scheduleDialog = page.getByRole('dialog', { name: '安排这道菜' })
    assert.equal(await scheduleDialog.getByLabel('日期').inputValue(), '2026-12-31')
    await page.setViewportSize({ width: 320, height: 844 })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.schedule-help', '.schedule-fields', '#recipe-schedule-date']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await scheduleDialog.getByLabel('日期').fill('')
    assert.equal(await scheduleDialog.getByRole('button', { name: '下一步：核对安排' }).isDisabled(), true)
    await scheduleDialog.getByLabel('日期').fill('2026-12-31')
    await scheduleDialog.getByLabel('午餐').check()
    await scheduleDialog.getByRole('button', { name: '下一步：核对安排' }).click()
    await page.waitForURL('**/selection?date=2026-12-31&mealType=lunch&suggestedMealId=meal-a&fromRecipe=1&calendarDate=2026-12-31')
    await page.getByRole('button', { name: '移除测试菜' }).waitFor()
    await page.getByRole('button', { name: '移除第二道菜' }).waitFor()
    assert.equal(scheduleWrites, 0, 'reviewing the suggested meal must not write a schedule')
    await page.getByRole('button', { name: '取消', exact: true }).click()
    const leave = page.getByRole('dialog', { name: '放弃未保存的内容？' })
    await leave.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByRole('button', { name: '移除测试菜' }).isVisible(), true)
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await leave.getByRole('button', { name: '放弃并离开' }).click()
    await page.waitForURL('**/meals/detail/meal-a?calendarDate=2026-12-31')
    await page.getByRole('button', { name: '返回日历' }).waitFor()
    assert.equal(scheduleWrites, 0)
    for (const query of ['fromDashboard=1', 'q=tomato&category=home', 'reviewMonth=2026-10', 'reviewYear=2026']) {
      await page.goto(`${base}/meals/detail/meal-a?${query}`)
      await page.getByRole('button', { name: '安排到日历' }).click()
      await scheduleDialog.getByLabel('日期').fill('2026-12-31')
      await scheduleDialog.getByLabel('午餐').check()
      await scheduleDialog.getByRole('button', { name: '下一步：核对安排' }).click()
      await page.getByRole('button', { name: '移除测试菜' }).waitFor()
      await page.getByRole('button', { name: '取消', exact: true }).click()
      await leave.getByRole('button', { name: '放弃并离开' }).click()
      await page.waitForURL(`**/meals/detail/meal-a?${query}`)
    }
    for (const query of ['reviewMonth=2026-13', 'reviewYear=2101', 'reviewMonth=2026-10&reviewYear=2026']) {
      await page.goto(`${base}/meals/detail/meal-a?${query}`)
      await page.getByRole('button', { name: '返回', exact: true }).waitFor()
      assert.equal(await page.getByRole('button', { name: '返回饭桌回顾' }).count(), 0)
    }
    assert.deepEqual(errors, [])
    console.log('Meal detail workflows passed: scheduling review, independent reads, previews, uncertain feedback and memory navigation')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
