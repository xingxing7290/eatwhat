const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Guest host tests require a local test server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    page.on('dialog', dialog => dialog.accept())
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test', householdId: 'home-a' })) })
    const home = '111111111111111111111111'; const id = '222222222222222222222222'; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    let current = null; let firstPayload; let createCount = 0; let createRequests = 0; let rotateRequests = 0; let detailMissing = false; let badSummary = ''
    const version = value => ({ revision: `v${value}`, updatedAt: `2026-10-29T00:00:0${value}.000Z` })
    const detail = () => ({ ...current, summary: { guestCount: 1, totalQuantity: 2, dishes: [{ mealId: 'meal', name: '客人想吃的菜', quantity: 2, guestNames: ['测试客人'], notes: ['测试客人：少盐'] }] }, orders: [{ id: 'order-1', guestName: '测试客人', submittedAt: '2026-10-29T12:00:00Z', items: [{ name: '客人想吃的菜', quantity: 2, note: '少盐' }], note: '整单备注' }] })
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const pathname = url.pathname.replace(/^\/api/, '')
      if (req.method() === 'GET' && pathname === '/guest-orders/capabilities') return route.fulfill({ json: { householdId: home, supportsConditionalSession: true, supportsIdempotentSessionCreate: true } })
      if (req.method() === 'GET' && pathname === '/guest-orders') return route.fulfill({ json: { sessions: current ? [{ ...current, guestCount: 1, totalQuantity: 2 }] : [] } })
      if (req.method() === 'GET' && pathname === `/guest-orders/${id}`) {
        if (detailMissing) return route.fulfill({ status: 404, json: { code: 'GUEST_SESSION_NOT_FOUND', error: '未找到宴请' } })
        const session = detail()
        if (badSummary === 'missing') delete session.summary.guestCount
        if (badSummary === 'mismatch') session.summary.totalQuantity = 3
        if (badSummary === 'fractional') session.orders[0].items[0].quantity = 1.5
        return route.fulfill({ json: { session } })
      }
      if (req.method() === 'POST' && pathname === '/guest-orders/idempotent') {
        const payload = req.postDataJSON(); createRequests++
        assert.equal(payload.expectedHouseholdId, home); assert.match(payload.creationKey, /^[A-Za-z0-9_-]{43}$/)
        if (!firstPayload) {
          firstPayload = payload; createCount++
          current = { id, householdId: home, title: payload.title, eventAt: payload.eventAt, expiresAt: payload.expiresAt, status: 'open', storedStatus: 'open', shareUrl: 'https://example.test/guest-order/old-private-token', supportsConditionalSession: true, editVersion: version(1) }
          return route.fulfill({ status: 503, json: { error: '模拟响应丢失' } })
        }
        assert.deepEqual(payload, firstPayload, 'recovery must reuse the original creation key and payload')
        return route.fulfill({ json: { session: detail(), replayed: true } })
      }
      if (req.method() === 'PATCH' && pathname === `/guest-orders/${id}`) {
        const payload = req.postDataJSON()
        if (payload.expectedEditVersion.revision !== current.editVersion.revision) return route.fulfill({ status: 409, json: { code: 'GUEST_SESSION_CONFLICT', error: '宴请已变化' } })
        current = { ...current, ...('title' in payload ? { title: payload.title, eventAt: payload.eventAt } : {}), ...('status' in payload ? { status: payload.status, storedStatus: payload.status } : {}), editVersion: version(3) }
        return route.fulfill({ json: { session: detail() } })
      }
      if (req.method() === 'POST' && pathname === `/guest-orders/${id}/rotate-link`) {
        rotateRequests++; assert.equal(req.postDataJSON().expectedEditVersion.revision, current.editVersion.revision)
        current = { ...current, shareUrl: 'https://example.test/guest-order/new-private-token', editVersion: version(4) }
        return route.fulfill({ status: 503, json: { error: '响应丢失' } })
      }
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/guest-orders`)
    await page.getByRole('heading', { name: '邀请大家，点一桌好菜' }).waitFor()
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    await page.getByRole('link', { name: '宴请点菜' }).waitFor()
    await page.locator('.mobile-nav-header').getByRole('button', { name: '关闭导航菜单' }).click()
    await page.getByRole('button', { name: '创建第一场宴请' }).click()
    const create = page.getByRole('dialog', { name: '创建宴请' })
    await create.getByPlaceholder('例如：周末家庭聚餐').fill('周末小聚')
    await create.getByRole('button', { name: '创建并查看链接' }).click()
    await create.getByText('创建结果待核对', { exact: false }).waitFor()
    assert.equal(createCount, 1)
    await page.reload()
    await page.getByText('有一份宴请的创建结果待核对', { exact: false }).waitFor()
    await page.getByRole('button', { name: '安全重试', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '宴请详情' })
    await dialog.getByRole('heading', { name: '周末小聚' }).waitFor()
    assert.equal(createRequests, 2); assert.equal(createCount, 1)
    assert.equal(await page.evaluate(key => sessionStorage.getItem(key), `eatwhat.hostGuest.create.${home}`), null)
    await dialog.getByText('客人想吃的菜', { exact: true }).first().waitFor()
    await dialog.getByText('1 份点菜单 · 2 份菜').waitFor()
    for (const fault of ['missing', 'mismatch', 'fractional']) {
      badSummary = fault
      await dialog.getByRole('button', { name: '刷新点菜' }).click()
      await dialog.getByText(fault === 'mismatch' ? '点菜汇总与客人点菜单不一致' : '点菜汇总数据不完整', { exact: false }).waitFor()
      await dialog.getByText('以下是上次成功加载的内容，可能已过期', { exact: false }).waitFor()
      assert.equal(await dialog.getByRole('button', { name: '复制链接' }).isDisabled(), true)
      badSummary = ''
      await dialog.getByRole('button', { name: '重试', exact: true }).click()
      await dialog.getByText('以下是上次成功加载的内容，可能已过期', { exact: false }).waitFor({ state: 'hidden' })
    }
    await dialog.getByRole('button', { name: '编辑信息' }).click()
    const edit = dialog.locator('.edit-panel input').first()
    await edit.fill('本页的宴请草稿')
    current = { ...current, title: '家人更新的名称', editVersion: version(2) }
    await dialog.getByRole('button', { name: '保存信息' }).click()
    await dialog.getByText('其他成员已修改宴请', { exact: false }).waitFor()
    assert.equal(await edit.inputValue(), '本页的宴请草稿')
    await dialog.getByRole('button', { name: '读取最新状态' }).click()
    await dialog.getByRole('heading', { name: '家人更新的名称' }).waitFor()
    assert.equal(await edit.inputValue(), '本页的宴请草稿')
    await dialog.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    await dialog.getByRole('button', { name: '保存信息' }).click()
    await dialog.getByRole('heading', { name: '本页的宴请草稿' }).waitFor()
    await dialog.getByRole('button', { name: '更换链接' }).click()
    await page.getByRole('button', { name: '确认更换' }).click()
    await dialog.getByText('链接更换结果未确认', { exact: false }).waitFor()
    assert.equal(await dialog.getByRole('button', { name: '复制链接' }).isDisabled(), true)
    await dialog.getByRole('button', { name: '读取最新状态' }).click()
    await dialog.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    await page.getByRole('dialog', { name: '结束核对？' }).waitFor({ state: 'hidden' })
    assert.equal(await dialog.getByRole('textbox', { name: '客人点菜链接' }).inputValue(), current.shareUrl)
    assert.equal(rotateRequests, 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    const logs = await page.evaluate(async () => JSON.stringify((await import('/src/services/api.js')).apiLogs.history))
    assert.equal(logs.includes(firstPayload.creationKey), false, 'creation capability must not enter the API log')
    assert.equal(logs.includes('private-token'), false, 'guest links must not enter the API log')
    if (process.env.EATWHAT_GUEST_HOST_SHOT) await page.screenshot({ path: process.env.EATWHAT_GUEST_HOST_SHOT })
    await dialog.getByRole('button', { name: '编辑信息' }).click()
    const retainedEdit = dialog.locator('.edit-panel input').first()
    await retainedEdit.fill('找不到宴请时仍保留草稿')
    current = { ...current, editVersion: version(5) }
    await dialog.getByRole('button', { name: '保存信息' }).click()
    await dialog.getByText('其他成员已修改宴请', { exact: false }).waitFor()
    detailMissing = true
    await dialog.getByRole('button', { name: '读取最新状态' }).click()
    await dialog.getByText('当前家庭未找到该宴请', { exact: false }).waitFor()
    assert.equal(await retainedEdit.inputValue(), '找不到宴请时仍保留草稿')
    await dialog.getByRole('button', { name: '已核对，继续' }).click()
    await page.getByRole('button', { name: '已核对，继续', exact: true }).last().click()
    assert.equal(await retainedEdit.inputValue(), '找不到宴请时仍保留草稿')
    assert.deepEqual(errors, [])
    await page.close()
    const legacy = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await legacy.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ householdId: 'home-a' })) })
    await legacy.route('**/api/**', route => route.request().url().endsWith('/guest-orders/capabilities') ? route.fulfill({ status: 404, json: { error: '未找到' } }) : route.fulfill({ json: { sessions: [] } }))
    await legacy.route('**/api/auth/household-scope', route => route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } }))
    await legacy.goto(`${base}/guest-orders`)
    await legacy.getByText('服务器未提供安全宴请能力', { exact: false }).waitFor()
    await legacy.getByRole('button', { name: '更多功能' }).click()
    await legacy.getByRole('link', { name: '宴请点菜' }).waitFor()
    assert.equal(await legacy.getByRole('button', { name: '创建第一场宴请' }).isDisabled(), true)
    await legacy.close()
    const expiredPage = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await expiredPage.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ householdId: 'home-a' })) })
    const expired = { ...current, title: '过期的锁单宴请', status: 'locked', storedStatus: 'locked', expiresAt: '2020-01-01T00:00:00.000Z' }
    await expiredPage.route('**/api/**', route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '')
      if (pathname === '/guest-orders/capabilities') return route.fulfill({ json: { householdId: home, supportsConditionalSession: true, supportsIdempotentSessionCreate: true } })
      if (pathname === '/guest-orders') return route.fulfill({ json: { sessions: [{ ...expired, guestCount: 0, totalQuantity: 0 }] } })
      return route.fulfill({ json: { session: { ...expired, summary: { guestCount: 0, totalQuantity: 0, dishes: [] }, orders: [] } } })
    })
    await expiredPage.goto(`${base}/guest-orders`)
    await expiredPage.getByRole('button', { name: '查看详情' }).click()
    const expiredDialog = expiredPage.getByRole('dialog', { name: '宴请详情' })
    await expiredDialog.getByText('链接已过期，不能重新开放或更换。').waitFor()
    assert.equal(await expiredDialog.getByRole('button', { name: '继续点菜' }).isDisabled(), true)
    assert.equal(await expiredDialog.getByRole('button', { name: '更换链接' }).isDisabled(), true)
    assert.equal(await expiredDialog.getByRole('button', { name: '标记完成' }).isEnabled(), true)
    assert.equal(await expiredPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await expiredPage.close()
    console.log('Guest host workflows passed: safe creation, draft conflicts, link review, privacy and legacy guard')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
