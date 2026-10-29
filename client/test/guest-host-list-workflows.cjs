const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Guest host list tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    const initialTime = new Date(2026, 9, 29, 12, 0, 0)
    await page.clock.setFixedTime(initialTime)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test', householdId: 'home-a' })) })
    const home = '111111111111111111111111'; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const items = Array.from({ length: 41 }, (_, i) => ({ id: i.toString(16).padStart(24, '0'), householdId: home, title: i === 40 ? '延迟旧宴请' : `宴请${String(i).padStart(3, '0')}`, status: i % 2 ? 'completed' : 'open', storedStatus: i % 2 ? 'completed' : 'open', eventAt: null, expiresAt: '2099-01-01T00:00:00.000Z', shareUrl: `https://example.test/guest-order/token${i}`, supportsConditionalSession: true, editVersion: { revision: `v${i}`, updatedAt: '2026-10-29T00:00:00.000Z' }, guestCount: i, totalQuantity: i }))
    items[38].expiresAt = new Date(initialTime.getTime() + 5000).toISOString()
    let slowStarted; const slowRequest = new Promise(resolve => { slowStarted = resolve })
    let malformed = false; let truncated = false; let failCapabilities = false; let invalidCounts = false; let invalidStatus = ''; let serverExpired = false
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const pathname = url.pathname.replace(/^\/api/, '')
      if (pathname === '/guest-orders/capabilities') return failCapabilities ? route.fulfill({ status: 503, json: { error: '能力暂不可用' } }) : route.fulfill({ json: { householdId: home, supportsConditionalSession: true, supportsIdempotentSessionCreate: true, supportsSessionPagination: true } })
      if (pathname === '/guest-orders') {
        const pageNumber = Number(url.searchParams.get('page')); const limit = Number(url.searchParams.get('limit')); const search = url.searchParams.get('search') || ''; const status = url.searchParams.get('status') || ''
        assert.equal(limit, 12)
        if (search === '延迟') { slowStarted(); await new Promise(resolve => setTimeout(resolve, 1200)) }
        const filtered = items.map(item => serverExpired && item.id === items[38].id ? { ...item, status: 'expired' } : item).filter(item => item.title.includes(search) && (!status || item.status === status))
        const pagination = { page: pageNumber, limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) }
        if (malformed) pagination.totalPages = 999
        const sessions = truncated ? [] : filtered.slice((pageNumber - 1) * limit, pageNumber * limit)
        if (invalidCounts && sessions.length) sessions[0] = { ...sessions[0], totalQuantity: undefined }
        if (invalidStatus && sessions.length) sessions[0] = { ...sessions[0], status: invalidStatus }
        return route.fulfill({ json: { householdId: home, pagination, sessions } })
      }
      const selected = items.find(item => pathname.endsWith(item.id))
      return route.fulfill({ json: { session: { ...selected, summary: { guestCount: 0, totalQuantity: 0, dishes: [] }, orders: [] } } })
    })
    await page.goto(`${base}/guest-orders`)
    await page.getByText('41 场', { exact: true }).waitFor()
    assert.equal(await page.locator('.session-card').count(), 12)
    assert.equal(await page.getByText('第 1 / 4 页').count(), 2)
    if (process.env.EATWHAT_GUEST_HOST_LIST_SHOT) await page.screenshot({ path: process.env.EATWHAT_GUEST_HOST_LIST_SHOT })
    await page.getByRole('button', { name: '下一页（顶部）' }).click()
    await page.getByText('第 2 / 4 页').first().waitFor()
    await page.getByRole('heading', { name: '宴请012' }).waitFor()
    const search = page.getByRole('textbox', { name: '搜索宴请名称' })
    await search.fill('宴请039')
    await page.getByRole('heading', { name: '宴请039' }).waitFor()
    assert.equal(await page.locator('.session-card').count(), 1)
    await page.locator('.session-card').getByRole('button', { name: '查看详情' }).click()
    const dialog = page.getByRole('dialog', { name: '宴请详情' })
    await dialog.getByRole('heading', { name: '宴请039' }).waitFor()
    await dialog.locator('.el-dialog__headerbtn').click()
    await search.fill('延迟')
    await slowRequest
    await search.fill('宴请039')
    await page.getByRole('heading', { name: '宴请039' }).waitFor()
    await page.waitForTimeout(1500)
    assert.equal(await page.getByRole('heading', { name: '延迟旧宴请' }).count(), 0, 'stale results must not replace the latest search')
    await search.fill('')
    await page.getByText('41 场', { exact: true }).waitFor()
    await page.getByRole('combobox', { name: '筛选宴请状态' }).focus()
    await page.getByRole('combobox', { name: '筛选宴请状态' }).press('Enter')
    await page.getByRole('option', { name: '已完成', exact: true }).click()
    await page.getByText('20 场', { exact: true }).waitFor()
    assert.ok(await page.locator('.session-card').count() <= 12)
    await page.getByRole('button', { name: '清除筛选' }).click()
    await page.getByText('41 场', { exact: true }).waitFor()
    await search.fill('宴请038')
    const expiringCard = page.locator('.session-card').filter({ hasText: '宴请038' })
    await expiringCard.getByText('正在点菜', { exact: true }).waitFor()
    await page.clock.setFixedTime(new Date(initialTime.getTime() + 6000))
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await expiringCard.getByText('链接已过期', { exact: true }).waitFor()
    const expiryNotice = page.getByRole('status').filter({ hasText: '分页和筛选结果可能已变化' })
    await expiryNotice.waitFor()
    for (const width of [320, 1280]) for (const dark of [false, true]) for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
      await page.setViewportSize({ width, height: 844 })
      await page.evaluate(({ dark, theme }) => { document.documentElement.classList.toggle('dark', dark); document.querySelector('.app-container').classList.toggle('dark-mode', dark); document.documentElement.dataset.theme = theme }, { dark, theme })
      for (const selector of ['.expiry-notice span', '.expiry-notice button']) assert.ok((await contrast(page, selector)).ratio >= 4.5, `${width} ${dark} ${theme} ${selector}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    serverExpired = true
    await expiryNotice.getByRole('button', { name: '刷新宴请列表' }).focus()
    await page.keyboard.press('Enter')
    await expiryNotice.waitFor({ state: 'hidden' })
    await expiringCard.getByText('链接已过期', { exact: true }).waitFor()
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === '刷新')
    malformed = true
    await search.fill('宴请039')
    await page.getByText('宴请分页数据不完整，请重试', { exact: false }).waitFor()
    assert.equal(await page.locator('.session-card').count(), 0, 'malformed pagination must not display stale records')
    malformed = false; truncated = true
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('宴请列表可能已变化，请重新加载', { exact: false }).waitFor()
    assert.equal(await page.locator('.session-card').count(), 0, 'a partial response must not masquerade as an empty result')
    truncated = false; invalidCounts = true
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('宴请列表统计不完整').waitFor()
    assert.equal(await page.locator('.session-card').count(), 0, 'missing counts must not appear as zero')
    invalidCounts = false
    for (const status of ['constructor', '__proto__', 'unknown']) {
      invalidStatus = status
      await page.getByRole('button', { name: '重新加载' }).click()
      await page.getByText('宴请数据不完整').waitFor()
      assert.equal(await page.locator('.session-card').count(), 0, `invalid status ${status} must not render as a valid session`)
    }
    invalidStatus = ''; failCapabilities = true
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.getByText('无法确认宴请列表范围，请重试', { exact: false }).waitFor()
    assert.equal(await page.locator('.session-card').count(), 0, 'unconfirmed capability must not misrepresent a partial page as complete')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    await page.close()

    const legacy = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await legacy.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ householdId: 'home-a' })) })
    await legacy.route('**/api/**', route => route.request().url().includes('/capabilities') ? route.fulfill({ status: 404, json: { error: '旧服务' } }) : route.fulfill({ json: { sessions: items.slice(0, 30) } }))
    await legacy.route('**/api/auth/household-scope', route => route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } }))
    await legacy.goto(`${base}/guest-orders`)
    await legacy.getByText('当前服务器仅提供最近 30 场宴请', { exact: false }).waitFor()
    await legacy.getByRole('textbox', { name: '搜索宴请名称' }).fill('宴请029')
    await legacy.getByRole('heading', { name: '宴请029' }).waitFor()
    assert.equal(await legacy.locator('.session-card').count(), 1)
    assert.equal(await legacy.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await legacy.close()
    console.log('Guest host list workflows passed: pagination, filters, stale responses, malformed data and legacy guard')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
