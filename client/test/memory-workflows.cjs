const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Memory tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const meals = Array.from({ length: 75 }, (_, i) => ({ _id: `meal-${String(i + 1).padStart(2, '0')}`, name: `菜品${String(i + 1).padStart(2, '0')}` }))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test', householdId: 'home-a' })) })
    const errors = []; const reads = []; let saved = ''; let deleted = false; let deleteMode = 'conflict'; let revision = 'v1'; let deleteSupported = true; let detailFailure = false; let releaseSlow
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/broken-memory.png', route => route.fulfill({ status: 404, body: '' }))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/memories') data = deleted ? [] : [{ _id: 'memory-a', date: '2026-10-28', mealType: 'dinner', title: '回忆一', photos: [image, '/broken-memory.png'], mealIds: [], supportsConditionalEdit: true, supportsConditionalDelete: deleteSupported, editVersion: { revision, updatedAt: '2026-10-28T12:00:00.000Z' } }]
      else if (req.method() === 'GET' && path === '/memories/memory-a') {
        if (detailFailure) return route.fulfill({ status: 503, json: { error: '暂时无法读取' } })
        if (deleted) return route.fulfill({ status: 404, json: { code: 'MEMORY_NOT_FOUND', error: '未找到回忆' } })
        data = { _id: 'memory-a', date: '2026-10-28', title: '回忆一' }
      }
      else if (req.method() === 'POST' && path === '/memories') { saved = req.postData(); data = { _id: 'created' } }
      else if (req.method() === 'DELETE' && path === '/memories/memory-a') {
        assert.equal(JSON.parse(url.searchParams.get('expectedEditVersion')).revision, revision)
        if (deleteMode === 'conflict') { revision = 'v2'; return route.fulfill({ status: 409, json: { code: 'MEMORY_CONFLICT', error: '回忆已变化' } }) }
        deleted = true; return route.fulfill({ status: 503, json: { error: '无法确认' } })
      }
      else if (req.method() === 'GET' && path === '/meals') {
        reads.push(Object.fromEntries(url.searchParams)); const query = url.searchParams.get('search') || ''; const found = meals.filter(meal => meal.name.includes(query))
        if (query === '慢查询') await new Promise(resolve => { releaseSlow = resolve })
        if (query === '坏页') data = { data: [meals[1]], total: 1, page: 2, limit: 50 }
        else if (query === '重复') data = { data: [meals[1], meals[1]], total: 2, page: 1, limit: 50 }
        else if (query === '缺项') data = { data: [meals[1]], total: 2, page: 1, limit: 50 }
        else if (query === '无分页') data = { data: [meals[1]], total: 75 }
        else data = { data: found.slice(0, 50), total: found.length, page: 1, limit: 50 }
      } else if (req.method() === 'GET' && path.startsWith('/meals/')) data = meals.find(meal => `/meals/${meal._id}` === path) || null
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/memories`)
    await page.getByText('回忆一', { exact: true }).waitFor()
    assert.equal(reads.length, 0, 'Timeline should not load the whole meal catalog')
    deleteSupported = false
    await page.reload()
    await page.getByText('服务器未提供安全删除能力', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '删除回忆一' }).isDisabled(), true)
    deleteSupported = true
    await page.reload()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('button', { name: '查看回忆一的第 1 张照片' }).click()
    const viewer = page.getByRole('dialog', { name: '饭后照片' })
    await viewer.getByText('1 / 2').waitFor()
    const browserShortcut = await viewer.locator('.photo-preview').evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true })))
    assert.equal(browserShortcut, true, 'photo viewer must not intercept browser shortcuts')
    await viewer.evaluate(node => { const input = document.createElement('input'); input.id = 'photo-test-input'; node.querySelector('.el-dialog__body').appendChild(input) })
    const editableArrow = await viewer.locator('#photo-test-input').evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    assert.equal(editableArrow, true, 'photo viewer must not intercept editable controls')
    await viewer.locator('#photo-test-input').evaluate(node => node.remove())
    await page.keyboard.press('ArrowRight')
    await viewer.getByText('2 / 2').waitFor()
    await viewer.locator('img[alt="图片暂不可用"]').waitFor()
    await page.keyboard.press('ArrowLeft')
    await viewer.getByText('1 / 2').waitFor()
    await page.keyboard.press('Escape')
    await viewer.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '记录一餐' }).click()
    const dialog = page.getByRole('dialog', { name: '记录饭后回忆' })
    const search = dialog.getByRole('combobox', { name: '搜索相关菜品' })
    await search.click()
    await page.getByText('仅显示前 50 道', { exact: false }).waitFor()
    assert.equal(reads[0].limit, '50')
    await page.getByRole('option', { name: '菜品01', exact: true }).click()
    await search.click()
    await search.fill('慢查询')
    for (let i = 0; i < 100 && !releaseSlow; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof releaseSlow, 'function')
    await search.fill('菜品75')
    await page.getByRole('option', { name: '菜品75', exact: true }).waitFor()
    const slowResponse = page.waitForResponse(response => new URL(response.url()).searchParams.get('search') === '慢查询')
    releaseSlow(); await slowResponse
    await page.getByRole('option', { name: '菜品75', exact: true }).waitFor()
    for (const fault of ['坏页', '重复', '缺项', '无分页']) {
      await search.fill(fault)
      await dialog.getByText('菜品暂时无法加载', { exact: false }).waitFor()
      assert.equal(await page.getByRole('option', { name: '菜品02', exact: true }).count(), 0, `${fault} must not expose stale or invalid choices`)
    }
    await search.fill('菜品75')
    await dialog.getByText('菜品暂时无法加载', { exact: false }).waitFor({ state: 'hidden' })
    try { await page.getByRole('option', { name: '菜品75', exact: true }).click() } catch (error) { console.error('Meal reads:', reads, 'Visible options:', await page.getByRole('option').allTextContents()); throw error }
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.match(saved, /meal-01/); assert.match(saved, /meal-75/)
    await page.getByRole('button', { name: '删除回忆一' }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await page.getByText('回忆已被修改或删除，本次未删除', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '记录一餐' }).isDisabled(), true)
    detailFailure = true
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('暂时无法读取', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '记录一餐' }).isDisabled(), true)
    detailFailure = false
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('服务器当前仍有「回忆一」', { exact: false }).waitFor()
    deleteMode = 'unknown'
    await page.getByRole('button', { name: '删除回忆一' }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await page.getByText('删除结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '记录一餐' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('服务器当前未找到这条回忆', { exact: false }).waitFor()
    await page.getByText('还没有饭后回忆').waitFor()
    const firstMemory = page.getByRole('button', { name: '记录第一餐' })
    assert.ok((await firstMemory.boundingBox()).height >= 44)
    await firstMemory.click()
    await dialog.waitFor()
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    const initialReads = reads.length
    await page.goto(`${base}/memories?new=1&mealId=meal-75&q=测试&mealType=dinner`)
    const deepDialog = page.getByRole('dialog', { name: '记录饭后回忆' })
    const title = deepDialog.getByPlaceholder('比如：周五晚上的番茄牛腩')
    await title.waitFor()
    assert.equal(await title.inputValue(), '做过一次：菜品75')
    await page.waitForFunction(() => { const query = new URL(location.href).searchParams; return !query.has('new') && !query.has('mealId') && query.get('q') === '测试' && query.get('mealType') === 'dinner' })
    assert.equal(reads.length, initialReads, 'Deep link should fetch a single meal, not the catalog')
    assert.deepEqual(errors, [])
    console.log('Memory workflows passed: lazy search, selection, preview, uncertain deletion and deep link')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
