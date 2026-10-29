const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Avatar tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a' }))
    })
    const member = { _id: 'u1', displayName: '小' + '家庭成员'.repeat(70), avatarUrl: '/uploads/member.jpg' }
    const profile = { user: { id: 'u1', householdId: 'home-a', displayName: '小明', avatarUrl: '/uploads/profile.jpg' }, household: { id: 'home-a', name: '甲家庭', inviteCode: 'CODE', members: [member, { _id: 'u2', username: '家人', avatarUrl: 'javascript:alert(1)' }] } }
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') return route.fulfill({ json: profile })
      if (path === '/api/default-meals/status') return route.fulfill({ json: { total: 0, imported: 0, missing: 0 } })
      if (path === '/api/meal-image-issues') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    const requests = []
    let imagesWorking = false
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=', 'base64')
    await page.route('**/uploads/**', route => { requests.push(new URL(route.request().url()).pathname); return imagesWorking ? route.fulfill({ contentType: 'image/png', body: png }) : route.fulfill({ status: 404 }) })
    await page.goto(`${base}/settings`)
    await page.locator('.avatar-preview .avatar-placeholder').waitFor()
    await page.locator('.member-item').first().locator('[aria-label="头像不可用"]').waitFor()
    assert.ok(requests.includes('/uploads/profile.jpg') && requests.includes('/api/uploads/profile.jpg'))
    assert.ok(requests.includes('/uploads/member.jpg') && requests.includes('/api/uploads/member.jpg'))
    assert.equal(await page.locator('.member-item').nth(1).locator('img').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.avatar-placeholder', '.member-avatar span', '.member-name']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${result.ratio}`)
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      }
    }
    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=', 'base64') })
    const preview = page.locator('.avatar-preview img')
    await preview.waitFor()
    assert.match(await preview.getAttribute('src'), /^blob:/)
    assert.equal(await page.getByRole('button', { name: '上传头像' }).isEnabled(), true)
    await page.getByRole('button', { name: '刷新', exact: true }).first().click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.match(await preview.getAttribute('src'), /^blob:/)
    imagesWorking = true
    await page.getByRole('button', { name: '刷新', exact: true }).first().click()
    await page.getByRole('button', { name: '放弃并刷新' }).click()
    await page.waitForFunction(() => document.querySelector('.avatar-preview img')?.naturalWidth > 0)
    await page.waitForFunction(() => document.querySelector('.member-avatar img')?.naturalWidth > 0)
    console.log('Settings avatars passed: safe paths, missing images, theme contrast, long names and draft preview')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
