const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Household name checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a', username: 'test' })) })
    let name = '原来的小家'; let revision = 'rev-1'; let inviteCode = 'CODE'; let mode = 'normal'; let writes = 0; let release
    const payload = () => ({ id: 'home-a', name, inviteCode, members: [{ _id: 'u1', username: 'test' }], supportsConditionalNameUpdate: true, nameVersion: { revision } })
    const profile = () => ({ user: { id: 'u1', username: 'test', displayName: '原昵称', householdId: 'home-a' }, household: payload() })
    await page.route('**/api/**', async route => {
      const req = route.request(); const path = new URL(req.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: req.headers()['x-eatwhat-household'] } })
      if (path === '/auth/me' || (path === '/household/me' && req.method() === 'GET')) {
        const result = profile()
        if (mode === 'foreign' && path === '/household/me') result.household.id = 'other-home'
        if (mode === 'not-member' && path === '/household/me') result.household.members = []
        if (mode === 'long-code' && path === '/household/me') result.household.inviteCode = 'X'.repeat(21)
        if (mode === 'nested-mismatch' && path === '/household/me') result.user.household = { id: 'other-home' }
        if (mode === 'legacy') delete result.household.supportsConditionalNameUpdate
        return route.fulfill({ json: result })
      }
      if (path === '/auth/profile' && req.method() === 'PUT') { const result = profile(); result.user.displayName = req.postDataJSON().displayName; return route.fulfill({ json: result }) }
      if (path === '/auth/avatar' && req.method() === 'POST') { const result = profile(); result.user.avatarUrl = '/uploads/avatar.png'; return route.fulfill({ json: result }) }
      if (path === '/household/invite/refresh' && req.method() === 'POST') { inviteCode = 'CODE2'; return route.fulfill({ json: { household: payload() } }) }
      if (path === '/household/me' && req.method() === 'PUT') {
        writes++; const data = req.postDataJSON()
        if (mode === 'hold') await new Promise(resolve => { release = resolve })
        if (data.expectedNameVersion?.revision !== revision) return route.fulfill({ status: 409, json: { code: 'HOUSEHOLD_NAME_CONFLICT', error: '小家名称已变化' } })
        name = data.name; revision = `rev-${writes + 2}`
        if (mode === 'lost') return route.fulfill({ status: 503, json: { error: '模拟响应丢失' } })
        if (mode === 'malformed') return route.fulfill({ json: { household: { ...payload(), nameVersion: null } } })
        return route.fulfill({ json: { household: payload() } })
      }
      if (path === '/default-meals/status') return route.fulfill({ json: { total: 0, imported: 0, missing: 0 } })
      if (path === '/meal-image-issues') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/settings`)
    await page.getByPlaceholder('给你们的小家取个名字').waitFor()
    await page.getByPlaceholder('给你们的小家取个名字').fill('我的小家名称')
    await page.getByPlaceholder('请输入昵称').fill('先保存的昵称')
    name = '家人刚修改的名称'; revision = 'rev-other'
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('保存成功').waitFor()
    assert.equal(await page.getByPlaceholder('给你们的小家取个名字').inputValue(), '我的小家名称')
    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=', 'base64') })
    await page.getByRole('button', { name: '上传头像' }).click()
    await page.getByText('头像已更新').waitFor()
    assert.equal(await page.getByPlaceholder('给你们的小家取个名字').inputValue(), '我的小家名称')
    const householdCard = page.locator('.settings-card').filter({ hasText: '情侣小家' })
    await householdCard.getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByRole('button', { name: '刷新邀请码' }).click()
    await page.getByText('邀请码已刷新').waitFor()
    assert.equal(await page.getByPlaceholder('给你们的小家取个名字').inputValue(), '我的小家名称')
    await page.getByPlaceholder('请输入昵称').fill('需要保留的昵称')
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.getByText('小家名称已被修改，本次没有保存。').waitFor()
    if (process.env.EATWHAT_NAME_SHOT) await page.screenshot({ path: process.env.EATWHAT_NAME_SHOT, fullPage: true })
    assert.equal(await page.getByPlaceholder('给你们的小家取个名字').inputValue(), '我的小家名称')
    assert.equal(await page.getByPlaceholder('请输入昵称').inputValue(), '需要保留的昵称')
    assert.equal(await page.getByPlaceholder('给你们的小家取个名字').isEditable(), true)
    assert.equal(await page.getByPlaceholder('请输入昵称').isEditable(), true)
    assert.equal(await page.getByRole('button', { name: '保存小家' }).isDisabled(), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.name-alert .el-alert__title', '.name-alert .el-alert__description', '.name-alert .el-button']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${width} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    mode = 'foreign'; await page.getByRole('button', { name: '核对最新名称' }).click()
    await page.getByText('最新小家信息不完整').first().waitFor()
    assert.equal(await page.getByRole('button', { name: '保留我的名称' }).count(), 0)
    for (const fault of ['not-member', 'long-code', 'nested-mismatch']) {
      mode = fault
      await page.getByRole('button', { name: '核对最新名称' }).click()
      await page.getByText('家庭信息不完整，请重试').first().waitFor()
      assert.equal(await page.getByRole('button', { name: '保留我的名称' }).count(), 0)
      assert.equal(await page.getByPlaceholder('给你们的小家取个名字').inputValue(), '我的小家名称')
      assert.equal(await page.getByPlaceholder('请输入昵称').inputValue(), '需要保留的昵称')
      assert.equal(await householdCard.locator('input[readonly]').inputValue(), 'CODE2')
    }
    mode = 'normal'; await page.getByRole('button', { name: '核对最新名称' }).click()
    await page.getByText('最新名称：家人刚修改的名称').waitFor()
    await page.getByRole('button', { name: '保留我的名称' }).click()
    await page.getByRole('button', { name: '继续核对' }).click()
    assert.equal(await page.getByRole('button', { name: '保存小家' }).isDisabled(), true)
    await page.getByRole('button', { name: '保留我的名称' }).click()
    await page.getByRole('button', { name: '保留输入' }).click()
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.getByText('小家已更新').waitFor()
    assert.equal(name, '我的小家名称')
    assert.equal(await page.getByPlaceholder('请输入昵称').inputValue(), '需要保留的昵称')

    mode = 'lost'; await page.getByPlaceholder('给你们的小家取个名字').fill('响应丢失的名称')
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.getByText('小家名称保存结果未确认。').waitFor()
    const afterLost = writes
    assert.equal(await page.getByRole('button', { name: '保存小家' }).isDisabled(), true)
    mode = 'normal'; await page.getByRole('button', { name: '核对最新名称' }).click()
    await page.getByText('最新名称：响应丢失的名称').waitFor()
    await page.getByRole('button', { name: '采用最新名称' }).click()
    assert.equal(writes, afterLost, 'review must not resend an uncertain write')
    assert.equal(await page.getByPlaceholder('请输入昵称').inputValue(), '需要保留的昵称')

    mode = 'malformed'; await page.getByPlaceholder('给你们的小家取个名字').fill('响应不完整的名称')
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.getByText('小家名称保存结果未确认。').waitFor()
    mode = 'normal'; await page.getByRole('button', { name: '核对最新名称' }).click()
    await page.getByText('最新名称：响应不完整的名称').waitFor()
    await page.getByRole('button', { name: '采用最新名称' }).click()
    mode = 'hold'; await page.getByPlaceholder('给你们的小家取个名字').fill('正在保存的小家')
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.waitForFunction(() => document.querySelector('.settings-page') && [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存小家') && button.disabled))
    for (let i = 0; i < 100 && !release; i++) await new Promise(resolve => setTimeout(resolve, 50))
    const count = writes
    assert.equal(typeof release, 'function')
    release(); await page.getByRole('button', { name: '保存小家' }).waitFor({ state: 'visible' })
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存小家') && !button.disabled))
    assert.equal(writes, count)
    mode = 'normal'; name = '无草稿时的最新名称'; revision = 'rev-latest'
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('input[placeholder="给你们的小家取个名字"]')?.value === '无草稿时的最新名称')
    await page.getByPlaceholder('给你们的小家取个名字').fill('基于最新版本的名称')
    await page.getByRole('button', { name: '保存小家' }).click()
    await page.waitForFunction(() => document.querySelector('input[placeholder="给你们的小家取个名字"]')?.value === '基于最新版本的名称' && [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存小家') && !button.disabled))
    assert.equal(name, '基于最新版本的名称')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.close()

    const legacy = await browser.newPage()
    await legacy.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' })) })
    await legacy.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') { const data = profile(); delete data.household.supportsConditionalNameUpdate; return route.fulfill({ json: data }) }
      if (path === '/api/meal-image-issues') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await legacy.goto(`${base}/settings`)
    await legacy.getByText('服务器未提供安全的小家名称版本', { exact: false }).waitFor()
    assert.equal(await legacy.getByRole('button', { name: '保存小家' }).isDisabled(), true)
    await legacy.close()
    console.log('Household name checks passed: conflict, recovery, uncertainty, legacy guard and draft preservation')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
