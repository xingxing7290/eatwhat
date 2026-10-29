const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Wishlist edit tests require a local test server')
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test', householdId: 'home-a' })) })
    const writes = []; const errors = []; let mode = 'conflict'; let failDetail = false; let compatible = true
    let item = { _id: 'wish-a', title: '想吃面条', note: '少辣', category: '家常', priority: 'normal', status: 'planned', mealId: { _id: 'meal-a', name: '面条' }, votes: [{ _id: 'u1' }], votedByMe: true, supportsSetVote: true, supportsSafeMealLink: true, supportsConditionalActions: true, supportsWishEdit: true, editVersion: version('v1') }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/wishlist') data = [{ ...item, supportsWishEdit: compatible }]
      else if (req.method() === 'GET' && path === '/wishlist/wish-a') { if (failDetail) return route.fulfill({ status: 503, json: { error: '读取失败' } }); data = item }
      else if (req.method() === 'PATCH' && path === '/wishlist/wish-a') {
        const body = req.postDataJSON(); writes.push(body)
        if (mode === 'conflict') { item = { ...item, title: '家人的更新', editVersion: version('v2') }; return route.fulfill({ status: 409, json: { code: 'WISH_CONFLICT', error: '发生冲突' } }) }
        if (mode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        assert.deepEqual(body.expectedEditVersion, version('v2'))
        assert.equal(body.status, undefined); assert.equal(body.votes, undefined); assert.equal(body.mealId, undefined)
        item = { ...item, ...body, editVersion: version('v3') }; data = item
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/wishlist`)
    await page.getByRole('button', { name: '编辑想吃面条' }).click()
    const dialog = page.getByRole('dialog', { name: '编辑想吃记录' })
    const title = dialog.getByPlaceholder('比如：冬阴功火锅、楼下那家牛肉面')
    assert.equal(await title.inputValue(), '想吃面条')
    if (process.env.EATWHAT_WISHLIST_EDIT_SHOT) await page.screenshot({ path: process.env.EATWHAT_WISHLIST_EDIT_SHOT })
    await title.fill('我的草稿')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('想吃记录已被修改或删除，本次未保存', { exact: false }).waitFor()
    assert.equal(await title.inputValue(), '我的草稿')
    assert.equal(await dialog.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
    failDetail = true
    await dialog.getByRole('button', { name: '读取最新记录并核对' }).click()
    await dialog.getByText('读取失败', { exact: false }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).count(), 0)
    failDetail = false
    await dialog.getByRole('button', { name: '读取最新记录并核对' }).click()
    await dialog.getByText('家人的更新', { exact: true }).waitFor()
    await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    assert.equal(await title.inputValue(), '家人的更新')
    await title.fill('核对后修改')
    mode = 'unknown'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('编辑结果未确认', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '读取最新记录并核对' }).click()
    await dialog.getByRole('button', { name: '已核对，允许重试' }).click()
    await page.getByRole('button', { name: '已核对，允许重试', exact: true }).last().click()
    await dialog.locator('textarea').fill('多加醋')
    await dialog.locator('.el-select').click()
    await page.locator('.el-select-dropdown:visible').getByRole('option', { name: '超想吃', exact: true }).click()
    mode = 'success'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.getByText('核对后修改', { exact: true }).waitFor()
    assert.equal(item.note, '多加醋'); assert.equal(item.priority, 'high'); assert.equal(item.status, 'planned'); assert.equal(item.mealId._id, 'meal-a'); assert.equal(item.votes.length, 1)
    assert.equal(writes.length, 3)
    await page.getByRole('button', { name: '编辑核对后修改' }).click()
    await title.fill('暂存草稿')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: '删除核对后修改' }).isDisabled(), true)
    await page.getByRole('button', { name: '添加想吃' }).click()
    await page.getByRole('button', { name: '继续编辑', exact: true }).last().click()
    await page.locator('.wishlist-page > .el-alert').getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await title.inputValue(), '暂存草稿')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '添加想吃' }).click()
    await page.getByRole('button', { name: '放弃并切换' }).click()
    const createDialog = page.getByRole('dialog', { name: '添加想吃' })
    assert.equal(await createDialog.getByPlaceholder('比如：冬阴功火锅、楼下那家牛肉面').inputValue(), '')
    await createDialog.getByRole('button', { name: '取消', exact: true }).click()
    compatible = false
    await page.reload()
    assert.equal(await page.getByRole('button', { name: '编辑核对后修改' }).isDisabled(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log('Wishlist edit workflows passed: conflicts, recovery, draft switching and linked-data preservation')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
