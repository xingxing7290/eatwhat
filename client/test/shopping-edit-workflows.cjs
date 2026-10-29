const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Shopping edit checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let version = 1; let mode = 'ok'; let writes = 0; let reloadFails = false
    let items = [
      { _id: 'manual', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: true },
      { _id: 'generated', name: '菠菜', amount: '1把', category: 'vegetable', checked: false, manual: false, quantityComplete: false }
    ]
    const snapshot = () => ({ weekStart: '2026-10-26', supportsConditionalUpdates: true, listVersion: version, items })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/shopping-list' && req.method() === 'GET') return reloadFails ? route.fulfill({ status: 503, json: { error: '读取失败' } }) : route.fulfill({ json: snapshot() })
      if (path.startsWith('/shopping-list/items/') && req.method() === 'PATCH') {
        const id = path.split('/').pop(); const body = req.postDataJSON(); assert.equal(body.expectedVersion, version); assert.equal(body.weekStart, '2026-10-26'); writes++
        if (mode === 'conflict') { version++; items = items.map(item => item._id === id ? { ...item, amount: '家人修改' } : item); return route.fulfill({ status: 409, json: { code: 'SHOPPING_LIST_CONFLICT', error: '冲突' } }) }
        version++; items = items.map(item => item._id === id ? { ...item, name: body.name, amount: body.amount, category: body.category, ...(typeof body.checked === 'boolean' ? { checked: body.checked } : {}) } : item)
        return route.fulfill({ json: snapshot() })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/shopping-list`)
    await page.getByRole('button', { name: '编辑鸡蛋' }).click()
    const dialog = page.getByRole('dialog', { name: '编辑购物食材' })
    const name = dialog.getByRole('textbox', { name: '编辑食材名称' })
    const amount = dialog.getByRole('textbox', { name: '编辑数量或备注' })
    await name.fill('土鸡蛋'); await amount.fill('6个')
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await name.inputValue(), '土鸡蛋')
    await dialog.getByRole('button', { name: '保存修改' }).click()
    await dialog.waitFor({ state: 'hidden' })
    await page.getByText('土鸡蛋', { exact: true }).waitFor()
    assert.equal(items.find(item => item._id === 'manual').checked, true)
    assert.equal(items.find(item => item._id === 'manual').amount, '6个')
    await page.getByRole('button', { name: '编辑土鸡蛋' }).click()
    await dialog.getByText('不勾选则保留已买状态').waitFor()
    await dialog.getByText('保存后将此项改为待买').click()
    await dialog.getByRole('button', { name: '保存修改' }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(items.find(item => item._id === 'manual').checked, false, 'marking pending in the editor must update purchase state')
    await page.getByRole('button', { name: '编辑菠菜' }).click()
    await dialog.getByText('重新生成清单时', { exact: false }).waitFor()
    await amount.fill('两把'); mode = 'conflict'
    await dialog.getByRole('button', { name: '保存修改' }).click()
    await dialog.getByText('其他成员更新了购物清单', { exact: false }).waitFor()
    assert.equal(await amount.inputValue(), '两把')
    assert.equal(await dialog.getByRole('button', { name: '保存修改' }).isDisabled(), true)
    reloadFails = true
    await dialog.getByRole('button', { name: '重新加载并核对' }).click()
    await dialog.getByText('无法核对购物清单：读取失败').waitFor()
    reloadFails = false; mode = 'ok'
    await dialog.getByRole('button', { name: '重试', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('[aria-label="编辑数量或备注"]')?.disabled)
    assert.equal(await amount.inputValue(), '两把', 'reloading after a conflict must retain the edit draft')
    await dialog.locator('.edit-current').getByText('菠菜 · 家人修改 · 蔬菜 · 待买').waitFor()
    await dialog.getByRole('button', { name: '保存修改' }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(items.find(item => item._id === 'generated').amount, '两把')
    assert.equal(writes, 4)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log('Shopping edit checks passed: draft protection, versions, conflict recovery and generated-item warning')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
