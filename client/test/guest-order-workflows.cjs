const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

async function main () {
  const html = fs.readFileSync(path.join(__dirname, '../../server/public/guest-order.html'))
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html) })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const meals = [{ _id: 'a', name: '测试面条', category: '主食' }, { _id: 'b', name: '测试青菜', category: '素菜' }]
    const session = { title: '测试宴请', householdName: '测试家庭', status: 'open', canOrder: true }
    let activeMeals = meals; let mode = 'unavailable'; let orderReads = 0; let writes = 0; let failRead = false; let malformedRead = false; let acceptConfirm = true
    page.on('dialog', dialog => acceptConfirm ? dialog.accept() : dialog.dismiss())
    await page.route('**/guest-orders/public/**', async route => {
      const req = route.request(); const url = new URL(req.url())
      if (req.method() === 'GET' && url.pathname.endsWith('/orders/access')) {
        orderReads++
        if (failRead) return route.fulfill({ status: 503, json: { error: '暂时读取失败' } })
        if (malformedRead) return route.fulfill({ json: { order: {} } })
        return route.fulfill({ json: { order: { revision: 2, guestName: '服务端访客', note: '服务端整单备注', items: [{ mealId: 'b', name: '测试青菜', quantity: 2, note: '服务端菜品备注' }] } } })
      }
      if (req.method() === 'GET') return route.fulfill({ json: url.searchParams.has('statusOnly') ? { session } : { session, meals: activeMeals } })
      writes++
      if (mode === 'unavailable') { activeMeals = [meals[1]]; return route.fulfill({ status: 409, json: { code: 'GUEST_MEAL_UNAVAILABLE', error: '部分菜品已下架或不可用，请核对点菜单', unavailableIds: ['a'] } }) }
      if (mode === 'conflict') return route.fulfill({ status: 409, json: { code: 'GUEST_ORDER_CONFLICT', error: '该订单版本已变化' } })
      if (mode === 'legacy-conflict') return route.fulfill({ status: 409, json: { error: '订单已在其他设备更新，请刷新后重试' } })
      if (mode === 'uncertain') return route.fulfill({ status: 503, json: { error: '响应暂时不可用' } })
      if (mode === 'malformed') return route.fulfill({ json: {} })
      const body = req.postDataJSON()
      if (['mismatch', 'stale-revision', 'wrong-meal', 'wrong-quantity'].includes(mode)) return route.fulfill({ json: { order: { revision: mode === 'stale-revision' ? body.revision : body.revision + 1, guestName: body.guestName, note: mode === 'mismatch' ? '不同的备注' : body.note, items: body.items.map(item => ({ ...item, ...(mode === 'wrong-meal' ? { mealId: 'other' } : {}), ...(mode === 'wrong-quantity' ? { quantity: item.quantity + 1 } : {}) })) } } })
      return route.fulfill({ status: 201, json: { accessToken: 'access', order: { revision: 1, guestName: body.guestName, note: body.note, items: body.items.map(item => ({ ...item, name: meals.find(meal => meal._id === item.mealId)?.name })) } } })
    })
    await page.goto(`http://127.0.0.1:${server.address().port}/guest-order/local-test`)
    assert.ok(await page.locator('#toast').evaluate(node => parseFloat(getComputedStyle(node).transitionDuration)) < 0.001, 'guest page should respect reduced motion')
    const guestMotion = await page.evaluate(() => {
      const node = document.createElement('div')
      node.style.cssText = 'animation: test-motion 2s 3s infinite; transition: opacity 2s 4s'
      document.body.appendChild(node)
      const style = getComputedStyle(node)
      const result = [style.animationDuration, style.animationDelay, style.animationIterationCount, style.transitionDuration, style.transitionDelay]
      node.remove(); return result
    })
    assert.deepEqual(guestMotion, ['1e-05s', '0s', '1', '1e-05s', '0s'], 'guest reduced motion must remove delays and looping')
    const card = name => page.locator('.meal').filter({ hasText: name })
    assert.equal(await page.getByText('左右滑动或使用 Tab 查看更多分类').isVisible(), false, 'short category lists do not need a scroll hint')
    const unloadBlocked = () => page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true })))
    assert.equal(await unloadBlocked(), false, 'an untouched page should not warn on exit')
    await card('测试面条').getByRole('button', { name: '＋ 想吃' }).click()
    const filters = page.getByRole('group', { name: '菜品分类' })
    await filters.getByRole('button', { name: '主食 1', exact: true }).click()
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('青菜')
    await filters.getByRole('button', { name: '全部 1', exact: true }).waitFor()
    assert.equal(await filters.getByRole('button', { name: '主食 0', exact: true }).getAttribute('aria-pressed'), 'true')
    await filters.getByRole('button', { name: '素菜 1', exact: true }).waitFor()
    assert.match(await page.locator('.cart-copy').innerText(), /已选 1 道菜/)
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('')
    await filters.getByRole('button', { name: '全部 2', exact: true }).click()
    await page.getByText('每道菜最多选择 20 份', { exact: false }).waitFor()
    for (let i = 1; i < 19; i++) await card('测试面条').getByRole('button', { name: '增加测试面条' }).click()
    await card('测试面条').getByRole('button', { name: '增加测试面条' }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await card('测试面条').getByRole('button', { name: '增加测试面条' }).isDisabled(), true)
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '减少测试面条')
    assert.equal(await card('测试面条').getByRole('button', { name: '增加测试面条' }).getAttribute('title'), '每道菜最多 20 份')
    await page.getByRole('button', { name: '查看点菜单' }).click()
    assert.equal(await page.locator('.cart-row').getByRole('button', { name: '增加测试面条' }).isDisabled(), true)
    for (let i = 20; i > 1; i--) await page.locator('.cart-row').getByRole('button', { name: '减少测试面条' }).click()
    await page.getByRole('button', { name: '继续选菜' }).click()
    assert.equal(await unloadBlocked(), true, 'an unsubmitted selection should warn on exit')
    assert.match(await page.locator('#cartHint').innerText(), /尚未提交/)
    await card('测试青菜').getByRole('button', { name: '＋ 想吃' }).click()
    await page.getByRole('button', { name: '查看点菜单' }).click()
    await page.locator('#guestName').fill('测试访客')
    await page.locator('#orderNote').fill('保留整单备注')
    await page.locator('.cart-row').filter({ hasText: '测试面条' }).locator('.item-note').fill('保留菜品备注')
    await page.getByRole('button', { name: '提交给主人' }).click()
    await page.getByText('部分菜品已下架或不可用。你的选择和备注仍保留', { exact: false }).waitFor()
    if (process.env.EATWHAT_GUEST_ORDER_SHOT) await page.screenshot({ path: process.env.EATWHAT_GUEST_ORDER_SHOT })
    assert.equal(await page.locator('#orderNote').inputValue(), '保留整单备注')
    assert.equal(await page.locator('.cart-row').filter({ hasText: '测试面条' }).locator('.item-note').inputValue(), '保留菜品备注')
    assert.equal(await card('测试面条').count(), 0, 'refreshed menu hides the archived dish')
    await page.getByRole('button', { name: '移除测试面条' }).click()
    mode = 'success'
    await page.getByRole('button', { name: '提交给主人' }).click()
    await page.getByText('上次的点菜单已提交给主人', { exact: false }).waitFor()
    assert.match(await page.locator('#cartHint').innerText(), /已提交/)
    assert.equal(await unloadBlocked(), false, 'a confirmed unchanged order should not warn on exit')
    await page.locator('#orderNote').fill('本页尚未保存的备注')
    assert.match(await page.locator('#cartHint').innerText(), /修改尚未保存/)
    assert.equal(await unloadBlocked(), true, 'an edited submitted order should warn on exit')
    await page.locator('#orderNote').fill('保留整单备注')
    assert.equal(await unloadBlocked(), false, 'reverting to the submitted version clears the warning')
    await page.locator('#orderNote').fill('本页尚未保存的备注')
    await page.locator('.cart-row').filter({ hasText: '测试青菜' }).locator('.item-note').fill('本页菜品备注')
    for (const fault of ['mismatch', 'stale-revision', 'wrong-meal', 'wrong-quantity']) {
      mode = fault
      await page.getByRole('button', { name: '保存修改' }).click()
      await page.getByText('提交结果尚未确认', { exact: false }).waitFor()
      assert.equal(await page.locator('#orderNote').inputValue(), '本页尚未保存的备注')
      assert.equal(await page.getByRole('button', { name: '保存修改' }).isDisabled(), true)
      await page.getByRole('button', { name: '已核对，继续' }).click()
    }
    mode = 'conflict'
    await page.getByRole('button', { name: '保存修改' }).click()
    await page.getByText('订单已在其他设备更新，本页修改仍保留', { exact: false }).waitFor()
    assert.equal(orderReads, 0, 'conflict must not silently reload and replace the draft')
    assert.equal(await page.locator('#orderNote').inputValue(), '本页尚未保存的备注')
    assert.equal(await page.locator('.item-note').inputValue(), '本页菜品备注')
    assert.equal(await page.getByRole('button', { name: '保存修改' }).isDisabled(), true)
    acceptConfirm = false
    await page.getByRole('button', { name: '载入最新订单' }).click()
    assert.equal(orderReads, 0)
    acceptConfirm = true; failRead = true
    await page.getByRole('button', { name: '载入最新订单' }).click()
    await page.getByText('暂时读取失败', { exact: true }).waitFor()
    assert.equal(await page.locator('#orderNote').inputValue(), '本页尚未保存的备注')
    failRead = false; malformedRead = true
    await page.getByRole('button', { name: '载入最新订单' }).click()
    await page.getByText('订单数据不完整，请稍后重试', { exact: true }).waitFor()
    assert.equal(await page.locator('#orderNote').inputValue(), '本页尚未保存的备注')
    malformedRead = false
    await page.getByRole('button', { name: '载入最新订单' }).click()
    await page.waitForFunction(() => document.querySelector('#orderNote').value === '服务端整单备注')
    assert.equal(await page.locator('.item-note').inputValue(), '服务端菜品备注')
    await page.locator('#orderNote').fill('旧版服务冲突草稿')
    mode = 'legacy-conflict'
    await page.getByRole('button', { name: '保存修改' }).click()
    await page.getByText('订单已在其他设备更新，本页修改仍保留', { exact: false }).waitFor()
    assert.equal(await page.locator('#orderNote').inputValue(), '旧版服务冲突草稿')
    await page.getByRole('button', { name: '载入最新订单' }).click()
    await page.waitForFunction(() => document.querySelector('#orderNote').value === '服务端整单备注')
    await page.locator('#orderNote').fill('不确定结果时保留')
    mode = 'uncertain'
    await page.getByRole('button', { name: '保存修改' }).click()
    await page.getByText('提交结果尚未确认', { exact: false }).waitFor()
    assert.equal(await page.locator('#orderNote').inputValue(), '不确定结果时保留')
    assert.equal(await page.getByRole('button', { name: '保存修改' }).isDisabled(), true)
    await page.getByRole('button', { name: '已核对，继续' }).click()
    mode = 'malformed'
    await page.getByRole('button', { name: '保存修改' }).click()
    await page.getByText('提交结果尚未确认', { exact: false }).waitFor()
    assert.equal(await page.locator('#orderNote').inputValue(), '不确定结果时保留')
    failRead = true
    await page.reload()
    await page.getByRole('button', { name: '查看 / 核对' }).click()
    await page.getByText('提交结果尚未确认', { exact: false }).waitFor()
    const beforeAck = writes
    await page.getByRole('button', { name: '已核对，继续' }).click()
    assert.equal(writes, beforeAck, 'acknowledgement must not submit an order')
    await page.getByRole('button', { name: '继续选菜' }).click()
    await card('测试青菜').getByRole('button', { name: '＋ 想吃' }).click()
    await page.getByRole('button', { name: '查看 / 核对' }).click()
    await page.getByText('暂时无法读取之前提交的订单', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '提交给主人' }).isDisabled(), true, 'an unread existing order must not create a duplicate')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    for (const closedMode of ['coded', 'legacy']) {
      const closedPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
      let closedWrites = 0; let statusReads = 0; let releaseOldStatus; let announceStatus
      const oldStatusStarted = new Promise(resolve => { announceStatus = resolve })
      await closedPage.addInitScript(() => {
        const original = window.setInterval
        window.setInterval = (fn, delay, ...args) => delay === 15000 ? (window.__testStatusPoll = fn, 0) : original(fn, delay, ...args)
      })
      await closedPage.route('**/guest-orders/public/**', async route => {
        const req = route.request(); const url = new URL(req.url())
        if (req.method() === 'GET' && url.searchParams.has('statusOnly')) {
          statusReads++
          if (closedMode === 'coded' && statusReads === 1) { announceStatus(); await new Promise(resolve => { releaseOldStatus = resolve }); return route.fulfill({ json: { session: { status: 'open', canOrder: true } } }) }
          return route.fulfill({ status: 503, json: { error: '状态暂不可用' } })
        }
        if (req.method() === 'GET') return route.fulfill({ json: { session: { title: '测试宴请', status: 'open', canOrder: true }, meals: [meals[1]] } })
        closedWrites++
        return route.fulfill({ status: 409, json: closedMode === 'coded' ? { code: 'GUEST_SESSION_CLOSED', error: '本次暂不接收点单' } : { error: '本次点菜已经锁单或结束' } })
      })
      await closedPage.goto(`http://127.0.0.1:${server.address().port}/guest-order/closed-${closedMode}`)
      await closedPage.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
      await closedPage.getByRole('button', { name: '查看点菜单' }).click()
      await closedPage.locator('#guestName').fill('客人草稿')
      await closedPage.locator('#orderNote').fill('少辣的备注')
      if (closedMode === 'coded') { await closedPage.evaluate(() => { void window.__testStatusPoll() }); await oldStatusStarted }
      await closedPage.getByRole('button', { name: '提交给主人' }).click()
      await closedPage.getByText('主人暂不接收新点单', { exact: false }).first().waitFor()
      if (closedMode === 'coded') {
        const staleResponse = closedPage.waitForResponse(response => response.url().includes('statusOnly=1') && response.status() === 200)
        releaseOldStatus(); await staleResponse; await closedPage.waitForTimeout(100)
      }
      assert.equal(await closedPage.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
      assert.equal(await closedPage.locator('#guestName').inputValue(), '客人草稿')
      assert.equal(await closedPage.locator('#orderNote').inputValue(), '少辣的备注')
      assert.equal(closedWrites, 1)
      await closedPage.close()
    }
    const delayedMenu = await browser.newPage({ viewport: { width: 390, height: 844 } })
    let releaseMenu; let announceMenu
    const menuStarted = new Promise(resolve => { announceMenu = resolve })
    const manyMeals = Array.from({ length: 25 }, (_, index) => ({ _id: `menu-${index}`, name: `选菜${index}`, category: '主食' }))
    await delayedMenu.route('**/guest-orders/public/**', async route => {
      const req = route.request(); const url = new URL(req.url())
      if (req.method() === 'GET' && url.searchParams.has('statusOnly')) return route.fulfill({ status: 503, json: { error: '状态暂不可用' } })
      if (req.method() === 'GET') {
        const pageNumber = Number(url.searchParams.get('page') || 1)
        if (pageNumber === 2) { announceMenu(); await new Promise(resolve => { releaseMenu = resolve }) }
        return route.fulfill({ json: { session: { title: '测试宴请', status: 'open', canOrder: true, supportsGuestMenuPagination: true }, meals: manyMeals.slice((pageNumber - 1) * 24, pageNumber * 24), menu: { page: pageNumber, limit: 24, total: 25, totalPages: 2, categories: [{ name: '主食', count: 25 }] } } })
      }
      return route.fulfill({ status: 409, json: { code: 'GUEST_SESSION_CLOSED', error: '本次暂不接收点单' } })
    })
    await delayedMenu.goto(`http://127.0.0.1:${server.address().port}/guest-order/delayed-menu`)
    await delayedMenu.locator('.meal').filter({ hasText: '选菜0' }).getByRole('button', { name: '＋ 想吃' }).click()
    await delayedMenu.getByRole('button', { name: '下一页（顶部）' }).click()
    await menuStarted
    await delayedMenu.getByRole('button', { name: '查看点菜单' }).click()
    await delayedMenu.locator('#guestName').fill('客人草稿')
    await delayedMenu.locator('#orderNote').fill('保留的备注')
    await delayedMenu.getByRole('button', { name: '提交给主人' }).click()
    await delayedMenu.getByText('主人暂不接收新点单', { exact: false }).first().waitFor()
    const oldMenuResponse = delayedMenu.waitForResponse(response => response.url().includes('page=2') && response.status() === 200)
    releaseMenu(); await oldMenuResponse
    await delayedMenu.waitForFunction(() => document.querySelector('#mealGrid').getAttribute('aria-busy') === 'false')
    assert.equal(await delayedMenu.getByRole('button', { name: '提交给主人' }).isDisabled(), true, 'a late menu must not reopen a rejected session')
    assert.equal(await delayedMenu.locator('#orderNote').inputValue(), '保留的备注')
    await delayedMenu.close()
    const blockedStorage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await blockedStorage.addInitScript(() => {
      window.__blockGuestStorage = true
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (window.__blockGuestStorage && this === localStorage && key.startsWith('eatwhat.guestOrder.')) throw new DOMException('blocked', 'SecurityError')
        return original.call(this, key, value)
      }
    })
    const methods = []
    await blockedStorage.route('**/guest-orders/public/**', async route => {
      const req = route.request(); methods.push(req.method())
      if (req.method() === 'GET') return route.fulfill({ json: { session, meals: [meals[1]] } })
      return route.fulfill({ status: 200, json: { accessToken: 'access', order: { revision: req.method() === 'POST' ? 1 : 2, guestName: '测试访客', items: [{ mealId: 'b', name: '测试青菜', quantity: 1 }] } } })
    })
    await blockedStorage.goto(`http://127.0.0.1:${server.address().port}/guest-order/storage-blocked`)
    await blockedStorage.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
    await blockedStorage.getByRole('button', { name: '查看点菜单' }).click()
    await blockedStorage.locator('#guestName').fill('测试访客')
    await blockedStorage.getByRole('button', { name: '提交给主人' }).click()
    await blockedStorage.getByText('本浏览器无法保存订单凭证', { exact: false }).waitFor()
    assert.equal(await blockedStorage.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true, 'an unsaved access credential must warn before leaving')
    await blockedStorage.getByRole('button', { name: '保存修改' }).click()
    await blockedStorage.waitForFunction(() => document.querySelector('#submitOrder').textContent === '保存修改' && !document.querySelector('#submitOrder').disabled)
    assert.deepEqual(methods.filter(method => method !== 'GET'), ['POST', 'PUT'], 'blocked local storage must not cause a duplicate create')
    assert.equal(await blockedStorage.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true, 'the warning remains while the browser cannot retain the credential')
    await blockedStorage.getByRole('button', { name: '重新保存凭证' }).click()
    await blockedStorage.getByText('仍无法保存凭证', { exact: false }).waitFor()
    assert.deepEqual(methods.filter(method => method !== 'GET'), ['POST', 'PUT'], 'retrying storage must not send an order')
    await blockedStorage.evaluate(() => { window.__blockGuestStorage = false })
    await blockedStorage.getByRole('button', { name: '重新保存凭证' }).click()
    await blockedStorage.getByText('订单凭证已保存在本浏览器').waitFor()
    assert.equal(await blockedStorage.evaluate(() => localStorage.getItem('eatwhat.guestOrder.storage-blocked')), 'access')
    assert.equal(await blockedStorage.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false)
    assert.deepEqual(methods.filter(method => method !== 'GET'), ['POST', 'PUT'], 'successful storage recovery must not resubmit')
    await blockedStorage.close()
    const safePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await safePage.addInitScript(() => {
      window.__blockGuestStorage = true
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (window.__blockGuestStorage && this === localStorage && key === 'eatwhat.guestOrder.safe-test') throw new DOMException('blocked', 'SecurityError')
        return original.call(this, key, value)
      }
    })
    const safeMeal = { _id: '123456789012345678901234', name: '安全提交测试菜', category: '家常菜' }
    const statusPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    let releaseStatus; let statusRequests = 0
    await statusPage.route('**/guest-orders/public/**', async route => {
      statusRequests++
      if (statusRequests === 1) { await new Promise(resolve => { releaseStatus = resolve }); return route.fulfill({ status: 503, json: { error: '离线' } }) }
      if (statusRequests === 2) return route.fulfill({ json: { session: { status: 'locked', canOrder: true }, meals: [safeMeal] } })
      if (statusRequests === 3) return route.fulfill({ json: { session: { status: 'open' }, meals: [safeMeal] } })
      if (statusRequests === 5) return route.fulfill({ json: { session: { status: 'locked', canOrder: true }, meals: [safeMeal] } })
      return route.fulfill({ json: { session: { ...session, supportsGuestMenuPagination: true }, meals: [safeMeal], menu: { page: 1, limit: 24, total: 1, totalPages: 1, categories: [{ name: '家常菜', count: 1 }] } } })
    })
    await statusPage.goto(`http://127.0.0.1:${server.address().port}/guest-order/status-test`)
    await statusPage.waitForFunction(() => document.querySelector('#status')?.textContent === '正在确认点菜状态')
    assert.equal(await statusPage.locator('#status').getAttribute('class'), 'pill', 'unconfirmed status must not look open')
    await statusPage.waitForFunction(() => document.querySelector('#mealGrid')?.getAttribute('aria-busy') === 'true')
    for (let i = 0; i < 100 && !releaseStatus; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof releaseStatus, 'function')
    releaseStatus()
    await statusPage.getByText('点菜状态暂未确认').waitFor()
    assert.equal(await statusPage.locator('#status').getAttribute('class'), 'pill')
    assert.equal(await statusPage.getByRole('button', { name: '查看点菜单' }).isDisabled(), true)
    for (const invalidStatus of ['contradictory', 'missing']) {
      const response = statusPage.waitForResponse(result => result.url().includes('/guest-orders/public/'))
      await statusPage.getByRole('button', { name: '重新加载菜单' }).click()
      await response
      await statusPage.getByText('点菜状态暂未确认').waitFor()
      assert.equal(await statusPage.locator('#status').getAttribute('class'), 'pill', `${invalidStatus} status must not appear open`)
      assert.equal(await statusPage.locator('.meal').count(), 0)
    }
    await statusPage.getByRole('button', { name: '重新加载菜单' }).click()
    await statusPage.getByText('● 正在点菜').waitFor()
    assert.match(await statusPage.locator('#status').getAttribute('class'), /open/)
    await statusPage.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
    await statusPage.getByLabel('搜索菜品').fill('安全')
    await statusPage.getByText('暂时无法更新点菜状态', { exact: false }).waitFor()
    assert.match(await statusPage.locator('#status').innerText(), /上次：.*正在点菜/)
    assert.match(await statusPage.locator('#cartTitle').innerText(), /已选 1 道菜/)
    await statusPage.getByRole('button', { name: '重新加载菜单' }).click()
    await statusPage.getByText('● 正在点菜', { exact: true }).waitFor()
    await statusPage.close()
    const staleStatus = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await staleStatus.addInitScript(() => {
      const original = window.setInterval
      window.setInterval = (fn, delay, ...args) => delay === 15000 ? (window.__testStatusPoll = fn, 0) : original(fn, delay, ...args)
    })
    let pollMode = 'offline'; let statusWrites = 0
    await staleStatus.route('**/guest-orders/public/**', route => {
      const req = route.request(); const url = new URL(req.url())
      if (req.method() !== 'GET') { statusWrites++; return route.fulfill({ status: 500 }) }
      if (!url.searchParams.has('statusOnly')) return route.fulfill({ json: { session, meals: [safeMeal] } })
      if (pollMode === 'offline') return route.fulfill({ status: 503 })
      if (pollMode === 'malformed') return route.fulfill({ json: { session: { status: 'open' } } })
      if (pollMode === 'contradictory') return route.fulfill({ json: { session: { status: 'locked', canOrder: true } } })
      return route.fulfill({ json: { session: { ...session, status: 'locked', canOrder: false } } })
    })
    await staleStatus.goto(`http://127.0.0.1:${server.address().port}/guest-order/status-refresh`)
    await staleStatus.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
    await staleStatus.evaluate(() => window.__testStatusPoll())
    await staleStatus.getByText('暂时无法更新点菜状态', { exact: false }).waitFor()
    assert.match(await staleStatus.locator('#status').innerText(), /上次：.*正在点菜/)
    assert.equal(await staleStatus.locator('#status').getAttribute('class'), 'pill')
    pollMode = 'malformed'
    const malformedStatus = staleStatus.waitForResponse(response => response.url().includes('statusOnly=1'))
    await staleStatus.getByRole('button', { name: '重新确认状态' }).click()
    await malformedStatus
    await staleStatus.getByText('暂时无法更新点菜状态', { exact: false }).waitFor()
    pollMode = 'contradictory'
    const contradictoryStatus = staleStatus.waitForResponse(response => response.url().includes('statusOnly=1'))
    await staleStatus.getByRole('button', { name: '重新确认状态' }).click()
    await contradictoryStatus
    await staleStatus.getByText('暂时无法更新点菜状态', { exact: false }).waitFor()
    pollMode = 'locked'
    await staleStatus.getByRole('button', { name: '重新确认状态' }).click()
    await staleStatus.getByText('主人已锁单', { exact: false }).waitFor()
    assert.equal(await staleStatus.locator('#statusWarning').isHidden(), true)
    assert.equal(await staleStatus.evaluate(() => document.activeElement.id), 'status')
    assert.match(await staleStatus.locator('#cartTitle').innerText(), /已选 1 道菜/)
    assert.equal(statusWrites, 0, 'status refresh must not submit the draft')
    await staleStatus.close()
    let safeRequests = 0; let logicalOrders = 0; let firstBody; let sessionOpen = true
    await safePage.route('**/guest-orders/public/**', async route => {
      const req = route.request()
      if (req.method() === 'GET') return route.fulfill({ json: { session: { ...session, status: sessionOpen ? 'open' : 'locked', canOrder: sessionOpen, supportsIdempotentCreate: true }, meals: [safeMeal] } })
      assert.ok(new URL(req.url()).pathname.endsWith('/orders/idempotent'), 'must never fall back to the legacy create endpoint')
      const body = req.postDataJSON(); safeRequests++
      assert.match(body.creationKey, /^[A-Za-z0-9_-]{43}$/)
      if (!firstBody) { firstBody = body; logicalOrders++; return route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
      assert.deepEqual(body, firstBody, 'retry must use the exact original key and payload')
      if (safeRequests === 2) return route.fulfill({ status: 404, json: { error: '安全接口暂不可用' } })
      if (safeRequests === 3) return route.fulfill({ json: { replayed: true, accessToken: 'safe-access', order: { revision: 1, guestName: body.guestName, note: '不同内容', items: body.items } } })
      return route.fulfill({ json: { replayed: true, accessToken: 'safe-access', order: { revision: 1, guestName: body.guestName, note: body.note, items: body.items } } })
    })
    await safePage.goto(`http://127.0.0.1:${server.address().port}/guest-order/safe-test`)
    await safePage.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
    await safePage.getByRole('button', { name: '查看点菜单' }).click()
    await safePage.locator('#guestName').fill('安全访客')
    await safePage.locator('#orderNote').fill('重试仍保留')
    await safePage.getByRole('button', { name: '提交给主人' }).click()
    await safePage.getByText('这份点菜单需要核对或保存凭证', { exact: false }).waitFor()
    if (process.env.EATWHAT_SAFE_ORDER_SHOT) await safePage.screenshot({ path: process.env.EATWHAT_SAFE_ORDER_SHOT })
    assert.equal(await safePage.locator('#orderNote').isDisabled(), true)
    assert.equal(safeRequests, 1)
    sessionOpen = false
    await safePage.reload()
    await safePage.getByRole('button', { name: '查看 / 核对' }).click()
    assert.equal(await safePage.locator('#orderNote').inputValue(), '重试仍保留')
    assert.equal(safeRequests, 1, 'reload must not silently submit')
    await safePage.getByRole('button', { name: '安全重试原提交' }).click()
    await safePage.getByText('安全接口暂不可用', { exact: true }).waitFor()
    assert.equal(await safePage.getByRole('button', { name: '安全重试原提交' }).isEnabled(), true)
    await safePage.getByRole('button', { name: '安全重试原提交' }).click()
    await safePage.getByText('提交回执与本次内容不一致', { exact: false }).waitFor()
    assert.notEqual(await safePage.evaluate(() => sessionStorage.getItem('eatwhat.guestOrder.safe-test.pendingCreate')), null, 'mismatched receipts must retain the safe retry key')
    assert.equal(await safePage.getByRole('button', { name: '安全重试原提交' }).isEnabled(), true)
    await safePage.getByRole('button', { name: '安全重试原提交' }).click()
    await safePage.getByText('上次的点菜单已提交给主人', { exact: false }).waitFor()
    assert.equal(safeRequests, 4)
    assert.equal(logicalOrders, 1)
    assert.notEqual(await safePage.evaluate(() => sessionStorage.getItem('eatwhat.guestOrder.safe-test.pendingCreate')), null, 'safe retry key remains until access storage is verified')
    await safePage.evaluate(() => { window.__blockGuestStorage = false })
    await safePage.getByRole('button', { name: '重新保存凭证' }).click()
    await safePage.getByText('订单凭证已保存在本浏览器').waitFor()
    assert.equal(await safePage.evaluate(() => sessionStorage.getItem('eatwhat.guestOrder.safe-test.pendingCreate')), null)
    assert.equal(await safePage.evaluate(() => localStorage.getItem('eatwhat.guestOrder.safe-test')), 'safe-access')
    assert.equal(safeRequests, 4, 'credential recovery must not repeat a safe order request')
    await safePage.close()
    for (const hasPending of [true, false]) {
      const readBlocked = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await readBlocked.addInitScript(({ hasPending }) => {
        const key = 'eatwhat.guestOrder.read-blocked.pendingCreate'
        if (hasPending) sessionStorage.setItem(key, JSON.stringify({ creationKey: 'A'.repeat(43), guestName: '原来的客人', note: '原来的备注', items: [{ mealId: '123456789012345678901234', name: '安全提交测试菜', quantity: 1, note: '' }] }))
        window.__blockPendingRead = true
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function (name) { if (window.__blockPendingRead && this === sessionStorage && name === key) throw new DOMException('blocked', 'SecurityError'); return original.call(this, name) }
      }, { hasPending })
      let blockedWrites = 0
      await readBlocked.route('**/guest-orders/public/**', route => {
        if (route.request().method() === 'GET') return route.fulfill({ json: { session: { ...session, supportsIdempotentCreate: true }, meals: [safeMeal] } })
        blockedWrites++
        return route.fulfill({ status: 500, json: { error: 'unexpected request' } })
      })
      await readBlocked.goto(`http://127.0.0.1:${server.address().port}/guest-order/read-blocked`)
      await readBlocked.getByRole('button', { name: '查看 / 核对' }).click()
      await readBlocked.getByText('浏览器暂时无法读取安全提交凭证', { exact: false }).waitFor()
      assert.equal(await readBlocked.getByRole('button', { name: '安全重试原提交' }).isDisabled(), true)
      assert.equal(await readBlocked.getByRole('button', { name: '放弃安全重试' }).isDisabled(), true)
      assert.equal(await readBlocked.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
      await readBlocked.getByRole('button', { name: '重新读取凭证' }).click()
      await readBlocked.getByText('仍无法读取凭证', { exact: false }).waitFor()
      await readBlocked.evaluate(() => { window.__blockPendingRead = false })
      await readBlocked.getByRole('button', { name: '重新读取凭证' }).click()
      if (hasPending) {
        await readBlocked.getByText('这份点菜单需要核对或保存凭证', { exact: false }).waitFor()
        assert.equal(await readBlocked.locator('#guestName').inputValue(), '原来的客人')
        assert.equal(await readBlocked.locator('#orderNote').inputValue(), '原来的备注')
        assert.equal(await readBlocked.getByRole('button', { name: '安全重试原提交' }).isEnabled(), true)
      } else {
        await readBlocked.getByText('已重新读取存储', { exact: false }).waitFor()
        assert.equal(await readBlocked.locator('#guestName').isDisabled(), false)
      }
      assert.equal(blockedWrites, 0, 'reading a credential must not submit an order')
      await readBlocked.close()
    }
    for (const accessCase of ['saved', 'missing', 'order-unavailable']) {
      const hasAccess = accessCase !== 'missing'
      const accessBlocked = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await accessBlocked.addInitScript(({ hasAccess }) => {
        const key = 'eatwhat.guestOrder.access-read-blocked'
        if (hasAccess) localStorage.setItem(key, 'previous-access')
        window.__blockAccessRead = true
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function (name) { if (window.__blockAccessRead && this === localStorage && name === key) throw new DOMException('blocked', 'SecurityError'); return original.call(this, name) }
      }, { hasAccess })
      let accessWrites = 0; let accessReads = 0; let failOrder = accessCase === 'order-unavailable'
      await accessBlocked.route('**/guest-orders/public/**', route => {
        const req = route.request()
        if (req.method() !== 'GET') { accessWrites++; return route.fulfill({ status: 500 }) }
        if (new URL(req.url()).pathname.endsWith('/orders/previous-access')) { accessReads++; return failOrder ? route.fulfill({ status: 503, json: { error: '订单暂不可用' } }) : route.fulfill({ json: { order: { revision: 2, guestName: '之前的客人', note: '之前的备注', items: [{ mealId: safeMeal._id, name: safeMeal.name, quantity: 1, note: '' }] } } }) }
        return route.fulfill({ json: { session: { ...session, supportsIdempotentCreate: true }, meals: [safeMeal] } })
      })
      await accessBlocked.goto(`http://127.0.0.1:${server.address().port}/guest-order/access-read-blocked`)
      await accessBlocked.getByRole('button', { name: '查看 / 核对' }).click()
      await accessBlocked.getByText('浏览器暂时无法读取已提交订单的凭证', { exact: false }).waitFor()
      assert.equal(await accessBlocked.locator('#guestName').isDisabled(), true)
      assert.equal(await accessBlocked.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
      assert.equal(await accessBlocked.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
      await accessBlocked.getByRole('button', { name: '重新读取订单凭证' }).click()
      await accessBlocked.getByText('仍无法读取订单凭证', { exact: false }).waitFor()
      await accessBlocked.evaluate(() => { window.__blockAccessRead = false })
      await accessBlocked.getByRole('button', { name: '重新读取订单凭证' }).click()
      if (hasAccess) {
        if (failOrder) {
          await accessBlocked.getByText('暂时无法读取之前提交的订单', { exact: false }).waitFor()
          assert.equal(await accessBlocked.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
          failOrder = false
          accessBlocked.once('dialog', dialog => dialog.accept())
          await accessBlocked.getByRole('button', { name: '载入最新订单' }).click()
        }
        await accessBlocked.getByText('上次的点菜单已提交给主人', { exact: false }).waitFor()
        assert.equal(await accessBlocked.locator('#guestName').inputValue(), '之前的客人')
        assert.equal(await accessBlocked.locator('#orderNote').inputValue(), '之前的备注')
        assert.equal(accessReads, accessCase === 'order-unavailable' ? 2 : 1)
      } else {
        await accessBlocked.getByText('未发现已保存的订单凭证', { exact: false }).waitFor()
        assert.equal(await accessBlocked.locator('#guestName').isDisabled(), false)
        assert.equal(accessReads, 0)
      }
      assert.equal(accessWrites, 0, 'checking an existing credential must not create or update an order')
      await accessBlocked.close()
    }
    for (const wasUncertain of [true, false]) {
      const uncertainBlocked = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await uncertainBlocked.addInitScript(({ wasUncertain }) => {
        const key = 'eatwhat.guestOrder.uncertain-read-blocked.uncertain'
        if (wasUncertain) sessionStorage.setItem(key, '1')
        window.__blockUncertainRead = true
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function (name) { if (window.__blockUncertainRead && this === sessionStorage && name === key) throw new DOMException('blocked', 'SecurityError'); return original.call(this, name) }
      }, { wasUncertain })
      let uncertainWrites = 0
      await uncertainBlocked.route('**/guest-orders/public/**', route => {
        if (route.request().method() !== 'GET') { uncertainWrites++; return route.fulfill({ status: 500 }) }
        return route.fulfill({ json: { session, meals: [safeMeal] } })
      })
      await uncertainBlocked.goto(`http://127.0.0.1:${server.address().port}/guest-order/uncertain-read-blocked`)
      await uncertainBlocked.getByRole('button', { name: '查看 / 核对' }).click()
      await uncertainBlocked.getByText('浏览器暂时无法读取上次提交的核对状态', { exact: false }).waitFor()
      assert.equal(await uncertainBlocked.locator('#guestName').isDisabled(), true)
      assert.equal(await uncertainBlocked.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
      assert.equal(await uncertainBlocked.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
      await uncertainBlocked.getByRole('button', { name: '重新读取核对状态' }).click()
      await uncertainBlocked.getByText('仍无法读取核对状态', { exact: false }).waitFor()
      await uncertainBlocked.evaluate(() => { window.__blockUncertainRead = false })
      await uncertainBlocked.getByRole('button', { name: '重新读取核对状态' }).click()
      if (wasUncertain) {
        await uncertainBlocked.getByText('提交结果尚未确认', { exact: false }).waitFor()
        assert.equal(await uncertainBlocked.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
      } else {
        await uncertainBlocked.getByText('已重新读取核对状态', { exact: false }).waitFor()
        assert.equal(await uncertainBlocked.locator('#guestName').isDisabled(), false)
      }
      assert.equal(uncertainWrites, 0, 'reading recovery state must not submit an order')
      await uncertainBlocked.close()
    }
    for (const invalidValue of ['', '0', 'damaged']) {
      const invalidPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
      await invalidPage.addInitScript(({ invalidValue }) => {
        const key = 'eatwhat.guestOrder.invalid-uncertainty.uncertain'
        if (sessionStorage.getItem(key) === null) sessionStorage.setItem(key, invalidValue)
        const original = Storage.prototype.setItem
        Storage.prototype.setItem = function (name, value) { if (window.__blockUncertainWrite && this === sessionStorage && name === key) throw new DOMException('blocked', 'SecurityError'); return original.call(this, name, value) }
      }, { invalidValue })
      let writes = 0
      await invalidPage.route('**/guest-orders/public/**', route => {
        if (route.request().method() !== 'GET') { writes++; return route.fulfill({ status: 500 }) }
        return route.fulfill({ json: { session, meals: [safeMeal] } })
      })
      await invalidPage.goto(`http://127.0.0.1:${server.address().port}/guest-order/invalid-uncertainty`)
      await invalidPage.getByRole('button', { name: '查看 / 核对' }).click()
      await invalidPage.getByText('提交核对状态无法识别', { exact: false }).waitFor()
      assert.equal(await invalidPage.locator('#guestName').isDisabled(), true)
      assert.equal(await invalidPage.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
      await invalidPage.getByRole('button', { name: '重新读取核对状态' }).click()
      await invalidPage.getByText('核对状态仍无法识别', { exact: false }).waitFor()
      await invalidPage.evaluate(() => { window.__blockUncertainWrite = true })
      invalidPage.once('dialog', dialog => dialog.accept())
      await invalidPage.getByRole('button', { name: '标记为待核对' }).click()
      await invalidPage.getByText('无法保存核对状态', { exact: false }).waitFor()
      assert.equal(await invalidPage.evaluate(() => sessionStorage.getItem('eatwhat.guestOrder.invalid-uncertainty.uncertain')), invalidValue)
      assert.equal(await invalidPage.locator('#guestName').isDisabled(), true)
      await invalidPage.evaluate(() => { window.__blockUncertainWrite = false })
      invalidPage.once('dialog', dialog => dialog.accept())
      await invalidPage.getByRole('button', { name: '标记为待核对' }).click()
      await invalidPage.getByText('提交结果尚未确认', { exact: false }).waitFor()
      assert.equal(await invalidPage.evaluate(() => sessionStorage.getItem('eatwhat.guestOrder.invalid-uncertainty.uncertain')), '1')
      await invalidPage.reload()
      await invalidPage.getByRole('button', { name: '查看 / 核对' }).click()
      await invalidPage.getByText('提交结果尚未确认', { exact: false }).waitFor()
      assert.equal(await invalidPage.getByRole('button', { name: '提交给主人' }).isDisabled(), true)
      assert.equal(writes, 0, 'repairing recovery state must not submit an order')
      await invalidPage.close()
    }
    const closedPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await closedPage.addInitScript(() => localStorage.setItem('eatwhat.guestOrder.closed-test', 'closed-access'))
    await closedPage.route('**/guest-orders/public/**', async route => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/orders/closed-access')) return route.fulfill({ json: { order: { revision: 1, guestName: '已提交访客', note: '保留的整单备注', items: [{ mealId: 'b', name: '测试青菜', quantity: 2, note: '保留的菜品备注' }] } } })
      return route.fulfill({ json: { session: { ...session, status: 'locked', canOrder: false }, meals: [meals[1]] } })
    })
    await closedPage.goto(`http://127.0.0.1:${server.address().port}/guest-order/closed-test`)
    assert.match(await closedPage.locator('#subtitle').innerText(), /暂不接收新点单.*核对已有选择及提交状态/)
    await closedPage.getByRole('button', { name: '查看点菜单' }).click()
    const closedRow = closedPage.locator('.cart-row')
    assert.equal(await closedRow.getByRole('button', { name: '增加测试青菜' }).isDisabled(), true)
    assert.equal(await closedRow.getByRole('button', { name: '减少测试青菜' }).isDisabled(), true)
    assert.equal(await closedRow.locator('.item-note').getAttribute('readonly'), '')
    assert.equal(await closedRow.locator('.item-note').inputValue(), '保留的菜品备注')
    assert.equal(await closedPage.locator('#guestName').getAttribute('readonly'), '')
    assert.equal(await closedPage.locator('#orderNote').getAttribute('readonly'), '')
    assert.equal(await closedPage.locator('#orderNote').inputValue(), '保留的整单备注')
    await closedPage.getByRole('button', { name: '关闭点菜单' }).waitFor()
    await closedPage.close()
    const closedEmpty = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await closedEmpty.route('**/guest-orders/public/**', route => route.fulfill({ json: { session: { ...session, status: 'locked', canOrder: false }, meals: [] } }))
    await closedEmpty.goto(`http://127.0.0.1:${server.address().port}/guest-order/closed-empty`)
    await closedEmpty.locator('#subtitle').getByText('主人暂不接收新点单。', { exact: true }).waitFor()
    await closedEmpty.locator('#mealGrid').getByText('主人暂不接收新点单。', { exact: true }).waitFor()
    assert.equal(await closedEmpty.getByRole('button', { name: '查看点菜单' }).isDisabled(), true)
    await closedEmpty.close()
    const noSessionStorage = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await noSessionStorage.addInitScript(() => {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (this === sessionStorage && key.endsWith('.pendingCreate')) throw new DOMException('blocked', 'SecurityError')
        return original.call(this, key, value)
      }
    })
    let unsafeWrites = 0
    await noSessionStorage.route('**/guest-orders/public/**', async route => {
      if (route.request().method() !== 'GET') { unsafeWrites++; return route.fulfill({ status: 500 }) }
      return route.fulfill({ json: { session: { ...session, supportsIdempotentCreate: true }, meals: [safeMeal] } })
    })
    await noSessionStorage.goto(`http://127.0.0.1:${server.address().port}/guest-order/storage-unavailable`)
    await noSessionStorage.locator('.meal').getByRole('button', { name: '＋ 想吃' }).click()
    await noSessionStorage.getByRole('button', { name: '查看点菜单' }).click()
    await noSessionStorage.locator('#guestName').fill('安全访客')
    await noSessionStorage.getByRole('button', { name: '提交给主人' }).click()
    await noSessionStorage.getByText('无法保存安全提交凭证', { exact: false }).waitFor()
    assert.equal(unsafeWrites, 0, 'cannot safely create before persisting the retry token')
    await noSessionStorage.close()
    console.log('Guest ordering workflows passed: unavailable dishes, draft-safe conflicts and uncertain submissions')
  } catch (error) { console.error('Guest workflow failure:', error); throw error }
  finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
