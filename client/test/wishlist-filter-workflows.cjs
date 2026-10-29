const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Wishlist checks require a local server')
const version = { revision: 'v1', updatedAt: '2026-10-28T08:00:00.000Z' }

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let writes = 0; let invalid = false
    let items = [
      { _id: 'a', title: '火锅', note: '香辣', category: '聚餐', priority: 'high', status: 'open', votes: [], votedByMe: false, supportsSetVote: true, supportsConditionalActions: true, editVersion: version, mealId: { _id: 'm1', name: '豆腐锅' } },
      { _id: 'b', title: '番茄', note: '', category: '家常', priority: 'normal', status: 'open', votes: [], supportsSafeMealLink: true },
      { _id: 'c', title: '牛肉', note: '', category: '家常', priority: 'normal', status: 'planned', votes: [], mealId: { name: '信息不全' } },
      { _id: 'd', title: '面条', note: '', category: '主食', priority: 'low', status: 'done', votes: [], mealId: 'legacy-id' },
      { _id: 'e', title: '旧状态心愿', note: '', category: '', priority: 'legacy', status: 'unknown-old', votes: [] }
    ]
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/wishlist' && request.method() === 'GET') return route.fulfill({ json: invalid ? [items[0], items[0]] : items })
      if (path.startsWith('/wishlist/') && request.method() === 'GET') return route.fulfill({ json: items.find(item => item._id === path.split('/').pop()) || {} })
      if (path === '/meals' && request.method() === 'POST') return route.fulfill({ status: 503, json: { error: '模拟菜谱创建响应丢失' } })
      if (path === '/wishlist/a/status' && request.method() === 'PATCH') {
        const body = request.postDataJSON(); assert.equal(body.status, 'planned'); writes++
        items = items.map(item => item._id === 'a' ? { ...item, status: 'planned', editVersion: { ...version, revision: 'v2' } } : item)
        return route.fulfill({ json: items[0] })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/wishlist`)
    await page.getByText('显示 5 / 5 条记录').waitFor()
    const linked = page.getByRole('link', { name: '查看火锅的关联菜谱：豆腐锅（新标签打开）' })
    assert.equal(await linked.getAttribute('href'), '/meals/detail/m1')
    assert.equal(await linked.getAttribute('target'), '_blank')
    assert.match(await linked.getAttribute('rel'), /noopener/)
    assert.ok((await linked.boundingBox()).height >= 44)
    assert.equal(await page.getByRole('link', { name: '查看面条的关联菜谱：查看菜谱（新标签打开）' }).getAttribute('href'), '/meals/detail/legacy-id')
    const incomplete = page.locator('.wish-card').filter({ hasText: '牛肉' })
    await incomplete.getByText('关联菜谱信息不完整', { exact: false }).waitFor()
    assert.equal(await incomplete.getByRole('button', { name: '安排今天晚餐' }).isDisabled(), true)
    await page.getByRole('textbox', { name: '搜索想吃记录' }).fill('豆腐锅')
    await page.getByText('显示 1 / 5 条记录').waitFor()
    await page.context().route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/m1') return route.fulfill({ json: { _id: 'm1', name: '豆腐锅', ingredients: [], steps: [], photos: [], tags: [] } })
      return route.fulfill({ json: [] })
    })
    const popupPromise = page.waitForEvent('popup')
    await linked.click()
    const popup = await popupPromise
    await popup.waitForURL('**/meals/detail/m1')
    await popup.getByRole('heading', { name: '豆腐锅' }).waitFor()
    assert.equal(await page.getByRole('textbox', { name: '搜索想吃记录' }).inputValue(), '豆腐锅', 'opening a recipe must preserve the original filtered board')
    await popup.close()
    await page.getByRole('textbox', { name: '搜索想吃记录' }).fill('')
    await page.getByText('显示 5 / 5 条记录').waitFor()
    const unknown = page.locator('.wish-card').filter({ hasText: '旧状态心愿' })
    await unknown.getByText('记录状态无法识别', { exact: false }).waitFor()
    assert.equal(await unknown.getByRole('button').count(), 0)
    assert.equal(await unknown.getByText('未设置', { exact: true }).count(), 1)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.wishlist-page .eyebrow', '.wishlist-page h1', '.filter-heading h2', '.filter-heading p', '.status-filters button.active', '.status-filters button:not(.active)', '.priority-filter', '.status-column h2', '.pending-note', '.linked-meal a', '.linked-meal small']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    const status = page.getByRole('group', { name: '按状态筛选' })
    const search = page.getByRole('textbox', { name: '搜索想吃记录' })
    await status.getByRole('button', { name: '想吃', exact: true }).click()
    await page.getByText('显示 2 / 5 条记录').waitFor()
    assert.equal(await status.getByRole('button', { name: '想吃', exact: true }).getAttribute('aria-pressed'), 'true')
    await search.fill('香辣')
    await page.getByText('显示 1 / 5 条记录').waitFor()
    await page.getByLabel('按优先级筛选').selectOption('low')
    await page.getByText('没有符合条件的想吃记录').waitFor()
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('显示 5 / 5 条记录').waitFor()
    await page.getByLabel('按优先级筛选').selectOption('unset')
    await page.getByText('显示 1 / 5 条记录').waitFor()
    await unknown.waitFor()
    await page.getByLabel('按优先级筛选').selectOption('all')
    await status.getByRole('button', { name: '想吃', exact: true }).click()
    await search.fill('豆腐锅')
    await page.getByText('显示 1 / 5 条记录').waitFor()
    const card = page.locator('.wish-card').filter({ hasText: '火锅' })
    await card.getByRole('button', { name: '标记已安排' }).focus()
    await page.keyboard.press('Enter')
    await page.getByText('没有符合条件的想吃记录').waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '想吃' && document.activeElement?.getAttribute('aria-pressed') === 'true')
    assert.equal(writes, 1)
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('显示 5 / 5 条记录').waitFor()
    assert.equal(await page.locator('.status-column').filter({ hasText: '已安排' }).getByText('火锅', { exact: true }).count(), 1)
    const pending = page.locator('.wish-card').filter({ hasText: '番茄' })
    await pending.getByRole('button', { name: '转菜品' }).click()
    await pending.getByText('创建结果不确定', { exact: false }).waitFor()
    await search.fill('火锅')
    await page.getByText('有 1 条关联或创建结果待核对的记录不在当前结果中。').waitFor()
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.hidden-pending span', '.hidden-pending .el-button']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
      }
    }
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await page.getByRole('button', { name: '查看待核对记录' }).click()
    await pending.getByText('创建结果不确定', { exact: false }).waitFor()
    invalid = true
    page.on('dialog', dialog => dialog.accept())
    await page.reload()
    await page.getByText('清单数据不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.wish-card').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Wishlist filter checks passed: search, priority, status, unknown records and focus')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
