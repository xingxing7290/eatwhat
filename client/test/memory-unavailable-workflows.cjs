const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Memory tests require a local server')
const field = (body, name) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]
const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const mealA = { _id: 'a', name: '家常菜' }; const mealB = { _id: 'b', name: '新菜品' }
    let legacy = false; let conflict = false; let malformed = false; let revision = 1; const writes = []; const directQueries = []; const errors = []
    let memory = { _id: 'mem', title: '饭后故事', date: '2026-10-28', mealType: 'dinner', note: '', photos: [], mealIds: [mealA, null], participants: [{ _id: 'p', username: '家人' }], supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: version('v1') }
    page.on('pageerror', error => errors.push(error.message))
    const readable = () => ({ ...memory, mealIds: legacy ? memory.mealIds.filter(Boolean) : memory.mealIds, supportsUnavailableMealVisibility: !legacy })
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/memories' && req.method() === 'GET') return route.fulfill({ json: [malformed ? { ...readable(), mealIds: {} } : readable()] })
      if (path === '/memories/mem' && req.method() === 'GET') { directQueries.push(url.searchParams.get('view')); return route.fulfill({ json: readable() }) }
      if (path === '/meals') return route.fulfill({ json: { data: [mealA, mealB], total: 2, page: 1, limit: 50 } })
      if (path === '/memories/mem' && req.method() === 'PUT') {
        const body = req.postData(); writes.push(body)
        if (conflict) { conflict = false; revision++; memory = { ...memory, title: '家人刚修改', editVersion: version(`v${revision}`) }; return route.fulfill({ status: 409, json: { code: 'MEMORY_CONFLICT', error: '版本冲突' } }) }
        const ids = field(body, 'mealIds') ? JSON.parse(field(body, 'mealIds')) : null
        revision++; memory = { ...memory, title: field(body, 'title') || memory.title, mealIds: ids ? ids.map(id => id === 'a' ? mealA : mealB) : memory.mealIds, editVersion: version(`v${revision}`) }
        return route.fulfill({ json: memory })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/memories?edit=mem`)
    const dialog = page.getByRole('dialog', { name: '编辑饭后回忆' }); const select = dialog.getByRole('combobox', { name: '搜索相关菜品' })
    await dialog.getByText('有 1 条相关菜品不可用', { exact: false }).waitFor()
    assert.equal(directQueries[0], 'editor', 'deep links must request the complete editor view')
    assert.equal(await select.isDisabled(), true)
    await dialog.getByPlaceholder('比如：周五晚上的番茄牛腩').fill('只改标题')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' }); await page.getByText('只改标题', { exact: true }).waitFor()
    assert.equal(field(writes[0], 'mealIds'), undefined)
    assert.equal(memory.mealIds[1], null); assert.equal(memory.participants.length, 1)
    await page.getByRole('button', { name: '编辑只改标题' }).click()
    await dialog.getByRole('button', { name: '清除并编辑相关菜品' }).click()
    const confirm = page.getByRole('dialog', { name: '清除不可用菜品？' })
    await confirm.getByRole('button', { name: '保留原记录' }).click(); assert.equal(await select.isDisabled(), true)
    await dialog.getByRole('button', { name: '清除并编辑相关菜品' }).click()
    await confirm.getByRole('button', { name: '确认清除并编辑' }).click(); assert.equal(await select.isDisabled(), false)
    await select.click(); await page.getByRole('option', { name: '新菜品', exact: true }).click()
    await dialog.getByRole('button', { name: '撤销清除' }).click()
    const undo = page.getByRole('dialog', { name: '撤销清除？' })
    await undo.getByRole('button', { name: '继续编辑' }).click(); assert.equal(await select.isDisabled(), false)
    await dialog.getByRole('button', { name: '撤销清除' }).click()
    await undo.getByRole('button', { name: '放弃调整并撤销' }).click(); assert.equal(await select.isDisabled(), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.unavailable-meals span', '.unavailable-meals .el-button']) { const result = await contrast(page, selector); assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`) }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    conflict = true; await dialog.getByPlaceholder('比如：周五晚上的番茄牛腩').fill('我的草稿')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.getByText('回忆已被修改或删除，本次未保存', { exact: false }).waitFor()
    await dialog.getByRole('button', { name: '读取最新回忆并核对' }).click()
    await dialog.getByText('菜品：家常菜、菜品不可用').waitFor()
    assert.equal(directQueries.at(-1), 'editor')
    await dialog.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    await dialog.getByRole('button', { name: '清除并编辑相关菜品' }).click()
    await confirm.getByRole('button', { name: '确认清除并编辑' }).click()
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' }); await page.getByText('家人刚修改', { exact: true }).waitFor()
    assert.deepEqual(JSON.parse(field(writes.at(-1), 'mealIds')), ['a']); assert.equal(memory.participants.length, 1)
    memory = { ...memory, mealIds: [mealA, null] }; legacy = true; await page.reload()
    await page.getByRole('button', { name: '编辑家人刚修改' }).click()
    await dialog.getByText('当前服务器未提供菜品完整性核验', { exact: false }).waitFor()
    assert.equal(await select.isDisabled(), true)
    await dialog.getByPlaceholder('比如：周五晚上的番茄牛腩').fill('旧服务器只改标题')
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' }); assert.equal(field(writes.at(-1), 'mealIds'), undefined)
    malformed = true; await page.reload()
    await page.getByText('回忆列表数据不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.memory-card').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Memory unavailable checks passed: deep links, explicit clearing, preservation, conflicts and legacy safety')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
