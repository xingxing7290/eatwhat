const assert = require('node:assert/strict')
const { chromium } = require('playwright')

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Selection tests require a local test server')
const date = '2026-10-29'
const meals = Array.from({ length: 23 }, (_, index) => ({
  _id: `meal-${String(index + 1).padStart(2, '0')}`,
  name: `测试菜${String(index + 1).padStart(2, '0')}`,
  category: index % 2 ? '蔬菜' : '肉类', tags: [], ingredients: [], steps: []
}))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户', householdId: 'home-a' }))
    })
    let selected = [meals[18]]
    let version = '2026-10-29T08:00:00.000Z'
    let failCategories = true
    let legacy = false
    let malformedSchedule = false
    let saveMode = 'uncertain'
    let releaseSlow
    let wishMode = 'done'
    const wishWrites = []
    const reads = []
    const writes = []
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request()
      const url = new URL(req.url())
      const pathname = url.pathname.replace(/^\/api/, '')
      const method = req.method()
      let data = {}
      if (method === 'GET' && pathname === '/meals/categories') {
        if (failCategories) return route.fulfill({ status: 503, json: { error: '分类暂不可用' } })
        data = [{ category: '肉类' }, { category: '蔬菜' }]
      } else if (method === 'GET' && pathname === '/meals/tags') data = []
      else if (method === 'GET' && pathname === '/meals') {
        reads.push(url.searchParams.toString())
        if (legacy) data = meals
        else {
          const query = url.searchParams.get('search') || ''
          if (query === 'slow') await new Promise(resolve => { releaseSlow = resolve })
          const filtered = query === 'slow' ? [meals[0]] : query === 'fast' ? [meals[2]] : meals.filter(meal =>
            (!query || meal.name.includes(query)) && (!url.searchParams.get('category') || meal.category === url.searchParams.get('category')))
          const current = Number(url.searchParams.get('page') || 1)
          const limit = Number(url.searchParams.get('limit') || 8)
          data = { data: filtered.slice((current - 1) * limit, current * limit), total: filtered.length, page: current, limit }
        }
      } else if (method === 'GET' && pathname.startsWith('/meals/')) data = meals.find(meal => pathname.endsWith(meal._id)) || {}
      else if (method === 'GET' && pathname === '/wishlist/wish-a') data = { _id: 'wish-a', status: wishMode === 'done' ? 'done' : 'open', mealId: { _id: wishMode === 'mismatch' ? 'meal-01' : 'meal-20' }, supportsConditionalActions: wishMode !== 'old', editVersion: { revision: 'wish-v1', updatedAt: '2026-10-29T08:00:00.000Z' } }
      else if (method === 'PATCH' && pathname === '/wishlist/wish-a/status') { wishWrites.push(req.postDataJSON()); data = { _id: 'wish-a', status: 'planned', supportsConditionalActions: true, editVersion: { revision: 'wish-v2', updatedAt: '2026-10-29T09:00:00.000Z' } } }
      else if (method === 'GET' && pathname === `/schedules/day/${date}`) data = {
        date: malformedSchedule === 'date' ? '2026-10-28' : date, scheduleExists: true, scheduleVersion: version,
        meals: malformedSchedule === true ? {} : { breakfast: [], lunch: [], dinner: selected.map(meal => ({ meal })) }
      }
      else if (method === 'PUT' && pathname === `/schedules/${date}/dinner`) {
        const body = req.postDataJSON()
        writes.push(body)
        assert.equal(body.expectedVersion, version)
        selected = body.mealIds.map(id => meals.find(meal => meal._id === id))
        version = '2026-10-29T09:00:00.000Z'
        if (saveMode === 'uncertain') return route.fulfill({ status: 503, json: { error: '保存响应丢失' } })
        data = { date, updatedAt: version, meals: { breakfast: [], lunch: [], dinner: (saveMode === 'mismatch' ? selected.slice(1) : selected).map(meal => ({ meal })) } }
      } else if (method === 'GET' && pathname === '/schedules') data = []
      else if (method === 'GET' && pathname === '/auth/me') data = { user: { id: 'user-a', username: 'test' }, household: { id: 'home-a', name: '测试家庭', members: [] } }
      await route.fulfill({ status: 200, json: data })
    })

    await page.goto(`${base}/selection?date=${date}&mealType=dinner&suggestedMealId=meal-20`)
    await page.getByRole('button', { name: '移除测试菜19' }).waitFor()
    await page.getByRole('button', { name: '移除测试菜20' }).waitFor()
    await page.getByText('分类或标签可能不完整').waitFor()
    failCategories = false
    await page.getByRole('button', { name: '重试', exact: true }).click()
    await page.getByText('分类或标签可能不完整').waitFor({ state: 'hidden' })
    assert.equal(await page.locator('.meals-grid .meal-card-wrapper').count(), 8)
    assert.ok(reads.every(read => new URLSearchParams(read).get('limit') === '8' && new URLSearchParams(read).has('page')))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_SELECTION_MOBILE_SHOT) await page.screenshot({ path: process.env.EATWHAT_SELECTION_MOBILE_SHOT, fullPage: true })
    if (process.env.EATWHAT_SELECTION_DESKTOP_SHOT) {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.screenshot({ path: process.env.EATWHAT_SELECTION_DESKTOP_SHOT, fullPage: true })
      await page.setViewportSize({ width: 390, height: 844 })
    }
    await page.getByRole('radio', { name: '分组视图' }).focus()
    await page.keyboard.press('Space')
    await page.getByText('按当前页分组', { exact: false }).waitFor()
    await page.getByRole('radio', { name: '网格视图' }).focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: '选择测试菜01' }).waitFor()

    await page.getByRole('button', { name: '选择测试菜01' }).click()
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await page.getByRole('button', { name: '选择测试菜09' }).waitFor()
    await page.getByRole('button', { name: '选择测试菜09' }).click()
    await page.getByRole('button', { name: '移除测试菜01' }).waitFor()
    await page.getByRole('button', { name: '移除测试菜09' }).waitFor()
    const search = page.getByRole('textbox', { name: '搜索可选菜品' })
    await search.fill('slow')
    await page.waitForFunction(() => document.querySelector('input[aria-label="搜索可选菜品"]')?.value === 'slow')
    await page.waitForTimeout(250)
    assert.equal(typeof releaseSlow, 'function')
    await search.fill('fast')
    await page.getByRole('button', { name: '选择测试菜03' }).waitFor()
    releaseSlow()
    await page.waitForTimeout(250)
    assert.equal(await page.getByRole('button', { name: '选择测试菜03' }).count(), 1)
    assert.equal(await page.getByRole('button', { name: '选择测试菜01' }).count(), 0)
    await page.getByRole('button', { name: '选择测试菜03' }).click()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(writes.length, 0)
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.getByText('保存结果未确认，请先核对最新安排').waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    assert.deepEqual(writes[0].mealIds, ['meal-19', 'meal-20', 'meal-01', 'meal-09', 'meal-03'])
    await page.getByRole('button', { name: '重新加载最新安排' }).click()
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await page.getByText('保存结果未确认，请先核对最新安排').waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '移除测试菜03' }).waitFor()

    saveMode = 'mismatch'
    await page.getByRole('button', { name: '移除测试菜03' }).click()
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.getByText('保存结果未确认，请先核对最新安排').waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载最新安排' }).click()
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await page.getByText('保存结果未确认，请先核对最新安排').waitFor({ state: 'hidden' })
    saveMode = 'success'
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.waitForURL('**/calendar')
    assert.equal(writes.length, 3)

    malformedSchedule = true
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.getByText('无法读取完整的现有安排').waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    assert.equal(writes.length, 3)
    malformedSchedule = 'date'
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.getByText('无法读取完整的现有安排').waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    malformedSchedule = false
    legacy = true
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.getByRole('button', { name: '选择测试菜01' }).waitFor()
    assert.equal(await page.locator('.meals-grid .meal-card-wrapper').count(), 8)
    await page.getByRole('complementary', { name: '菜品分类' }).getByRole('button', { name: '蔬菜' }).click()
    await page.getByRole('button', { name: '选择测试菜01' }).waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '选择测试菜02' }).waitFor()
    assert.equal(await page.getByRole('button', { name: '选择测试菜01' }).count(), 0)
    assert.equal(await page.locator('.meals-grid .meal-card-wrapper').count(), 8)
    for (const mode of ['done', 'old', 'mismatch', 'open']) {
      wishMode = mode
      await page.goto(`${base}/selection?date=${date}&mealType=dinner&suggestedMealId=meal-20&wishlistId=wish-a`)
      if (mode === 'done') await page.getByText('这条想吃已完成', { exact: false }).waitFor()
      if (mode === 'old' || mode === 'mismatch') await page.getByText('无法确认想吃记录的最新状态', { exact: false }).waitFor()
      await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled))
      await page.getByRole('button', { name: '保存安排' }).click()
      await page.waitForURL('**/calendar')
    }
    assert.equal(wishWrites.length, 1, 'only a matching open wish on a compatible server may be marked planned')
    assert.deepEqual(wishWrites[0].expectedEditVersion, { revision: 'wish-v1', updatedAt: '2026-10-29T08:00:00.000Z' })
    assert.deepEqual(errors, [])
    console.log('Selection workflows passed: pagination, race, drafts, uncertain saves, malformed data and legacy filtering')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
