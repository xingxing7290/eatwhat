const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Capability checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const household = '0123456789abcdef01234567'
    await page.addInitScript(home => { localStorage.setItem('token', 'fixture-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: home, username: 'test' })) }, household)
    let mode = 'legacy'; let writes = 0; let reads = 0; let probes = 0; let sentHeader = ''
    let releaseProbe; let probeStarted
    const started = new Promise(resolve => { probeStarted = resolve })
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname
      if (path === '/api/auth/household-scope') {
        probes++
        if (mode === 'legacy') return route.fulfill({ status: 404, json: { error: '未找到' } })
        if (mode === 'wrong') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'wrong-household' } })
        if (mode === 'network') return route.abort()
        if (mode === 'hold') { probeStarted(); await new Promise(resolve => { releaseProbe = resolve }) }
        return route.fulfill({ json: { supportsHouseholdScope: true, householdId: req.headers()['x-eatwhat-household'] } })
      }
      if (path === '/api/meals' && req.method() === 'POST') { writes++; sentHeader = req.headers()['x-eatwhat-household']; return route.fulfill({ status: 201, json: { _id: 'created', name: '我的草稿' } }) }
      reads++
      return route.fulfill({ json: { data: [], total: 0 } })
    })
    await page.goto(`${base}/meals/editor`)
    await page.getByPlaceholder('给这道菜起个名字').fill('我的草稿')
    const blockedRead = await page.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); return api.dashboard.summary().then(() => null, error => error.code) })
    assert.equal(blockedRead, 'HOUSEHOLD_SCOPE_UNVERIFIED')
    assert.equal(reads, 0, 'legacy server must not receive a protected read')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.locator('.session-warning').getByText('暂时无法确认家庭保护').waitFor()
    assert.equal(writes, 0, 'legacy server must not receive a mutation')
    assert.equal(await page.getByPlaceholder('给这道菜起个名字').inputValue(), '我的草稿')
    mode = 'wrong'; await page.getByRole('button', { name: '重新检查' }).click()
    await page.waitForFunction(() => !document.querySelector('.session-warning button')?.disabled)
    assert.equal(await page.locator('.session-warning').count(), 1, 'a mismatched household must not pass the probe')
    mode = 'network'; await page.getByRole('button', { name: '重新检查' }).click()
    await page.waitForFunction(() => !document.querySelector('.session-warning button')?.disabled)
    assert.equal(writes, 0)
    mode = 'hold'; const before = probes
    await page.evaluate(async () => { const { default: api } = await import('/src/services/api.js'); window.concurrentChecks = Promise.all([api.dashboard.summary(), api.wishlist.list()]) })
    await started
    assert.equal(probes, before + 1, 'simultaneous requests should share one capability probe')
    releaseProbe()
    await page.evaluate(() => window.concurrentChecks)
    await page.locator('.session-warning').waitFor({ state: 'hidden' })
    mode = 'legacy'
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.locator('.session-warning').getByText('暂时无法确认家庭保护').waitFor()
    assert.equal(writes, 0, 'a downgrade after an earlier check must block the next write')
    mode = 'current'; await page.getByRole('button', { name: '重新检查' }).click()
    await page.locator('.session-warning').waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.equal(writes, 1)
    assert.equal(sentHeader, household)
    assert.ok(probes >= 4)
    const missing = await browser.newPage()
    await missing.addInitScript(() => { localStorage.setItem('token', 'fixture-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', username: 'test' })) })
    let missingRequests = 0
    await missing.route('**/api/**', route => { missingRequests++; return route.fulfill({ json: {} }) })
    await missing.goto(`${base}/meals/editor`)
    await missing.getByPlaceholder('给这道菜起个名字').fill('缺少家庭资料的草稿')
    await missing.getByRole('button', { name: '保存', exact: true }).click()
    await missing.locator('.session-warning').getByText('暂时无法确认家庭保护').waitFor()
    assert.equal(missingRequests, 0, 'missing household identity must not send a protected request')
    assert.equal(await missing.getByPlaceholder('给这道菜起个名字').inputValue(), '缺少家庭资料的草稿')
    await missing.close()
    const race = await browser.newPage()
    await race.addInitScript(home => { localStorage.setItem('token', 'race-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: home })) }, household)
    let raceWrites = 0
    await race.route('**/api/**', route => {
      const req = route.request()
      if (req.url().endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: req.headers()['x-eatwhat-household'] } })
      if (req.method() === 'POST') { raceWrites++; return route.fulfill({ status: 409, json: { code: 'HOUSEHOLD_SCOPE_CHANGED', error: '家庭已变化' } }) }
      return route.fulfill({ json: {} })
    })
    await race.goto(`${base}/meals/editor`)
    await race.getByPlaceholder('给这道菜起个名字').fill('切换竞争中的草稿')
    await race.getByRole('button', { name: '保存', exact: true }).click()
    await race.locator('.session-warning').getByText('账号或小家已变化').waitFor()
    assert.equal(await race.getByPlaceholder('给这道菜起个名字').inputValue(), '切换竞争中的草稿')
    await race.getByRole('button', { name: '保存', exact: true }).click()
    assert.equal(raceWrites, 1, 'a conflict on the business request must fence subsequent writes')
    await race.close()
    console.log('Capability checks passed: legacy, wrong scope, network failure, recovery and protected write')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
