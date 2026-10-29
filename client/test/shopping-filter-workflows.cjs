const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Shopping checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let version = 1; let writes = 0; let holdInitial = true; let releaseInitial
    let items = [
      { _id: 'egg', name: '鸡蛋', amount: '2个', category: 'meat_egg', checked: true, manual: true },
      { _id: 'milk', name: '牛奶', amount: '1L', category: 'other', checked: true, manual: true },
      { _id: 'spinach', name: '菠菜', amount: '1把', category: 'vegetable', checked: false, manual: false, quantityComplete: false },
      { _id: 'rice', name: '大米', amount: '2斤', category: 'staple', checked: false, manual: true }
    ]
    const snapshot = () => ({ weekStart: '2026-10-26', supportsConditionalUpdates: true, listVersion: version, items })
    await page.route('**/api/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/shopping-list' && request.method() === 'GET') { if (holdInitial) await new Promise(resolve => { releaseInitial = resolve }); return route.fulfill({ json: snapshot() }) }
      if (path === '/shopping-list/generate' && request.method() === 'POST') { writes++; return route.fulfill({ json: snapshot() }) }
      if (path === '/shopping-list/items' && request.method() === 'POST') { const body = request.postDataJSON(); assert.equal(body.expectedVersion, version); writes++; version++; items = [...items, { _id: 'new-item', name: body.name, amount: body.amount, category: body.category, checked: false, manual: true }]; return route.fulfill({ json: snapshot() }) }
      if (path === '/shopping-list/purchased' && request.method() === 'DELETE') { assert.equal(Number(url.searchParams.get('expectedVersion')), version); writes++; version++; items = items.filter(item => !item.checked); return route.fulfill({ json: snapshot() }) }
      if (path.startsWith('/shopping-list/items/') && request.method() === 'PATCH') { const id = path.split('/').pop(); const body = request.postDataJSON(); assert.equal(body.expectedVersion, version); writes++; version++; items = items.map(item => item._id === id ? { ...item, checked: body.checked } : item); return route.fulfill({ json: snapshot() }) }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/shopping-list`)
    await page.getByText('正在读取所选周采购进度…').waitFor()
    assert.equal(await page.locator('.progress-card').count(), 0, 'loading must not look like an empty list')
    for (let i = 0; i < 100 && !releaseInitial; i++) await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(typeof releaseInitial, 'function')
    holdInitial = false; releaseInitial()
    await page.getByText('显示 4 / 4 项 · 本周待买 2 项').waitFor()
    assert.match(await page.locator('.progress-card').innerText(), /2\s*\/\s*4/)
    await page.locator('.item-row').filter({ hasText: '菠菜' }).getByText('用量待核对').waitFor()
    await page.getByRole('button', { name: '从排餐生成' }).click()
    await page.getByText('食材用量和已购状态可能变化', { exact: false }).waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).click()
    assert.equal(writes, 0, 'cancelling regeneration must not write')
    await page.getByRole('button', { name: '待买', exact: true }).click()
    await page.getByText('显示 2 / 4 项 · 本周待买 2 项').waitFor()
    assert.equal(await page.getByRole('button', { name: '待买', exact: true }).getAttribute('aria-pressed'), 'true')
    assert.equal(await page.getByText('鸡蛋', { exact: true }).count(), 0)
    const search = page.getByRole('textbox', { name: '搜索购物食材' })
    await search.fill('蔬菜')
    await page.getByText('显示 1 / 4 项 · 本周待买 2 项').waitFor()
    await page.getByText('菠菜', { exact: true }).waitFor()
    await page.getByRole('button', { name: '清除筛选', exact: true }).click()
    await page.getByText('显示 4 / 4 项 · 本周待买 2 项').waitFor()
    assert.equal(await search.inputValue(), '')
    assert.equal(await search.evaluate(node => document.activeElement === node), true)
    await page.getByRole('button', { name: '待买', exact: true }).click()
    await search.fill('没有匹配')
    await page.getByText('没有符合条件的食材').waitFor()
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('显示 4 / 4 项 · 本周待买 2 项').waitFor()
    assert.equal(await search.evaluate(node => document.activeElement === node), true)
    await page.getByRole('button', { name: '已买', exact: true }).click()
    await search.fill('鸡蛋')
    await page.getByText('显示 1 / 4 项 · 本周待买 2 项').waitFor()
    await page.getByRole('button', { name: '清空已购' }).click()
    await page.getByText('此操作作用于所选周全部已购食材，包括筛选后未显示的项目。', { exact: false }).waitFor()
    await page.getByRole('button', { name: '取消', exact: true }).last().click()
    assert.equal(writes, 0)
    await page.getByRole('button', { name: '清空已购' }).click()
    await page.getByRole('button', { name: '清空', exact: true }).click()
    await page.getByText('没有符合条件的食材').waitFor()
    assert.deepEqual(items.map(item => item._id), ['spinach', 'rice'])
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByRole('button', { name: '待买', exact: true }).click()
    await page.getByRole('checkbox', { name: /菠菜/ }).focus()
    await page.keyboard.press('Space')
    await page.getByText('显示 1 / 2 项 · 本周待买 1 项').waitFor()
    assert.equal(await page.getByText('菠菜', { exact: true }).count(), 0)
    await page.waitForFunction(() => document.activeElement?.closest('.item-row')?.textContent.includes('大米'))
    assert.match(await page.locator('.progress-card').innerText(), /1\s*\/\s*2/)
    await page.keyboard.press('Space')
    await page.getByText('没有符合条件的食材').waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '待买' && document.activeElement?.getAttribute('aria-pressed') === 'true')
    await page.getByRole('button', { name: '全部', exact: true }).click()
    await search.fill('1把')
    await page.getByText('菠菜', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    items.push({ _id: 'legacy', name: '旧分类食材', amount: '', category: 'constructor', checked: false, manual: true }); version++
    await page.reload()
    await page.getByText('旧分类食材', { exact: true }).waitFor()
    await page.getByRole('textbox', { name: '搜索购物食材' }).fill('其他')
    await page.getByText('旧分类食材', { exact: true }).waitFor()
    await page.getByRole('textbox', { name: '搜索购物食材' }).fill('旧分类食材')
    await page.getByRole('textbox', { name: '食材名称' }).fill('牛肉')
    await page.getByRole('button', { name: '添加食材' }).click()
    await page.getByText('已添加食材；如未显示，可清除筛选查看').waitFor()
    assert.equal(await page.getByText('牛肉', { exact: true }).count(), 0)
    await page.getByRole('textbox', { name: '搜索购物食材' }).fill('')
    await page.getByText('牛肉', { exact: true }).waitFor()
    assert.equal(writes, 4)
    console.log('Shopping filters passed: search, status, global counts and clear scope')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
