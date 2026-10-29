const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Anniversary tests require a local server')
const field = (body, name) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const mealA = { _id: 'a', name: '早餐菜' }; const mealB = { _id: 'b', name: '午餐菜' }
    let legacy = false; let conflict = false; let revision = 1; const writes = []; const errors = []
    let menu = { _id: 'ann', title: '特别菜单', date: '2026-10-28', theme: '', description: '', photos: [], meals: { breakfast: [mealA, null], lunch: [mealB], dinner: [null] }, supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: version('v1') }
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/anniversaries' && req.method() === 'GET') return route.fulfill({ json: [{ ...menu, meals: legacy ? { breakfast: [mealA], lunch: [mealB], dinner: [] } : menu.meals, supportsUnavailableMealVisibility: !legacy }] })
      if (path === '/anniversary-templates') return route.fulfill({ json: [] })
      if (path === '/meals') return route.fulfill({ json: { data: [mealA, mealB], total: 2, page: 1, limit: 50 } })
      if (path === '/anniversaries/ann' && req.method() === 'PUT') {
        const body = req.postData(); writes.push(body)
        if (conflict) { conflict = false; revision++; menu = { ...menu, title: '家人刚修改', editVersion: version(`v${revision}`) }; return route.fulfill({ status: 409, json: { code: 'ANNIVERSARY_CONFLICT', error: '版本冲突' } }) }
        const changed = field(body, 'meals') ? JSON.parse(field(body, 'meals')) : null
        const updatedMeals = { ...menu.meals }
        for (const [key, ids] of Object.entries(changed || {})) updatedMeals[key] = ids.map(id => id === 'a' ? mealA : mealB)
        revision++; menu = { ...menu, title: field(body, 'title'), meals: updatedMeals, editVersion: version(`v${revision}`) }
        return route.fulfill({ json: menu })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/anniversaries`)
    await page.getByText('部分菜品不可用，原有引用仍保留在菜单中。').waitFor()
    assert.equal(await page.getByText('菜品不可用', { exact: true }).count(), 2)
    await page.getByRole('button', { name: '编辑特别菜单' }).click()
    const dialog = page.getByRole('dialog', { name: '编辑纪念日菜单' })
    const breakfast = dialog.getByRole('combobox', { name: '搜索早餐菜品' }); const lunch = dialog.getByRole('combobox', { name: '搜索午餐菜品' }); const dinner = dialog.getByRole('combobox', { name: '搜索晚餐菜品' })
    assert.equal(await breakfast.isDisabled(), true); assert.equal(await lunch.isDisabled(), false); assert.equal(await dinner.isDisabled(), true)
    await dialog.getByPlaceholder('比如：三周年晚餐').fill('只改标题')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' }); await page.getByText('只改标题', { exact: true }).waitFor()
    assert.equal(field(writes[0], 'meals'), undefined, 'unrelated edits must not rewrite hidden references')
    assert.equal(menu.meals.breakfast[1], null); assert.equal(menu.meals.dinner[0], null)
    await page.getByRole('button', { name: '编辑只改标题' }).click()
    await dialog.getByRole('button', { name: '清除并编辑早餐' }).click()
    const confirm = page.getByRole('dialog', { name: '清除不可用菜品？' })
    await confirm.getByRole('button', { name: '保留原记录' }).click(); assert.equal(await breakfast.isDisabled(), true)
    await dialog.getByRole('button', { name: '清除并编辑早餐' }).click()
    await confirm.getByRole('button', { name: '确认清除并编辑' }).click(); assert.equal(await breakfast.isDisabled(), false)
    await breakfast.click(); await page.getByRole('option', { name: '午餐菜', exact: true }).click()
    await dialog.getByRole('button', { name: '撤销清除早餐' }).click()
    const undo = page.getByRole('dialog', { name: '撤销清除？' })
    await undo.getByRole('button', { name: '继续编辑' }).click(); assert.equal(await breakfast.isDisabled(), false)
    await dialog.getByRole('button', { name: '撤销清除早餐' }).click()
    await undo.getByRole('button', { name: '放弃调整并撤销' }).click(); assert.equal(await breakfast.isDisabled(), true)
    await dialog.getByRole('button', { name: '清除并编辑早餐' }).click()
    await confirm.getByRole('button', { name: '确认清除并编辑' }).click()
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' }); await page.getByText('只改标题', { exact: true }).waitFor()
    assert.deepEqual(JSON.parse(field(writes[1], 'meals')), { breakfast: ['a'] })
    assert.equal(menu.meals.dinner[0], null, 'clearing one slot must preserve another')
    await page.getByRole('button', { name: '编辑只改标题' }).click()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.unavailable-slot span', '.unavailable-slot .el-button']) {
          const result = await contrast(page, selector); assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    conflict = true
    await dialog.getByPlaceholder('比如：三周年晚餐').fill('我的草稿')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('菜单已被修改或删除，本次未保存', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '刷新最新菜单并核对' }).click()
    await dialog.getByText('晚餐：菜品不可用').waitFor()
    assert.equal(await dialog.getByPlaceholder('比如：三周年晚餐').inputValue(), '我的草稿')
    await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    await dialog.getByRole('button', { name: '取消', exact: true }).click()
    legacy = true; await page.reload()
    await page.getByRole('button', { name: '编辑家人刚修改' }).click()
    await dialog.getByText('当前服务器未提供菜品完整性核验', { exact: false }).waitFor()
    assert.equal(await dialog.getByRole('combobox', { name: '搜索早餐菜品' }).isDisabled(), true)
    assert.equal(await dialog.getByRole('combobox', { name: '搜索午餐菜品' }).isDisabled(), true)
    await dialog.getByPlaceholder('比如：三周年晚餐').fill('旧服务器仅改标题')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.equal(field(writes.at(-1), 'meals'), undefined)
    assert.deepEqual(errors, [])
    console.log('Anniversary unavailable checks passed: explicit clearing, preservation, conflict, themes and legacy safety')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
