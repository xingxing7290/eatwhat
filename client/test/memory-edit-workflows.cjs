const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Memory edit tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })
const field = (body, name) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test' })) })
    const errors = []; const writes = []; let mode = 'conflict'; let detailFailure = false; let listCapped = false; let compatible = true; let detailReads = 0
    let memory = { _id: 'memory-a', title: '温馨回忆', date: '2026-10-28', mealType: 'dinner', mood: '开心', note: '原备注', rating: 4, actualCookTime: 15, nextImprovement: '少放盐', mealIds: [{ _id: 'meal-a', name: '原有菜品' }], participants: [{ _id: 'person-a', username: '家人' }], photos: [image, `${image}#2`], supportsConditionalEdit: true, editVersion: version('v1') }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/memories') data = listCapped ? [] : [{ ...memory, supportsConditionalEdit: compatible }]
      else if (req.method() === 'GET' && path === '/memories/memory-a') { detailReads++; if (detailFailure) return route.fulfill({ status: 503, json: { error: '读取失败' } }); data = memory }
      else if (req.method() === 'GET' && path === '/meals') data = { data: [memory.mealIds[0]], total: 1, page: 1, limit: 50 }
      else if (req.method() === 'PUT' && path === '/memories/memory-a') {
        const body = req.postData(); writes.push(body)
        if (mode === 'conflict') { memory = { ...memory, title: '家人修改的回忆', editVersion: version('v2') }; return route.fulfill({ status: 409, json: { code: 'MEMORY_CONFLICT', error: '发生冲突' } }) }
        if (mode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        assert.deepEqual(JSON.parse(field(body, 'expectedEditVersion')), version('v2'))
        assert.equal(field(body, 'mealIds'), undefined)
        assert.equal(field(body, 'participants'), undefined)
        memory = { ...memory, title: field(body, 'title'), photos: JSON.parse(field(body, 'existingPhotos')), actualCookTime: Number(field(body, 'actualCookTime')), editVersion: version('v3') }
        data = memory
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/memories`)
    await page.getByRole('button', { name: '编辑温馨回忆' }).click()
    const dialog = page.getByRole('dialog', { name: '编辑饭后回忆' })
    const title = dialog.getByPlaceholder('比如：周五晚上的番茄牛腩')
    assert.equal(await title.inputValue(), '温馨回忆')
    assert.equal(await dialog.locator('.existing-photo').count(), 2)
    if (process.env.EATWHAT_MEMORY_EDIT_SHOT) await page.screenshot({ path: process.env.EATWHAT_MEMORY_EDIT_SHOT })
    await title.fill('我的草稿')
    await dialog.getByRole('button', { name: '移除已有照片 1' }).click()
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('回忆已被修改或删除，本次未保存', { exact: false }).waitFor()
    assert.equal(await title.inputValue(), '我的草稿')
    assert.equal(field(writes[0], 'mealIds'), undefined)
    assert.equal(field(writes[0], 'participants'), undefined)
    detailFailure = true; listCapped = true
    await dialog.getByRole('button', { name: '读取最新回忆并核对' }).click()
    await dialog.getByText('读取失败', { exact: false }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).count(), 0)
    detailFailure = false
    await dialog.getByRole('button', { name: '读取最新回忆并核对' }).click()
    await dialog.getByText('家人修改的回忆 · 2026-10-28').waitFor()
    assert.equal(detailReads, 2, 'review must read the record directly, even when it is absent from the capped timeline')
    await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    assert.equal(await title.inputValue(), '家人修改的回忆')
    assert.equal(await dialog.locator('.existing-photo').count(), 2)
    await title.fill('核对后回忆')
    await dialog.getByRole('button', { name: '移除已有照片 1' }).click()
    mode = 'unknown'
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('编辑结果未确认', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '读取最新回忆并核对' }).click()
    await dialog.getByRole('button', { name: '已核对，允许重试' }).click()
    await page.getByRole('button', { name: '已核对，允许重试', exact: true }).last().click()
    await dialog.getByRole('spinbutton').fill('25')
    mode = 'success'; listCapped = false
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.getByText('核对后回忆', { exact: true }).waitFor()
    assert.equal(memory.photos.length, 1)
    assert.equal(memory.actualCookTime, 25)
    assert.equal(memory.participants.length, 1)
    assert.equal(memory.mealIds.length, 1)
    assert.equal(writes.length, 3)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    compatible = false
    await page.reload()
    await page.getByRole('button', { name: '编辑核对后回忆' }).click()
    await page.getByText('服务器未提供有效的回忆版本', { exact: false }).waitFor()
    assert.equal(await page.getByRole('dialog', { name: '编辑饭后回忆' }).count(), 0)
    compatible = true; listCapped = true; detailFailure = true
    await page.goto(`${base}/memories?edit=memory-a`)
    await page.getByText('无法打开相册关联的回忆', { exact: false }).waitFor()
    detailFailure = false
    await page.getByRole('button', { name: '重新打开' }).click()
    const linked = page.getByRole('dialog', { name: '编辑饭后回忆' })
    await linked.getByPlaceholder('比如：周五晚上的番茄牛腩').waitFor()
    assert.equal(await linked.getByPlaceholder('比如：周五晚上的番茄牛腩').inputValue(), '核对后回忆')
    await page.waitForURL('**/memories')
    assert.deepEqual(errors, [])
    console.log('Memory edit workflows passed: conflict, direct review, recovery, photo and linked-data preservation')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
