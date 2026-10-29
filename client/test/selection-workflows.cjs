const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')

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
    await page.clock.setFixedTime(new Date(2026, 8, 28, 12))
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户', householdId: 'home-a' }))
    })
    let selected = [meals[18]]
    let version = '2026-10-29T08:00:00.000Z'
    let failCategories = true
    let malformedTags = true
    let legacy = false
    let malformedSchedule = false
    let saveMode = 'uncertain'
    let releaseSlow
    let holdPage = false; let releasePage
    let wishMode = 'done'
    let suggestionFailure = false
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
      } else if (method === 'GET' && pathname === '/meals/tags') data = malformedTags ? { tags: ['清淡'] } : ['清淡']
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
          if (holdPage && current === 3) await new Promise(resolve => { releasePage = resolve })
          if (query === '坏页') data = { data: [meals[0]], total: 1, page: 2, limit }
          else if (query === '重复') data = { data: [meals[0], meals[0]], total: 2, page: 1, limit }
          else if (query === '缺项') data = { data: [meals[0]], total: 2, page: 1, limit }
          else if (query === '无分页') data = { data: [meals[0]], total: 23 }
          else data = { data: filtered.slice((current - 1) * limit, current * limit), total: filtered.length, page: current, limit }
        }
      } else if (method === 'GET' && pathname.startsWith('/meals/')) {
        if (suggestionFailure === 'unavailable' && pathname === '/meals/meal-20') return route.fulfill({ status: 503, json: { error: '菜品暂不可用' } })
        data = meals.find(meal => pathname.endsWith(meal._id)) || {}
        if (suggestionFailure === 'archived' && pathname === '/meals/meal-20') data = { ...data, archived: true }
      }
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

    selected = [meals[18], meals[19]]
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.getByText('与当前安排一致', { exact: true }).waitFor()
    await page.getByRole('button', { name: '移除测试菜19' }).click()
    await page.getByRole('textbox', { name: '搜索可选菜品' }).fill('测试菜19')
    await page.getByRole('button', { name: '选择测试菜19' }).click()
    await page.getByText('选择有变更，尚未保存').waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    const orderWarning = page.getByRole('dialog', { name: '放弃未保存的内容？' })
    await orderWarning.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(new URL(page.url()).pathname, '/selection', 'reordering must be protected as an unsaved change')
    saveMode = 'success'
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.waitForURL('**/calendar?*')
    assert.deepEqual(writes[0].mealIds, ['meal-20', 'meal-19'], 'saving must preserve the reviewed order')
    writes.length = 0; version = '2026-10-29T08:00:00.000Z'; saveMode = 'uncertain'
    selected = [meals[18]]
    suggestionFailure = 'unavailable'
    await page.goto(`${base}/selection?date=${date}&mealType=dinner&suggestedMealId=meal-20&wishlistId=wish-a`)
    await page.getByText('推荐菜品无法读取或已移入回收站', { exact: false }).waitFor()
    await page.getByRole('button', { name: '移除测试菜19' }).waitFor()
    assert.equal(await page.getByRole('button', { name: '移除测试菜20' }).count(), 0)
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), false)
    assert.equal(writes.length, 0, 'a failed recommendation must not change the existing schedule')
    assert.equal(wishWrites.length, 0, 'a failed recommendation must not change the wishlist')
    saveMode = 'success'
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.waitForURL('**/calendar?*')
    assert.deepEqual(writes[0].mealIds, ['meal-19'], 'saving keeps the original meal when the suggestion failed')
    assert.equal(wishWrites.length, 0, 'saving without the suggested meal must not mark the wish planned')
    writes.length = 0
    saveMode = 'uncertain'
    suggestionFailure = 'archived'
    await page.goto(`${base}/selection?date=${date}&mealType=dinner&suggestedMealId=meal-20&wishlistId=wish-a`)
    await page.getByText('推荐菜品无法读取或已移入回收站', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '移除测试菜20' }).count(), 0)
    suggestionFailure = false
    await page.goto(`${base}/selection?date=${date}&mealType=dinner&suggestedMealId=meal-20`)
    await page.getByRole('button', { name: '移除测试菜19' }).waitFor()
    await page.getByRole('button', { name: '移除测试菜20' }).waitFor()
    await page.getByText('选择有变更，尚未保存').waitFor()
    await page.getByText('切换分类、搜索或翻页不会清除已选菜品', { exact: false }).waitFor()
    for (const button of await page.locator('.selected-meal-tag').all()) assert.ok((await button.boundingBox()).height >= 44)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.selection-status', '.selection-hint', '.selected-meal-tag']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
      }
    }
    await page.getByRole('button', { name: '移除测试菜20' }).click()
    await page.getByText('选择有变更，尚未保存').waitFor({ state: 'hidden' })
    await page.getByText('与当前安排一致', { exact: true }).waitFor()
    await page.getByRole('button', { name: '移除测试菜19' }).click()
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '搜索可选菜品')
    await page.getByRole('textbox', { name: '搜索可选菜品' }).fill('测试菜19')
    await page.getByRole('button', { name: '选择测试菜19' }).click()
    await page.getByRole('textbox', { name: '搜索可选菜品' }).fill('测试菜20')
    await page.getByRole('button', { name: '选择测试菜20' }).click()
    await page.getByRole('textbox', { name: '搜索可选菜品' }).fill('')
    await page.getByRole('button', { name: '移除测试菜20' }).waitFor()
    await page.getByText('分类或标签可能不完整').waitFor()
    failCategories = false
    const malformedTagResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/meals/tags')
    await page.getByRole('button', { name: '重试', exact: true }).click()
    await malformedTagResponse
    await page.getByText('分类或标签可能不完整').waitFor()
    malformedTags = false
    await page.getByRole('button', { name: '重试', exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.getByText('分类或标签可能不完整').waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '搜索可选菜品')
    await page.waitForFunction(() => document.querySelectorAll('.meals-grid .meal-card-wrapper').length === 8)
    assert.equal(await page.locator('.meals-grid .meal-card-wrapper').count(), 8)
    const catalogSearch = page.getByRole('textbox', { name: '搜索可选菜品' })
    for (const fault of ['坏页', '重复', '缺项', '无分页']) {
      await catalogSearch.fill(fault)
      await page.getByText('无法加载菜品', { exact: false }).waitFor()
      assert.equal(await page.locator('.meals-grid .meal-card-wrapper').count(), 0, `${fault} must not display unreliable choices`)
      assert.equal(await page.getByRole('button', { name: '移除测试菜19' }).count(), 1)
      assert.equal(await page.getByRole('button', { name: '移除测试菜20' }).count(), 1)
    }
    await catalogSearch.fill('')
    await page.waitForFunction(() => document.querySelectorAll('.meals-grid .meal-card-wrapper').length === 8)
    const filterToggle = page.getByRole('button', { name: '筛选', exact: true })
    await filterToggle.click()
    assert.equal(await filterToggle.getAttribute('aria-expanded'), 'true')
    for (const label of ['分类', '子类', '标签']) assert.equal(await page.getByRole('combobox', { name: label, exact: true }).count(), 1)
    await page.getByRole('combobox', { name: '标签', exact: true }).focus()
    await page.getByRole('combobox', { name: '标签', exact: true }).press('Enter')
    await page.getByRole('option', { name: '清淡', exact: true }).click()
    await page.getByRole('complementary', { name: '菜品分类' }).getByRole('button', { name: '肉类' }).click()
    await page.getByRole('textbox', { name: '搜索可选菜品' }).fill('测试菜')
    const chips = page.getByRole('group', { name: '当前筛选条件' })
    await chips.getByRole('button', { name: '移除标签：清淡筛选' }).waitFor()
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.active-filter-chip', '.active-filters-label', '.filter-field-label']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await filterToggle.click()
    assert.equal(await filterToggle.getAttribute('aria-expanded'), 'false')
    assert.equal(await chips.getByRole('button').count(), 3)
    assert.equal(await page.getByRole('button', { name: '移除测试菜19' }).count(), 1)
    assert.equal(await page.getByRole('button', { name: '移除测试菜20' }).count(), 1)
    for (const selector of ['.active-filter-chip', '.active-filters-label']) {
      const result = await contrast(page, selector)
      assert.ok(result.ratio >= 4.5, `${selector}: ${result.ratio}`)
    }
    await chips.getByRole('button', { name: '移除分类：肉类筛选' }).click()
    await chips.getByRole('button', { name: '移除搜索：测试菜筛选' }).click()
    await chips.getByRole('button', { name: '移除标签：清淡筛选' }).click()
    assert.equal(await filterToggle.evaluate(node => document.activeElement === node), true)
    await page.waitForFunction(() => document.querySelectorAll('.meals-grid .meal-card-wrapper').length === 8)
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

    const firstCard = page.getByRole('button', { name: '选择测试菜01' })
    assert.equal(await firstCard.getAttribute('aria-pressed'), 'false')
    assert.equal(await firstCard.locator('.selection-indicator').innerText(), '＋ 选择')
    await firstCard.focus(); await page.keyboard.press('Space')
    assert.equal(await firstCard.getAttribute('aria-pressed'), 'true')
    assert.equal(await firstCard.locator('.selection-indicator').innerText(), '✓ 已选')
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.selection-indicator.is-selected', '.meal-card-wrapper:not(.selected) .selection-indicator']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.getByRole('button', { name: '移除测试菜01' }).click()
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '移除测试菜20')
    await page.getByRole('button', { name: '选择测试菜01' }).click()
    await page.getByRole('button', { name: '下一页', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByRole('button', { name: '选择测试菜09' }).waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '可选菜品')
    holdPage = true; releasePage = null
    await page.getByRole('button', { name: '下一页', exact: true }).focus(); await page.keyboard.press('Enter')
    for (let i = 0; i < 100 && !releasePage; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof releasePage, 'function')
    await catalogSearch.focus(); holdPage = false; releasePage()
    await page.getByRole('button', { name: '选择测试菜17' }).waitFor()
    assert.equal(await catalogSearch.evaluate(node => document.activeElement === node), true, 'late page results must not steal focus')
    await page.getByRole('button', { name: '上一页', exact: true }).click()
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
    await page.getByText('保存结果待核对', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    assert.deepEqual(writes[0].mealIds, ['meal-19', 'meal-20', 'meal-01', 'meal-09', 'meal-03'])
    await page.getByRole('button', { name: '重新加载最新安排' }).click()
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await page.getByText('保存结果未确认，请先核对最新安排').waitFor({ state: 'hidden' })
    await page.getByText('与当前安排一致', { exact: true }).waitFor()
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
    await page.waitForURL(`**/calendar?date=${date}`)
    await page.getByText(`已定位到 ${date}`, { exact: false }).waitFor()
    assert.equal(writes.length, 3)

    malformedSchedule = true
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.getByText('无法读取完整的现有安排').waitFor()
    await page.getByText('当前安排尚未核实', { exact: true }).waitFor()
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
      await page.waitForURL(`**/calendar?date=${date}`)
    }
    assert.equal(wishWrites.length, 1, 'only a matching open wish on a compatible server may be marked planned')
    assert.deepEqual(wishWrites[0].expectedEditVersion, { revision: 'wish-v1', updatedAt: '2026-10-29T08:00:00.000Z' })
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled))
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.waitForURL(`**/calendar?date=${date}`)
    await page.getByText(`已定位到 ${date}`, { exact: false }).waitFor()
    assert.equal(await page.locator('.mobile-date-card.target-date .date-number').textContent(), '29')
    await page.goto(`${base}/selection?date=2026-02-30&mealType=dinner`)
    await page.waitForURL('**/calendar')
    assert.equal(writes.length, 7, 'invalid dates must not trigger schedule writes')
    await page.goto(`${base}/selection?date=${date}&mealType=dinner`)
    await page.waitForFunction(() => document.querySelectorAll('.selected-meal-tag').length > 0 && [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled))
    while (await page.locator('.selected-meal-tag').count()) await page.locator('.selected-meal-tag').first().click()
    const beforeClear = writes.length
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.getByText(`这会清空 ${date} 晚餐原有的`, { exact: false }).waitFor()
    await page.getByText('等待确认清空安排').waitFor()
    assert.equal(writes.length, beforeClear, 'empty selection must not write before confirmation')
    await page.getByRole('button', { name: '继续选择' }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled))
    assert.equal(writes.length, beforeClear, 'cancelling must leave the server unchanged')
    await page.getByRole('button', { name: '保存安排' }).click()
    await page.getByRole('button', { name: '确认清空' }).click()
    await page.waitForURL(`**/calendar?date=${date}`)
    assert.equal(writes.length, beforeClear + 1)
    assert.deepEqual(writes.at(-1).mealIds, [])
    assert.deepEqual(errors, [])
    console.log('Selection workflows passed: pagination, race, drafts, uncertain saves, malformed data and legacy filtering')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
