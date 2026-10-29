const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Shopping edit checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let version = 1; let mode = 'ok'; let writes = 0; let reloadFails = false; let recipeWrites = 0
    const sourceId = '0123456789abcdef01234567'
    const recipe = { _id: sourceId, name: '菠菜菜谱', ingredients: [{ name: '菠菜', amount: '' }], steps: [], photos: [], tags: [], supportsConditionalEdit: true, editVersion: { revision: 'v1', updatedAt: null } }
    let items = [
      { _id: 'manual', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: true },
      { _id: 'generated', name: '菠菜', amount: '1把', category: 'vegetable', checked: false, manual: false, quantityComplete: false, sourceMealIds: ['0123456789abcdef01234567', 'invalid', '0123456789abcdef01234567'] }
    ]
    const snapshot = () => ({ weekStart: '2026-10-26', supportsConditionalUpdates: true, listVersion: version, items })
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === `/meals/${sourceId}` && req.method() === 'GET') return route.fulfill({ json: recipe })
      if (path === `/meals/${sourceId}` && req.method() === 'PUT') { recipeWrites++; assert.match(req.postData(), /2把/); return route.fulfill({ json: recipe }) }
      if (path === '/memories' && req.method() === 'GET') return route.fulfill({ json: [] })
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
    await amount.evaluate(input => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true })))
    assert.equal(writes, 0, 'confirming an IME composition must not submit the form')
    await amount.press('Enter')
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
    const sourceLink = dialog.getByRole('link', { name: '查看来源菜谱 1' })
    assert.equal(await sourceLink.getAttribute('href'), '/meals/detail/0123456789abcdef01234567?shoppingWeek=2026-10-26')
    assert.equal(await dialog.locator('.source-recipes a').count(), 1, 'duplicate and invalid source IDs must not produce links')
    assert.ok((await sourceLink.boundingBox()).height >= 44)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
      await page.evaluate(({ dark, theme }) => { document.documentElement.classList.toggle('dark', dark); document.querySelector('.app-container').classList.toggle('dark-mode', dark); document.documentElement.dataset.theme = theme }, { dark, theme })
      for (const selector of ['.source-recipes p', '.source-recipes a']) assert.ok((await contrast(page, selector)).ratio >= 4.5, `${dark} ${theme} ${selector}`)
    }
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await amount.fill('两把')
    await sourceLink.click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(new URL(page.url()).pathname, '/shopping-list', 'following a source link must protect the unsaved edit')
    assert.equal(await amount.inputValue(), '两把')
    mode = 'conflict'
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
    await page.getByRole('button', { name: '编辑菠菜' }).click()
    await dialog.getByRole('link', { name: '查看来源菜谱 1' }).focus()
    await page.keyboard.press('Enter')
    await page.waitForURL('**/meals/detail/0123456789abcdef01234567?shoppingWeek=2026-10-26')
    await page.getByRole('heading', { name: '菠菜菜谱' }).waitFor()
    await page.getByRole('button', { name: '返回购物清单' }).click()
    await page.waitForURL('**/shopping-list?week=2026-10-26')
    await page.getByRole('button', { name: '编辑菠菜' }).click()
    await dialog.getByRole('link', { name: '查看来源菜谱 1' }).click()
    await page.getByRole('button', { name: '编辑菜品' }).click()
    await page.waitForURL('**/meals/editor/0123456789abcdef01234567?shoppingWeek=2026-10-26')
    await page.getByText('保存后返回 2026-10-26 所在周的购物清单', { exact: false }).waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.waitForURL('**/meals/detail/0123456789abcdef01234567?shoppingWeek=2026-10-26')
    await page.getByRole('button', { name: '编辑菜品' }).click()
    await page.getByRole('textbox', { name: '第 1 项食材用量' }).fill('2把')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/shopping-list?week=2026-10-26')
    await page.getByText('排餐变动不会自动更新清单', { exact: false }).waitFor()
    assert.equal(recipeWrites, 1)
    await page.goto(`${base}/meals/detail/${sourceId}?shoppingWeek=2026-02-31`)
    await page.getByRole('button', { name: '返回', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.deepEqual(errors, [])
    console.log('Shopping edit checks passed: draft protection, versions, conflict recovery and generated-item warning')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
