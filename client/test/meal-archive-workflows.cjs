const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Meal archive tests require a local test server')
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })
const item = (id, name, archived = false) => ({ _id: id, name, category: '家常菜', archived, supportsConditionalArchive: true, archiveVersion: version('v1'), ingredients: [], steps: [], tags: [] })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test', householdId: 'home' })) })
    let meals = [item('meal-a', '测试面条'), ...Array.from({ length: 30 }, (_, i) => item(`arch-${i}`, `历史菜${String(i + 1).padStart(2, '0')}`, true))]
    let supported = false; let archiveMode = 'conflict'; const writes = []; const reads = []; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, ''); let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/meals/archive-capabilities') data = { supportsMealArchive: supported }
      else if (req.method() === 'GET' && path === '/meals/categories') data = [{ category: '家常菜' }]
      else if (req.method() === 'GET' && (path === '/meals/tags' || path === '/wishlist')) data = []
      else if (req.method() === 'GET' && path === '/meals') {
        reads.push(Object.fromEntries(url.searchParams)); const archived = url.searchParams.get('archived') === 'true'; const query = url.searchParams.get('search') || ''
        const filtered = meals.filter(meal => meal.archived === archived && meal.name.includes(query)).map(meal => supported ? meal : { ...meal, supportsConditionalArchive: false })
        const number = Number(url.searchParams.get('page') || 1); const limit = Number(url.searchParams.get('limit') || 8)
        data = { data: filtered.slice((number - 1) * limit, number * limit), total: filtered.length, page: number, limit }
      } else if (req.method() === 'GET' && path.startsWith('/meals/')) {
        data = meals.find(meal => path.endsWith(meal._id))
        if (!data) return route.fulfill({ status: 404, json: { code: 'MEAL_NOT_FOUND', error: '未找到指定菜品' } })
      }
      else if (req.method() === 'PUT' && path === '/meals/meal-a/archive') {
        const body = req.postDataJSON(); writes.push(body); const current = meals.find(meal => meal._id === 'meal-a')
        assert.deepEqual(body.expectedEditVersion, current.archiveVersion)
        if (archiveMode === 'conflict') { current.archiveVersion = version('v2'); return route.fulfill({ status: 409, json: { code: 'MEAL_ARCHIVE_CONFLICT', error: '已变化' } }) }
        if (archiveMode === 'missing') { meals = meals.filter(meal => meal._id !== 'meal-a'); return route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
        current.archived = body.archived; current.archiveVersion = version(body.archived ? 'v3' : 'v4')
        if (archiveMode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        data = current
      } else if (req.method() === 'DELETE') throw new Error('The archive flow must never issue a destructive delete')
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/meals`)
    await page.getByText('测试面条', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: '移入回收站：测试面条' }).first().isDisabled(), true)
    await page.getByRole('button', { name: '菜品回收站' }).click()
    const dialog = page.getByRole('dialog', { name: '菜品回收站' })
    await dialog.getByText('服务器未提供安全回收站能力', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '关闭', exact: true }).click()
    supported = true
    await page.reload()
    await page.getByRole('button', { name: '移入回收站：测试面条' }).first().click()
    await page.getByRole('button', { name: '确认移入' }).click()
    await page.getByText('已变化，本次操作未执行', { exact: false }).waitFor()
    await page.getByRole('button', { name: '读取最新状态' }).click()
    await page.getByText('当前状态：仍在菜谱中', { exact: false }).waitFor()
    await page.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    archiveMode = 'unknown'
    await page.getByRole('button', { name: '移入回收站：测试面条' }).first().click()
    await page.getByRole('button', { name: '确认移入' }).click()
    await page.getByText('操作结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '读取最新状态' }).click()
    await page.getByText('当前状态：已在回收站', { exact: false }).waitFor()
    await page.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    await page.getByText('测试面条', { exact: true }).waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '菜品回收站' }).click()
    await dialog.getByRole('button', { name: '下一页' }).waitFor()
    assert.equal(await dialog.locator('.archive-row').count(), 24)
    if (process.env.EATWHAT_ARCHIVE_DIALOG_SHOT) await page.screenshot({ path: process.env.EATWHAT_ARCHIVE_DIALOG_SHOT })
    await dialog.getByRole('button', { name: '下一页' }).click()
    await dialog.getByText('第 2 / 2 页').waitFor()
    await dialog.getByRole('textbox', { name: '搜索回收站菜品' }).fill('测试面条')
    await dialog.getByRole('button', { name: '恢复测试面条' }).waitFor()
    archiveMode = 'success'
    await dialog.getByRole('button', { name: '恢复测试面条' }).click()
    await dialog.getByText('回收站里没有符合条件的菜品').waitFor()
    await dialog.getByRole('button', { name: '清除搜索' }).click()
    const archiveSearch = dialog.getByRole('textbox', { name: '搜索回收站菜品' })
    assert.equal(await archiveSearch.inputValue(), '')
    assert.equal(await archiveSearch.evaluate(node => document.activeElement === node), true)
    await dialog.getByRole('button', { name: '恢复历史菜01' }).waitFor()
    const savedMeals = meals
    meals = meals.filter(meal => !meal.archived)
    await archiveSearch.fill('不存在的菜')
    await dialog.getByText('回收站里没有符合条件的菜品').waitFor()
    await dialog.getByRole('button', { name: '清除搜索' }).click()
    await dialog.getByText('回收站里还没有菜品').waitFor()
    assert.equal(await dialog.getByRole('button', { name: '清除搜索' }).count(), 0)
    meals = savedMeals
    await dialog.getByRole('button', { name: '关闭', exact: true }).click()
    await page.getByText('测试面条', { exact: true }).waitFor()
    archiveMode = 'missing'
    await page.getByRole('button', { name: '移入回收站：测试面条' }).first().click()
    await page.getByRole('button', { name: '确认移入' }).click()
    await page.getByText('操作结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '读取最新状态' }).click()
    await page.getByText('未找到菜品，可能已被删除或不属于当前家庭', { exact: false }).waitFor()
    await page.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    await page.getByText('测试面条', { exact: true }).waitFor({ state: 'hidden' })
    assert.deepEqual(writes.map(body => body.archived), [true, true, false, true])
    assert.ok(reads.some(read => read.archived === 'true' && read.limit === '24'))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_ARCHIVE_SHOT) await page.screenshot({ path: process.env.EATWHAT_ARCHIVE_SHOT })
    assert.deepEqual(errors, [])
    console.log('Meal archive workflows passed: legacy guard, conflicts, missing items, recovery, pagination and restore')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
