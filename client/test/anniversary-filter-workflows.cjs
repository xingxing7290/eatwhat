const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Anniversary checks require a local server')
const version = { revision: 'v1', updatedAt: '2026-10-28T08:00:00.000Z' }

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const fixture = (id, date, title, theme, meal = []) => ({ _id: id, date, title, theme, description: '', photos: [], meals: { breakfast: [], lunch: [], dinner: meal }, supportsConditionalEdit: true, supportsConditionalDelete: true, supportsUnavailableMealVisibility: true, editVersion: version })
    let menus = [fixture('past', '2025-10-28', '去年晚餐', '秋日'), fixture('future', '2026-11-15', '生日晚餐', '庆祝', [{ _id: 'meal-a', name: '番茄牛腩' }]), fixture('today', '2026-10-28', '今日小聚', '家常'), fixture('invalid', '2026-02-30', '日期旧记录', '待核对')]
    let malformed = false; let writes = 0; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/anniversaries' && req.method() === 'GET') return route.fulfill({ json: malformed ? [menus[0], menus[0]] : menus })
      if (path === '/anniversaries' && req.method() === 'POST') { writes++; return route.fulfill({ status: 503, json: { error: '保存结果未知' } }) }
      if (path === '/anniversaries/today' && req.method() === 'DELETE') { writes++; menus = menus.filter(item => item._id !== 'today'); return route.fulfill({ status: 204, body: '' }) }
      if (path === '/anniversary-templates') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/anniversaries`)
    await page.getByText('显示 4 / 4 份菜单').waitFor()
    const groups = page.locator('.menu-group')
    assert.deepEqual(await groups.locator('.group-heading h2').allTextContents(), ['即将到来', '往日菜单', '日期待核对'])
    assert.deepEqual(await groups.first().locator('.menu-card h2').allTextContents(), ['今日小聚', '生日晚餐'])
    await page.locator('.menu-card').filter({ hasText: '今日小聚' }).getByText('今天', { exact: true }).waitFor()
    const search = page.getByRole('textbox', { name: '搜索纪念日菜单' }); const filters = page.getByRole('group', { name: '按日期筛选菜单' })
    await search.fill('番茄牛腩'); await page.getByText('显示 1 / 4 份菜单').waitFor()
    await page.getByText('生日晚餐', { exact: true }).waitFor()
    await filters.getByRole('button', { name: '已过去' }).click(); await page.getByText('没有符合条件的纪念日菜单').waitFor()
    await filters.getByRole('button', { name: '清除筛选' }).click(); await page.getByText('显示 4 / 4 份菜单').waitFor()
    await filters.getByRole('button', { name: '日期待核对' }).click()
    const invalid = page.locator('.menu-card').filter({ hasText: '日期旧记录' }); await invalid.getByText('日期待核对', { exact: true }).waitFor()
    await invalid.getByRole('button', { name: '编辑日期旧记录' }).click()
    const editor = page.getByRole('dialog', { name: '编辑纪念日菜单' }); await editor.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('请填写标题和有效日期').waitFor(); assert.equal(writes, 0)
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    await filters.getByRole('button', { name: '全部', exact: true }).click()
    await page.getByRole('button', { name: '编辑生日晚餐' }).click()
    await editor.getByPlaceholder('比如：三周年晚餐').fill('未保存的草稿')
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    await search.fill('去年')
    await page.getByText('当前筛选中未显示这份菜单。').waitFor()
    await page.locator('.anniversary-page > .el-alert').getByRole('button', { name: '继续编辑', exact: true }).click()
    assert.equal(await editor.getByPlaceholder('比如：三周年晚餐').inputValue(), '未保存的草稿')
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '新增菜单' }).click()
    await page.getByRole('button', { name: '放弃并切换' }).click()
    const create = page.getByRole('dialog', { name: '新增纪念日菜单' })
    await create.getByPlaceholder('比如：三周年晚餐').fill('不确定的新菜单')
    await create.getByRole('button', { name: '保存', exact: true }).click()
    await create.getByText('保存结果未确认', { exact: false }).waitFor()
    await create.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByText('筛选可能隐藏刚保存的菜单', { exact: false }).waitFor()
    const recoveryNotice = page.locator('.anniversary-page > .el-alert').filter({ hasText: '纪念日菜单保存结果未确认' })
    await recoveryNotice.getByRole('button', { name: '刷新列表并核对' }).click()
    await page.getByText('显示 4 / 4 份菜单').waitFor(); assert.equal(await search.inputValue(), '')
    await recoveryNotice.getByRole('button', { name: '已有记录，放弃草稿' }).click()
    await page.getByRole('button', { name: '确认放弃草稿' }).click()
    await page.clock.setFixedTime(new Date(2026, 9, 29, 12)); await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await page.locator('.menu-card').filter({ hasText: '今日小聚' }).getByText('已过去 1 天').waitFor()
    await filters.getByRole('button', { name: '全部', exact: true }).click()
    const deleteButton = page.getByRole('button', { name: '删除今日小聚' }); await deleteButton.focus(); await page.keyboard.press('Enter')
    await page.getByRole('dialog', { name: '删除确认' }).getByRole('button', { name: '删除', exact: true }).click()
    await page.getByText('显示 3 / 3 份菜单').waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-pressed') === 'true')
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.filter-kicker', '.filter-heading h2', '.filter-heading p', '.period-filters button.active', '.group-heading h2', '.day-badge']) { const result = await contrast(page, selector); assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`) }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    if (process.env.EATWHAT_ANNIVERSARY_FILTER_SHOT) {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
      await page.screenshot({ path: process.env.EATWHAT_ANNIVERSARY_FILTER_SHOT, fullPage: true })
    }
    malformed = true; await page.reload(); await page.getByText('菜单列表不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.menu-card').count(), 0); assert.deepEqual(errors, [])
    console.log('Anniversary filter checks passed: grouping, search, drafts, recovery, focus, date rollover and themes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
