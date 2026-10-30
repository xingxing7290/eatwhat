const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Anniversary tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const meals = Array.from({ length: 75 }, (_, i) => ({ _id: `meal-${String(i + 1).padStart(2, '0')}`, name: `菜品${String(i + 1).padStart(2, '0')}` }))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test', householdId: 'home-a' })) })
    const errors = []; const reads = []; let saved = ''; let deleted = false; let failTemplates = true; let deleteMode = 'conflict'; let revision = 'v1'; let deleteSupported = true; let brokenPhoto = true
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/broken-anniversary.png', route => brokenPhoto ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>' }))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/anniversaries') data = deleted ? [] : [{ _id: 'ann-a', title: '纪念晚餐', date: '2026-10-28', meals: { breakfast: [], lunch: [], dinner: [] }, photos: [image, '/broken-anniversary.png'], supportsConditionalEdit: true, supportsConditionalDelete: deleteSupported, editVersion: { revision, updatedAt: '2026-10-28T12:00:00.000Z' } }]
      else if (req.method() === 'GET' && path === '/anniversary-templates') {
        if (failTemplates) return route.fulfill({ status: 503, json: { error: '模板暂时离线' } })
        data = [{ key: 'birthday', title: '生日菜单', theme: '生日', description: '一起庆祝', structure: [] }]
      } else if (req.method() === 'POST' && path === '/anniversaries') { saved = req.postData(); data = { _id: 'created' } }
      else if (req.method() === 'DELETE' && path === '/anniversaries/ann-a') {
        assert.equal(JSON.parse(url.searchParams.get('expectedEditVersion')).revision, revision)
        if (deleteMode === 'conflict') { revision = 'v2'; return route.fulfill({ status: 409, json: { code: 'ANNIVERSARY_CONFLICT', error: '菜单已变化' } }) }
        deleted = true; return route.fulfill({ status: 503, json: { error: '无法确认' } })
      }
      else if (req.method() === 'GET' && path === '/meals') {
        reads.push(Object.fromEntries(url.searchParams)); const query = url.searchParams.get('search') || ''; const found = meals.filter(meal => meal.name.includes(query))
        if (query === '坏页') data = { data: [meals[1]], total: 1, page: 2, limit: 50 }
        else if (query === '重复') data = { data: [meals[1], meals[1]], total: 2, page: 1, limit: 50 }
        else if (query === '缺项') data = { data: [meals[1]], total: 2, page: 1, limit: 50 }
        else if (query === '无分页') data = { data: [meals[1]], total: 75 }
        else data = { data: found.slice(0, 50), total: found.length, page: 1, limit: 50 }
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/anniversaries`)
    await page.getByText('纪念晚餐', { exact: true }).waitFor()
    assert.equal(reads.length, 0, 'Timeline should not load the whole meal catalog')
    deleteSupported = false
    await page.reload()
    await page.getByText('服务器未提供安全删除能力', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '删除纪念晚餐' }).isDisabled(), true)
    deleteSupported = true
    await page.reload()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_ANNIVERSARY_SHOT) await page.screenshot({ path: process.env.EATWHAT_ANNIVERSARY_SHOT })
    await page.getByRole('button', { name: '查看纪念晚餐的第 1 张照片' }).click()
    const viewer = page.getByRole('dialog', { name: '纪念日照片' })
    await viewer.getByText('1 / 2').waitFor()
    const shortcut = await viewer.locator('.photo-preview').evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true })))
    assert.equal(shortcut, true, 'photo viewer must not intercept browser shortcuts')
    await viewer.evaluate(node => { const input = document.createElement('input'); input.id = 'photo-test-input'; node.querySelector('.el-dialog__body').appendChild(input) })
    const editableArrow = await viewer.locator('#photo-test-input').evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    assert.equal(editableArrow, true, 'photo viewer must not intercept editable controls')
    await viewer.locator('#photo-test-input').evaluate(node => node.remove())
    await page.keyboard.press('ArrowRight')
    await viewer.getByText('2 / 2').waitFor()
    await viewer.locator('img[alt="图片暂不可用"]').waitFor()
    await viewer.getByText('照片暂时无法加载，纪念日菜单仍然保留。').waitFor()
    brokenPhoto = false
    await viewer.getByRole('button', { name: '重试这张照片' }).focus()
    await page.keyboard.press('Enter')
    await viewer.locator('.photo-preview').evaluate(img => img.decode())
    await viewer.getByText('照片暂时无法加载，纪念日菜单仍然保留。').waitFor({ state: 'hidden' })
    assert.equal(await viewer.locator('.photo-preview').evaluate(img => document.activeElement === img), true, 'retry should preserve keyboard focus')
    await page.keyboard.press('ArrowLeft')
    await viewer.getByText('1 / 2').waitFor()
    assert.equal(await viewer.getByText('照片暂时无法加载，纪念日菜单仍然保留。').count(), 0, 'successful photos must not inherit the previous error')
    await page.keyboard.press('Escape')
    await viewer.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '新增菜单' }).click()
    const dialog = page.getByRole('dialog', { name: '新增纪念日菜单' })
    await dialog.getByText('模板暂不可用', { exact: false }).waitFor()
    failTemplates = false
    await dialog.getByRole('button', { name: '重试' }).click()
    await dialog.getByRole('button', { name: '生日菜单' }).click()
    const breakfast = dialog.getByRole('combobox', { name: '搜索早餐菜品' })
    await breakfast.click()
    await dialog.getByText('仅显示前 50 道', { exact: false }).first().waitFor()
    assert.equal(reads[0].limit, '50')
    await page.getByRole('option', { name: '菜品01', exact: true }).click()
    const dinner = dialog.getByRole('combobox', { name: '搜索晚餐菜品' })
    await dinner.click()
    for (const fault of ['坏页', '重复', '缺项', '无分页']) {
      await dinner.fill(fault)
      await dialog.getByText('菜品暂时无法加载', { exact: false }).first().waitFor()
      assert.equal(await page.getByRole('option', { name: '菜品02', exact: true }).count(), 0, `${fault} must not expose stale or invalid choices`)
    }
    await dinner.fill('菜品75')
    await dialog.getByText('菜品暂时无法加载', { exact: false }).first().waitFor({ state: 'hidden' })
    await page.getByRole('option', { name: '菜品75', exact: true }).click()
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.match(saved, /meal-01/); assert.match(saved, /meal-75/)
    await page.getByRole('button', { name: '删除纪念晚餐' }).click()
    await page.getByRole('button', { name: '删除', exact: true }).click()
    await page.getByText('菜单已被修改或删除，本次未删除', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '新增菜单' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    deleteMode = 'unknown'
    await page.getByRole('button', { name: '删除纪念晚餐' }).click()
    await page.getByRole('button', { name: '删除', exact: true }).click()
    await page.getByText('删除结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '新增菜单' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('还没有纪念日菜单').waitFor()
    const firstMenu = page.getByRole('button', { name: '创建第一份菜单' })
    assert.ok((await firstMenu.boundingBox()).height >= 44)
    await firstMenu.click()
    await dialog.waitFor()
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.deepEqual(errors, [])
    console.log('Anniversary workflows passed: lazy search, templates, preview, uncertain deletion and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
