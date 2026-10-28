const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Anniversary edit tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })
const field = (body, name) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test' })) })
    const errors = []; const writes = []; let mode = 'conflict'; let compatible = true
    let menu = { _id: 'ann-a', title: '纪念晚餐', date: '2026-10-28', theme: '初始主题', description: '原备注', meals: { breakfast: [], lunch: [], dinner: [{ _id: 'meal-a', name: '原有菜品' }] }, photos: [image, `${image}#2`], supportsConditionalEdit: true, editVersion: version('v1') }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/anniversaries') data = [{ ...menu, supportsConditionalEdit: compatible }]
      else if (req.method() === 'GET' && path === '/anniversary-templates') data = []
      else if (req.method() === 'GET' && path === '/meals') data = { data: [{ _id: 'meal-a', name: '原有菜品' }, { _id: 'meal-b', name: '新菜品' }], total: 2, page: 1, limit: 50 }
      else if (req.method() === 'PUT' && path === '/anniversaries/ann-a') {
        const body = req.postData(); writes.push(body)
        if (mode === 'conflict') { menu = { ...menu, title: '家人修改的菜单', editVersion: version('v2') }; return route.fulfill({ status: 409, json: { code: 'ANNIVERSARY_CONFLICT', error: '发生冲突' } }) }
        if (mode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        assert.deepEqual(JSON.parse(field(body, 'expectedEditVersion')), version('v2'))
        const ids = JSON.parse(field(body, 'meals')); const photos = JSON.parse(field(body, 'existingPhotos'))
        menu = { ...menu, title: field(body, 'title'), photos, meals: { breakfast: [], lunch: [], dinner: ids.dinner.map(id => ({ _id: id, name: id === 'meal-a' ? '原有菜品' : '新菜品' })) }, editVersion: version('v3') }
        data = menu
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/anniversaries`)
    await page.getByRole('button', { name: '编辑纪念晚餐' }).click()
    const dialog = page.getByRole('dialog', { name: '编辑纪念日菜单' })
    const title = dialog.getByPlaceholder('比如：三周年晚餐')
    assert.equal(await title.inputValue(), '纪念晚餐')
    assert.equal(await dialog.locator('.existing-photo').count(), 2)
    if (process.env.EATWHAT_ANNIVERSARY_EDIT_SHOT) await page.screenshot({ path: process.env.EATWHAT_ANNIVERSARY_EDIT_SHOT })
    await title.fill('我的修改')
    await dialog.getByRole('button', { name: '移除已有照片 1' }).click()
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('菜单已被修改或删除，本次未保存', { exact: false }).waitFor()
    assert.equal(await title.inputValue(), '我的修改')
    assert.equal(await dialog.locator('.existing-photo').count(), 1)
    assert.equal(field(writes[0], 'meals'), undefined, 'unchanged meal slots must not be rewritten')
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
    await dialog.getByRole('button', { name: '刷新最新菜单并核对' }).click()
    await dialog.getByText('家人修改的菜单 · 2026-10-28').waitFor()
    await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    assert.equal(await title.inputValue(), '家人修改的菜单')
    assert.equal(await dialog.locator('.existing-photo').count(), 2)
    await title.fill('核对后修改')
    await dialog.getByRole('button', { name: '移除已有照片 1' }).click()
    mode = 'unknown'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('编辑结果未确认', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '刷新最新菜单并核对' }).click()
    await dialog.getByRole('button', { name: '已核对，允许重试' }).click()
    await page.getByRole('button', { name: '已核对，允许重试', exact: true }).last().click()
    const dinner = dialog.getByRole('combobox', { name: '搜索晚餐菜品' })
    await dinner.click()
    await page.getByRole('option', { name: '新菜品', exact: true }).click()
    mode = 'success'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.getByText('核对后修改', { exact: true }).waitFor()
    assert.equal(menu.photos.length, 1)
    assert.deepEqual(menu.meals.dinner.map(meal => meal._id), ['meal-a', 'meal-b'])
    assert.equal(writes.length, 3)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('button', { name: '编辑核对后修改' }).click()
    await dialog.getByPlaceholder('比如：三周年晚餐').fill('暂存草稿')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '新增菜单' }).click()
    await page.getByRole('button', { name: '继续编辑', exact: true }).last().click()
    await page.locator('.anniversary-page > .el-alert').getByRole('button', { name: '继续编辑', exact: true }).click()
    assert.equal(await dialog.getByPlaceholder('比如：三周年晚餐').inputValue(), '暂存草稿')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '新增菜单' }).click()
    await page.getByRole('button', { name: '放弃并切换' }).click()
    const createDialog = page.getByRole('dialog', { name: '新增纪念日菜单' })
    assert.equal(await createDialog.getByPlaceholder('比如：三周年晚餐').inputValue(), '')
    await createDialog.getByRole('button', { name: '取消', exact: true }).click()
    compatible = false
    await page.reload()
    await page.getByRole('button', { name: '编辑核对后修改' }).click()
    await page.getByText('服务器未提供有效的菜单版本', { exact: false }).waitFor()
    assert.equal(await page.getByRole('dialog', { name: '编辑纪念日菜单' }).count(), 0)
    assert.deepEqual(errors, [])
    console.log('Anniversary edit workflows passed: conflict, recovery, photos, meal preservation and legacy guard')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
