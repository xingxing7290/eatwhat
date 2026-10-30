const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Shopping tests require a local test server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ username: 'test', displayName: '测试用户', householdId: 'home-a' }))
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let version = 0
    let items = []
    let mode = 'uncertain'
    let legacy = false
    const writes = []
    const snapshot = (week = '2026-10-26') => ({ weekStart: week, ...(legacy ? {} : { supportsConditionalUpdates: true, listVersion: week === '2026-10-26' ? version : 0 }), items: week === '2026-10-26' ? items : [] })
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request()
      const url = new URL(req.url())
      const pathname = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && pathname === '/shopping-list') data = snapshot(url.searchParams.get('weekStart') || '2026-10-26')
      else if (req.method() === 'POST' && pathname === '/shopping-list/items') {
        const body = req.postDataJSON()
        writes.push(body)
        assert.equal(body.expectedVersion, version)
        const priorItems = items
        items = [...items, { _id: `item-${version}`, name: body.name, amount: body.amount, category: body.category, manual: true, checked: false }]
        version++
        if (mode === 'uncertain') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        if (mode === 'malformed') data = { ...snapshot(), listVersion: version - 1 }
        else if (mode === 'inconsistent') data = { ...snapshot(), items: priorItems }
        else data = snapshot()
      } else if (req.method() === 'GET' && pathname === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/shopping-list`)
    const input = page.getByRole('textbox', { name: '食材名称' })
    await input.waitFor()
    await page.waitForFunction(() => !document.querySelector('input[aria-label="食材名称"]')?.disabled)
    await page.getByRole('button', { name: '填写新食材 ↓' }).click()
    assert.equal(await input.evaluate(node => document.activeElement === node), true, 'empty list action focuses manual entry')
    assert.equal(writes.length, 0, 'the empty list action must not create an item')
    await input.fill('很长的测试食材名称用于检查手机端换行不应该溢出屏幕')
    await page.getByRole('group', { name: '切换购物清单日期' }).getByRole('button', { name: '下一周' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByLabel('选择购物清单日期').inputValue(), '2026-10-26')
    assert.match(await input.inputValue(), /很长的测试食材/)
    const selectNextWeek = async () => {
      await page.getByLabel('选择购物清单日期').click()
      await page.locator('.el-date-picker:visible td.next-month').filter({ hasText: /^2$/ }).click()
    }
    await selectNextWeek()
    await page.getByText('切换周会清除当前输入', { exact: false }).waitFor()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByLabel('选择购物清单日期').inputValue(), '2026-10-26')
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await page.locator('.mobile-nav').getByRole('link', { name: '首页' }).click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.match(await input.inputValue(), /很长的测试食材/)
    await page.locator('.mobile-nav').getByRole('button', { name: '关闭导航菜单' }).click()
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.getByRole('button', { name: '添加食材' }).click()
    await page.getByText('操作结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '添加食材' }).isDisabled(), true)
    assert.match(await input.inputValue(), /很长的测试食材/)
    assert.equal(writes.length, 1)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('很长的测试食材名称用于检查手机端换行不应该溢出屏幕', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.match(await input.inputValue(), /很长的测试食材/)
    await input.fill('第二项')
    mode = 'malformed'
    await page.getByRole('button', { name: '添加食材' }).click()
    await page.getByText('操作结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '添加食材' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('第二项', { exact: true }).waitFor()
    await input.fill('第三项')
    mode = 'inconsistent'
    await page.getByRole('button', { name: '添加食材' }).click()
    await page.getByText('操作结果未确认', { exact: false }).waitFor()
    assert.equal(await input.inputValue(), '第三项')
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('第三项', { exact: true }).waitFor()
    await selectNextWeek()
    await page.getByRole('button', { name: '切换并清除' }).click()
    await page.getByText('2026-11-02 开始的一周').waitFor()
    assert.equal(await input.inputValue(), '')
    assert.equal(await page.getByText('第二项', { exact: true }).count(), 0)
    await page.getByRole('group', { name: '切换购物清单日期' }).getByRole('button', { name: '回到本周' }).click()
    await page.getByText('2026-10-26 开始的一周', { exact: false }).waitFor()
    await page.getByText('第二项', { exact: true }).waitFor()
    mode = 'ok'
    await input.fill('胡萝卜')
    const amount = page.getByRole('textbox', { name: '数量或备注' })
    await amount.fill('两根')
    await amount.press('Enter')
    await page.getByText('食材已添加', { exact: true }).waitFor()
    await page.getByText('胡萝卜', { exact: true }).waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '食材名称')
    assert.equal(await input.inputValue(), '')
    assert.equal(await amount.inputValue(), '')
    legacy = true
    await page.goto(`${base}/shopping-list`)
    await page.getByText('服务器未提供安全版本信息', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '添加食材' }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: '从排餐生成' }).isDisabled(), true)
    assert.equal(writes.length, 4)
    assert.deepEqual(errors, [])
    if (process.env.EATWHAT_SHOPPING_SHOT) await page.screenshot({ path: process.env.EATWHAT_SHOPPING_SHOT, fullPage: true })
    console.log('Shopping workflows passed: drafts, uncertain writes, response validation, mobile and legacy read-only mode')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
