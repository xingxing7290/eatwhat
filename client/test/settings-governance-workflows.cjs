const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Settings tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' }))
    })
    let invalid = true
    let profileFailed = false
    let profileReads = 0
    let missing = 1
    let issues = []
    let importCalls = 0
    let restoreCalls = 0
    let issueCalls = 0
    let issueSuccess = false
    let holdIssue = false; let releaseIssue
    const profile = { user: { id: 'u1', householdId: 'home-a' }, household: { id: 'home-a', name: '甲家庭', inviteCode: 'CODE', members: [{ _id: 'u1' }] } }
    await page.context().route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') { profileReads++; return profileFailed ? route.fulfill({ status: 503, json: { error: '资料不可用' } }) : route.fulfill({ json: profile }) }
      if (path === '/api/meals/0123456789abcdef01234567') return route.fulfill({ json: { _id: '0123456789abcdef01234567', name: '测试菜', ingredients: [], steps: [], photos: [], tags: [], healthTags: [] } })
      if (path === '/api/default-meals/status') return route.fulfill({ json: invalid ? { total: 3, imported: 2, missing: 2 } : { total: 3, imported: 3 - missing, missing } })
      if (path === '/api/meal-image-issues') return route.fulfill({ json: invalid ? { items: [] } : issues })
      if (path === '/api/default-meals/import-missing') { importCalls++; missing = 0; return route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
      if (path === '/api/default-meals/restore-images') { restoreCalls++; return route.fulfill({ json: {} }) }
      if (path === '/api/meal-image-issues/issue-1') { issueCalls++; if (holdIssue) await new Promise(resolve => { releaseIssue = resolve }); issues = issueSuccess ? issues.filter(issue => issue._id !== 'issue-1') : []; return issueSuccess ? route.fulfill({ json: { _id: 'issue-1', status: 'fixed' } }) : route.fulfill({ status: 503, json: { error: '响应丢失' } }) }
      return route.fulfill({ json: {} })
    })
    const imageRequests = []
    await page.route('**/uploads/**', route => { imageRequests.push(new URL(route.request().url()).pathname); return route.fulfill({ status: 404, body: 'missing' }) })
    await page.goto(`${base}/settings`)
    await page.getByText('默认菜品状态加载失败，请重试后再操作。').waitFor()
    await page.getByText('图片反馈加载失败，请重试。').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).count(), 0)
    assert.equal(await page.getByText('暂无待修正图片').count(), 0)
    invalid = false
    await page.locator('.settings-card').filter({ hasText: '默认菜品管理' }).getByRole('button', { name: '重新加载' }).click()
    await page.getByText('暂无待修正图片').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).isEnabled(), true)
    await page.getByRole('button', { name: '恢复默认菜品图片' }).click()
    await page.getByRole('button', { name: '取消' }).click()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).isEnabled(), true)
    await page.getByRole('button', { name: '导入缺失默认菜品' }).click()
    await page.getByText('菜品管理操作结果未确认').waitFor()
    assert.equal(importCalls, 1)
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).count(), 0)
    assert.equal(await page.getByRole('button', { name: '加入', exact: true }).isDisabled(), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.name-alert .el-alert__title', '.name-alert .el-alert__description', '.name-alert .el-button']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.getByRole('button', { name: '重新核对状态' }).click()
    await page.getByText('当前缺失 0 道默认菜品。').waitFor()
    await page.getByRole('button', { name: '已核对，继续操作' }).click()
    await page.getByRole('button', { name: '再检查' }).click()
    assert.equal(await page.getByText('菜品管理操作结果未确认').isVisible(), true)
    await page.getByRole('button', { name: '已核对，继续操作' }).click()
    await page.getByRole('button', { name: '确认继续' }).click()
    await page.getByText('菜品管理操作结果未确认').waitFor({ state: 'hidden' })
    assert.equal(importCalls, 1)
    await page.getByRole('button', { name: '恢复默认菜品图片' }).click()
    await page.getByRole('button', { name: '确认恢复' }).click()
    await page.getByText('菜品管理操作结果未确认').waitFor()
    assert.equal(restoreCalls, 1)
    await page.getByRole('button', { name: '重新核对状态' }).click()
    await page.getByRole('button', { name: '已核对，继续操作' }).click()
    await page.getByRole('button', { name: '确认继续' }).click()
    await page.getByText('菜品管理操作结果未确认').waitFor({ state: 'hidden' })
    assert.equal(restoreCalls, 1)
    issues = [
      { _id: 'issue-1', mealId: { _id: '0123456789abcdef01234567', name: '测试菜', imageUrl: '/uploads/missing.jpg' }, note: '图片不符' + '长内容'.repeat(100) },
      { _id: 'issue-deleted', mealId: null, note: '已删除菜品' },
      { _id: 'issue-invalid', mealId: { _id: 'invalid/id', name: '地址异常', imageUrl: 'javascript:alert(1)' } }
    ]
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByText('已删除菜品').waitFor()
    await page.locator('.issue-item').filter({ hasText: '测试菜' }).getByText('图片不可用').waitFor()
    assert.equal(await page.getByText('未知菜品').isVisible(), true)
    assert.equal(await page.getByText('无图片', { exact: true }).isVisible(), true)
    const recipeLink = page.getByRole('link', { name: '在新标签页核对菜谱：测试菜' })
    assert.equal(await recipeLink.getAttribute('href'), '/meals/detail/0123456789abcdef01234567')
    assert.equal(await recipeLink.getAttribute('rel'), 'noopener noreferrer')
    assert.equal(await page.locator('.issue-item').filter({ hasText: '已删除菜品' }).getByRole('link').count(), 0)
    assert.equal(await page.locator('.issue-item').filter({ hasText: '地址异常' }).getByRole('link').count(), 0)
    const popupPromise = page.waitForEvent('popup'); await recipeLink.click(); const popup = await popupPromise
    await popup.getByRole('heading', { name: '测试菜' }).waitFor(); await popup.close()
    assert.equal(new URL(page.url()).pathname, '/settings', 'opening the recipe keeps settings available')
    const nicknameDraft = page.getByPlaceholder('请输入昵称'); await nicknameDraft.fill('尚未保存的昵称')
    const readsBeforeRefresh = profileReads
    issues[0] = { ...issues[0], note: '刷新后可核对的反馈' }
    await page.getByRole('button', { name: '刷新图片反馈' }).click()
    await page.getByText('刷新后可核对的反馈').waitFor()
    assert.equal(await nicknameDraft.inputValue(), '尚未保存的昵称', 'refreshing feedback preserves unsaved profile edits')
    assert.equal(profileReads, readsBeforeRefresh, 'feedback refresh must not reload or overwrite the profile')
    assert.equal(issueCalls, 0, 'refreshing feedback must not change issue status')
    await nicknameDraft.fill('')
    assert.ok(imageRequests.includes('/uploads/missing.jpg') && imageRequests.includes('/api/uploads/missing.jpg'))
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      for (const selector of ['.issue-placeholder', '.issue-main strong', '.issue-main span', '.issue-recipe-link', '.issue-refresh p']) {
        const result = await contrast(page, selector)
        assert.ok(result.ratio >= 4.5, `${width} ${selector}: ${result.ratio}`)
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    const issueAction = page.locator('.issue-item').filter({ hasText: '测试菜' }).getByRole('button', { name: '标记已修正：测试菜', exact: true })
    await issueAction.focus(); await page.keyboard.press('Enter')
    await page.getByText('图片反馈操作结果未确认').waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '待修正图片')
    assert.equal(issueCalls, 1)
    await page.getByRole('button', { name: '重新核对反馈' }).click()
    await page.getByText('当前有 0 条待修正反馈。').waitFor()
    await page.getByRole('button', { name: '已核对，查看反馈' }).click()
    await page.getByRole('button', { name: '确认查看' }).click()
    await page.getByText('暂无待修正图片').waitFor()
    assert.equal(issueCalls, 1)
    issueSuccess = true
    issues = [{ _id: 'issue-1', mealId: { name: '测试菜' }, note: '图片不符' }]
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByText('图片不符').waitFor()
    await page.getByRole('button', { name: '标记已修正：测试菜', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.getByText('暂无待修正图片').waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '待修正图片')
    assert.equal(issueCalls, 2)
    assert.equal(await page.getByText('图片反馈操作结果未确认').count(), 0)
    issues = [{ _id: 'issue-1', mealId: { name: '测试菜' }, note: '待核对' }, { _id: 'issue-2', mealId: { name: '下一道菜' }, note: '第二条反馈' }]
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByText('第二条反馈').waitFor()
    holdIssue = true
    await page.getByRole('button', { name: '标记已修正：测试菜', exact: true }).focus(); await page.keyboard.press('Enter')
    for (let i = 0; i < 100 && !releaseIssue; i++) await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(typeof releaseIssue, 'function')
    const nickname = page.getByPlaceholder('请输入昵称'); await nickname.focus()
    holdIssue = false; releaseIssue()
    await page.getByRole('button', { name: '标记已修正：测试菜', exact: true }).waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '标记已修正：下一道菜', exact: true }).waitFor()
    assert.equal(await nickname.evaluate(node => document.activeElement === node), true, 'late issue updates must not steal focus from another control')
    issues = [{ _id: 'issue-1', mealId: { name: '测试菜' }, note: '待核对' }, { _id: 'issue-2', mealId: { name: '下一道菜' }, note: '第二条反馈' }]
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.getByRole('button', { name: '标记已修正：测试菜', exact: true }).focus(); await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '标记已修正：下一道菜')
    profileFailed = true
    await page.locator('.settings-card').filter({ hasText: '用户设置' }).getByRole('button', { name: '刷新', exact: true }).click()
    await page.locator('.settings-page').getByText('资料不可用').waitFor()
    assert.equal(await page.getByRole('button', { name: '导入缺失默认菜品' }).count(), 0)
    assert.equal(await page.getByText('暂无待修正图片').count(), 0)
    assert.equal(await page.getByText('请先加载并核对当前小家。').count(), 2)
    console.log('Settings governance checks passed: malformed data, independent recovery and unavailable profile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
