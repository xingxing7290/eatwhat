const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Use a local test server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const version = { revision: 'v1', updatedAt: '2026-10-28T08:00:00.000Z' }
    let menus = Array.from({ length: 25 }, (_, i) => ({ _id: `id${i}`, date: `2026-11-${String(i + 1).padStart(2, '0')}`, title: `菜单 ${String(i).padStart(2, '0')}`, theme: '', description: '', photos: [], meals: { breakfast: [], lunch: [], dinner: [] }, supportsConditionalEdit: true, supportsConditionalDelete: true, supportsUnavailableMealVisibility: true, editVersion: version }))
    let directGets = 0; let broken = false; let wrongPeriod = false; let wrongCounts = false; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/anniversary-templates') return route.fulfill({ json: [] })
      if (path === '/anniversaries' && request.method() === 'GET') {
        const query = url.searchParams; const search = query.get('search') || ''; const period = query.get('period'); const today = query.get('today'); const current = Number(query.get('page')); const limit = Number(query.get('limit'))
        if (search === '慢结果') await new Promise(resolve => setTimeout(resolve, 700))
        const matching = menus.filter(item => [item.title, item.theme, item.description].some(value => value.toLowerCase().includes(search.toLowerCase())))
        const counts = { upcoming: matching.filter(item => item.date >= today).length, past: matching.filter(item => item.date < today).length, unknown: 0 }
        const rows = matching.filter(item => period === 'all' || (period === 'upcoming' ? item.date >= today : period === 'past' && item.date < today)).sort((a, b) => a.date.localeCompare(b.date))
        const pageItems = rows.slice((current - 1) * limit, current * limit)
        if ((wrongPeriod || wrongCounts) && pageItems.length) pageItems[0] = { ...pageItems[0], date: '2020-01-01' }
        return route.fulfill({ json: { supportsAnniversaryBoard: true, page: current, limit, search, period, today, counts, total: broken ? rows.length + 1 : rows.length, items: pageItems } }).catch(() => {})
      }
      if (path.startsWith('/anniversaries/') && request.method() === 'GET') {
        directGets++; const item = menus.find(item => item._id === path.split('/').pop())
        return item ? route.fulfill({ json: item }) : route.fulfill({ status: 404, json: { code: 'ANNIVERSARY_NOT_FOUND', error: '未找到纪念日菜单' } })
      }
      if (path === '/anniversaries/id0' && request.method() === 'PUT') {
        menus = menus.map(item => item._id === 'id0' ? { ...item, title: '家人更新的菜单', editVersion: { ...version, revision: 'v2' } } : item)
        return route.fulfill({ status: 409, json: { code: 'ANNIVERSARY_CONFLICT', error: '菜单已更新' } })
      }
      if (path === '/anniversaries/id12' && request.method() === 'DELETE') { menus = menus.filter(item => item._id !== 'id12'); return route.fulfill({ status: 503, json: { error: '结果未知' } }) }
      if (path === '/anniversaries' && request.method() === 'POST') return route.fulfill({ status: 503, json: { error: '结果未知' } })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/anniversaries`)
    await page.getByText('共 25 份匹配菜单 · 第 1 / 3 页').waitFor()
    wrongPeriod = true
    await page.getByRole('group', { name: '按日期筛选菜单' }).getByRole('button', { name: '即将到来' }).click()
    await page.getByText('菜单日期与筛选条件不一致', { exact: false }).first().waitFor()
    assert.equal(await page.locator('.menu-card').count(), 0, 'wrong-period results must not be displayed')
    wrongPeriod = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('共 25 份匹配菜单 · 第 1 / 3 页').waitFor()
    wrongCounts = true
    await page.getByRole('group', { name: '按日期筛选菜单' }).getByRole('button', { name: '全部', exact: true }).click()
    await page.getByText('菜单日期统计不一致', { exact: false }).first().waitFor()
    assert.equal(await page.locator('.menu-card').count(), 0, 'inconsistent date counts must not be displayed')
    wrongCounts = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('共 25 份匹配菜单 · 第 1 / 3 页').waitFor()
    await page.getByRole('button', { name: '编辑菜单 00' }).click()
    const editor = page.getByRole('dialog', { name: '编辑纪念日菜单' })
    await editor.getByPlaceholder('比如：三周年晚餐').fill('未保存草稿')
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await page.getByText('共 25 份匹配菜单 · 第 2 / 3 页').waitFor()
    await page.getByText('当前筛选或页面中未显示这份菜单。').waitFor()
    await page.getByRole('button', { name: '继续编辑', exact: true }).click()
    assert.equal(await editor.getByPlaceholder('比如：三周年晚餐').inputValue(), '未保存草稿')
    await editor.getByRole('button', { name: '保存', exact: true }).click()
    await editor.getByText('菜单已被修改或删除', { exact: false }).waitFor()
    await editor.getByRole('button', { name: '刷新最新菜单并核对' }).click()
    await editor.getByText('家人更新的菜单', { exact: false }).waitFor()
    assert.equal(directGets, 1)
    assert.equal(await editor.getByPlaceholder('比如：三周年晚餐').inputValue(), '未保存草稿')
    await editor.getByRole('button', { name: '放弃草稿并载入最新' }).click()
    await page.getByRole('button', { name: '放弃草稿并载入', exact: true }).click()
    await editor.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('button', { name: '删除菜单 12' }).click()
    await page.getByRole('dialog', { name: '删除确认' }).getByRole('button', { name: '删除', exact: true }).click()
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('核对时未找到这份菜单', { exact: false }).waitFor()
    assert.equal(directGets, 2)
    const search = page.getByRole('textbox', { name: '搜索纪念日菜单' })
    await search.fill('慢结果'); await page.waitForTimeout(250); await search.fill('菜单 23')
    await page.getByText('共 1 份匹配菜单 · 第 1 / 1 页').waitFor(); await page.waitForTimeout(800)
    await page.getByText('菜单 23', { exact: true }).waitFor()
    assert.equal(await page.locator('.menu-card').count(), 1)
    await search.fill('不存在'); await page.getByText('没有符合条件的纪念日菜单').waitFor()
    await page.getByRole('group', { name: '按日期筛选菜单' }).getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('共 24 份匹配菜单 · 第 1 / 2 页').waitFor()
    await page.getByRole('button', { name: '新增菜单' }).click()
    const create = page.getByRole('dialog', { name: '新增纪念日菜单' })
    await create.getByPlaceholder('比如：三周年晚餐').fill('结果待核对')
    await create.getByRole('button', { name: '保存', exact: true }).click()
    await create.getByText('保存结果未确认', { exact: false }).waitFor()
    await create.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByText('刚保存的菜单可能在其他页', { exact: false }).waitFor()
    await page.locator('.anniversary-page > .el-alert').filter({ hasText: '纪念日菜单保存结果未确认' }).getByRole('button', { name: '刷新列表并核对' }).click()
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await page.getByText('共 24 份匹配菜单 · 第 2 / 2 页').waitFor()
    broken = true; await page.reload(); await page.getByText('菜单分页结果不完整', { exact: false }).waitFor()
    assert.equal(await page.locator('.menu-card').count(), 0)
    assert.deepEqual(errors, [])
    console.log('Anniversary board checks passed: paging, draft, conflict lookup, delete review, stale search and malformed responses')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
