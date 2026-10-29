const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Wishlist tests require a local test server')
const meals = Array.from({ length: 75 }, (_, i) => ({ _id: `meal-${String(i + 1).padStart(2, '0')}`, name: `菜品${String(i + 1).padStart(2, '0')}` }))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test', householdId: 'home-a' })) })
    const version = revision => ({ revision, updatedAt: '2026-10-28T12:00:00.000Z' })
    let items = [{ _id: 'wish-a', title: '想吃面条', status: 'open', priority: 'normal', votes: [], votedByMe: false, mealId: null, supportsSetVote: true, supportsSafeMealLink: true, supportsMealLinkVisibility: true, mealLinkStatus: 'unlinked', supportsConditionalActions: true, editVersion: version('v1') }, { _id: 'wish-old', title: '旧服务记录', status: 'open', priority: 'normal', votes: [], supportsSafeMealLink: true }]
    let voteMode = 'unknown'; let statusMode = 'unknown'; let deleteMode = 'unknown'; let attachMode = 'lost'; let reviewFails = false; let releaseVote; let releaseSlow; const reads = []; const writes = []; const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/wishlist') data = items
      else if (req.method() === 'GET' && path === '/wishlist/wish-a') { if (reviewFails) return route.fulfill({ status: 503, json: { error: '核对读取失败' } }); data = items[0] }
      else if (req.method() === 'GET' && path === '/meals') {
        const query = url.searchParams.get('search') || ''; reads.push(Object.fromEntries(url.searchParams)); const found = meals.filter(meal => meal.name.includes(query))
        if (query === '菜品0') await new Promise(resolve => { releaseSlow = resolve })
        data = { data: found.slice(0, 50), total: found.length, page: 1, limit: 50 }
      } else if (req.method() === 'PUT' && path === '/wishlist/wish-a/vote') {
        const voted = req.postDataJSON().voted; writes.push({ path, voted })
        if (voteMode === 'hold') await new Promise(resolve => { releaseVote = resolve })
        items = items.map(item => item._id === 'wish-a' ? { ...item, votedByMe: voted, votes: voted ? [{ _id: 'u1' }] : [], editVersion: version(voted ? 'v2' : 'v3') } : item)
        if (voteMode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        data = voteMode === 'malformed' ? { _id: 'other', votedByMe: voted } : items[0]
      } else if (req.method() === 'PATCH' && path === '/wishlist/wish-a/status') {
        assert.deepEqual(req.postDataJSON().expectedEditVersion, items[0].editVersion)
        if (statusMode === 'conflict') { items = items.map(item => item._id === 'wish-a' ? { ...item, status: 'done', editVersion: version('external') } : item); return route.fulfill({ status: 409, json: { code: 'WISH_CONFLICT', error: '发生冲突' } }) }
        items = items.map(item => item._id === 'wish-a' ? { ...item, status: req.postDataJSON().status, editVersion: version('status') } : item)
        if (statusMode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        data = statusMode === 'malformed' ? { _id: 'wish-a', status: 'unknown' } : items[0]
      } else if (req.method() === 'DELETE' && path === '/wishlist/wish-a') {
        assert.deepEqual(JSON.parse(url.searchParams.get('expectedEditVersion')), items[0].editVersion)
        if (deleteMode === 'conflict') { items = items.map(item => item._id === 'wish-a' ? { ...item, note: '家人刚修改', editVersion: version('external-delete') } : item); return route.fulfill({ status: 409, json: { code: 'WISH_CONFLICT', error: '发生冲突' } }) }
        items = items.filter(item => item._id !== 'wish-a')
        if (deleteMode === 'unknown') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
      } else if (req.method() === 'PATCH' && path === '/wishlist/wish-a/meal') {
        writes.push({ path, body: req.postDataJSON() })
        if (attachMode === 'lost') return route.fulfill({ status: 503, json: { error: '模拟关联结果丢失' } })
        items = items.map(item => item._id === 'wish-a' ? { ...item, mealId: meals.find(meal => meal._id === req.postDataJSON().mealId), editVersion: version('linked') } : item)
        data = attachMode === 'malformed' ? { _id: 'wrong-wish', mealId: items[0].mealId } : items[0]
      }
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/wishlist`)
    const vote = page.getByRole('button', { name: '我想吃想吃面条' })
    await vote.waitFor()
    assert.equal(reads.length, 0)
    assert.equal(await page.getByRole('button', { name: '我想吃旧服务记录' }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: '删除旧服务记录' }).isDisabled(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    if (process.env.EATWHAT_WISHLIST_SHOT) await page.screenshot({ path: process.env.EATWHAT_WISHLIST_SHOT })
    await vote.click()
    await page.getByText('投票结果未确认', { exact: false }).waitFor()
    assert.equal(await vote.isDisabled(), true)
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    const cancelVote = page.getByRole('button', { name: '取消想吃想吃面条' })
    await cancelVote.waitFor()
    assert.equal(await cancelVote.getAttribute('aria-pressed'), 'true')
    voteMode = 'hold'
    await Promise.all([page.waitForRequest(request => request.method() === 'PUT' && request.url().endsWith('/wishlist/wish-a/vote')), cancelVote.click()])
    assert.equal(await cancelVote.isDisabled(), true)
    releaseVote()
    await page.getByRole('button', { name: '我想吃想吃面条' }).waitFor()
    assert.deepEqual(writes.slice(0, 2).map(item => item.voted), [true, false])
    voteMode = 'malformed'
    await page.getByRole('button', { name: '我想吃想吃面条' }).click()
    await page.getByText('投票结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    voteMode = 'valid'
    await page.getByRole('button', { name: '取消想吃想吃面条' }).click()
    await page.getByRole('button', { name: '我想吃想吃面条' }).waitFor()
    await page.getByRole('button', { name: '关联已有菜谱' }).first().click()
    const dialog = page.getByRole('dialog', { name: '关联已有菜谱' })
    const search = dialog.getByRole('combobox', { name: '搜索并选择菜谱' })
    await search.click()
    await dialog.getByText('仅显示前 50 道', { exact: false }).waitFor()
    assert.equal(reads[0].limit, '50')
    await search.fill('菜品0')
    await page.waitForFunction(() => true)
    await page.waitForRequest(request => request.url().includes('search=%E8%8F%9C%E5%93%810'))
    await search.fill('菜品75')
    await page.getByRole('option', { name: '菜品75', exact: true }).waitFor()
    const slowResponse = page.waitForResponse(response => new URL(response.url()).searchParams.get('search') === '菜品0')
    releaseSlow()
    await slowResponse
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await page.getByRole('option', { name: '菜品75', exact: true }).waitFor()
    await page.getByRole('option', { name: '菜品75', exact: true }).click()
    await dialog.getByRole('button', { name: '确认关联' }).click()
    await page.getByText('菜谱关联尚未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '删除想吃面条' }).isDisabled(), true)
    reviewFails = true
    await page.getByRole('button', { name: '核对关联' }).click()
    await page.getByText('核对失败：核对读取失败').waitFor()
    assert.equal(await page.getByRole('button', { name: '结束核对', exact: true }).count(), 0)
    reviewFails = false
    await page.getByRole('button', { name: '核对关联' }).click()
    await page.getByText('最新记录尚未关联', { exact: false }).waitFor()
    await page.getByRole('button', { name: '结束核对', exact: true }).click()
    await page.getByText('先前请求仍可能稍后完成', { exact: false }).last().waitFor()
    await page.getByRole('button', { name: '继续核对', exact: true }).click()
    await page.getByRole('button', { name: '结束核对', exact: true }).click()
    await page.getByRole('button', { name: '了解风险，结束核对' }).click()
    await page.getByRole('button', { name: '关联已有菜谱' }).first().waitFor()
    await page.getByRole('button', { name: '关联已有菜谱' }).first().click()
    await dialog.getByRole('combobox', { name: '搜索并选择菜谱' }).fill('菜品75')
    await page.getByRole('option', { name: '菜品75', exact: true }).click()
    attachMode = 'malformed'
    await dialog.getByRole('button', { name: '确认关联' }).click()
    await page.getByRole('button', { name: '安排今天晚餐' }).waitFor()
    assert.equal(await page.getByText('菜谱关联尚未确认', { exact: false }).count(), 0, 'a subsequent verified read resolves the uncertain result')
    assert.equal(writes.find(item => item.path.endsWith('/meal')).body.mealId, 'meal-75')
    statusMode = 'malformed'
    await page.locator('.wish-card').filter({ hasText: '想吃面条' }).getByRole('button', { name: '标记已安排' }).click()
    await page.getByText('状态更新结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    statusMode = 'valid'
    await page.getByRole('button', { name: '重新想吃' }).click()
    await page.locator('.wish-card').filter({ hasText: '想吃面条' }).getByRole('button', { name: '标记已安排' }).waitFor()
    statusMode = 'conflict'
    await page.locator('.wish-card').filter({ hasText: '想吃面条' }).getByRole('button', { name: '标记已安排' }).click()
    await page.getByText('这条想吃已被其他成员修改或删除', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    statusMode = 'unknown'
    await page.getByRole('button', { name: '重新想吃' }).click()
    await page.getByText('状态更新结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    await page.locator('.wish-card').filter({ hasText: '想吃面条' }).getByRole('button', { name: '标记已安排' }).waitFor()
    deleteMode = 'conflict'
    await page.getByRole('button', { name: '删除想吃面条' }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await page.getByText('这条想吃已被其他成员修改或删除', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    await page.getByText('家人刚修改').waitFor()
    deleteMode = 'unknown'
    await page.getByRole('button', { name: '删除想吃面条' }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await page.getByText('删除结果未确认', { exact: false }).waitFor()
    await page.getByRole('button', { name: '刷新清单并核对' }).click()
    await page.getByText('想吃面条', { exact: true }).waitFor({ state: 'hidden' })
    items.push({ _id: 'missing-link', title: '失效关联', status: 'open', priority: 'normal', votes: [], mealId: null, supportsSafeMealLink: true, supportsMealLinkVisibility: true, mealLinkStatus: 'unavailable' })
    await page.reload()
    const missing = page.locator('.wish-card').filter({ hasText: '失效关联' })
    await missing.getByText('原关联菜谱不可用', { exact: false }).waitFor()
    assert.equal(await missing.getByRole('button', { name: '转菜品' }).isDisabled(), true)
    assert.equal(await missing.getByRole('button', { name: '关联已有菜谱' }).isDisabled(), true)
    const old = page.locator('.wish-card').filter({ hasText: '旧服务记录' })
    await old.getByText('服务器无法确认该记录是否已有菜谱关联', { exact: false }).waitFor()
    assert.equal(await old.getByRole('button', { name: '转菜品' }).isDisabled(), true)
    assert.deepEqual(errors, [])
    console.log('Wishlist workflows passed: atomic votes, uncertain actions, lazy search and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
