const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Navigation tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } })
    const page = await context.newPage()
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a', household: { id: 'home-a', name: '星星的小家' }, displayName: '很长的家庭成员名字用于验证显示' })) })
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'home-a' } })
      if (path === '/api/auth/me') return route.fulfill({ json: { user: { id: 'u1', householdId: 'home-a' }, household: { id: 'home-a', name: '小家', inviteCode: 'CODE', members: [{ _id: 'u1' }] } } })
      if (path === '/api/default-meals/status') return route.fulfill({ json: { total: 0, imported: 0, missing: 0 } })
      if (path === '/api/meal-image-issues') return route.fulfill({ json: [] })
      if (path === '/api/schedules/day/2026-10-28') return route.fulfill({ json: { date: '2026-10-28', scheduleExists: false, scheduleVersion: null, meals: { breakfast: [], lunch: [], dinner: [] } } })
      if (path === '/api/meals') return route.fulfill({ json: { data: [], total: 0, page: 1, limit: 8 } })
      if (path === '/api/meals/categories' || path === '/api/meals/tags') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/guest-orders`)
    const more = page.getByRole('button', { name: '更多功能' })
    await more.waitFor()
    await page.locator('.user-household').getByText('星星的小家').waitFor()
    assert.match(await page.locator('.user-menu-btn').getAttribute('aria-label'), /星星的小家/)
    await page.evaluate(async () => { const { replaceSessionUser } = await import('/src/services/sessionScope.js'); replaceSessionUser({ id: 'u1', householdId: 'home-a', household: { id: 'other-home', name: '错误家庭' }, displayName: '测试用户' }) })
    await page.locator('.user-household').getByText('小家信息待确认').waitFor()
    assert.equal(await page.locator('.user-household').getByText('错误家庭').count(), 0)
    await page.evaluate(async () => { const { replaceSessionUser } = await import('/src/services/sessionScope.js'); replaceSessionUser({ id: 'u1', householdId: 'home-a', household: { id: 'home-a', name: '星星的小家' }, displayName: '很长的家庭成员名字用于验证显示' }) })
    await page.locator('.user-household').getByText('星星的小家').waitFor()
    const otherTab = await page.context().newPage()
    await otherTab.goto(`${base}/login`)
    await otherTab.evaluate(() => localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'home-a', household: { id: 'home-a', name: '更新后的小家' }, displayName: '测试用户' })))
    await page.locator('.user-household').getByText('更新后的小家').waitFor()
    await otherTab.close()
    await page.waitForFunction(() => document.querySelector('.nav-more')?.getAttribute('aria-current') === 'location')
    assert.equal(await more.getAttribute('aria-current'), 'location')
    assert.equal(await more.getAttribute('aria-description'), '当前：宴请点菜')
    assert.match(await more.innerText(), /宴请点菜/)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const width of [769, 900, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          const result = await contrast(page, '.nav-more')
          assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme}: ${result.ratio}`)
          const householdContrast = await contrast(page, '.user-household')
          assert.ok(householdContrast.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} household: ${householdContrast.ratio}`)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
          const bounds = await page.evaluate(() => { const a = document.querySelector('.nav-more').getBoundingClientRect(); const b = document.querySelector('.header-right').getBoundingClientRect(); return { right: a.right, left: b.left } })
          assert.ok(bounds.right <= bounds.left, `${width}: header sections overlap ${JSON.stringify(bounds)}`)
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 844 })
    await more.click()
    await page.getByRole('link', { name: '设置', exact: true }).click()
    await page.waitForURL('**/settings')
    assert.equal(await more.getAttribute('aria-description'), '当前：设置')
    await page.evaluate(async () => { const { default: router } = await import('/src/router/index.js'); await router.push('/meals/detail/test-id') })
    await page.waitForURL('**/meals/detail/test-id')
    assert.equal(await more.getAttribute('aria-current'), null)
    const meals = page.locator('.desktop-nav').getByRole('link', { name: '菜品' })
    assert.equal(await meals.getAttribute('aria-current'), 'location')
    assert.equal(await meals.evaluate(node => node.classList.contains('section-active')), true)
    await page.evaluate(async () => { const { default: router } = await import('/src/router/index.js'); await router.push('/selection?date=2026-10-28&mealType=dinner') })
    await page.waitForURL('**/selection?date=2026-10-28&mealType=dinner')
    const calendar = page.locator('.desktop-nav').getByRole('link', { name: '日历' })
    assert.equal(await calendar.getAttribute('aria-current'), 'location')
    assert.equal(await calendar.evaluate(node => node.classList.contains('section-active')), true)
    assert.equal(await meals.getAttribute('aria-current'), null)
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.desktop-nav .nav-link.section-active')
        assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} selected calendar: ${result.ratio}`)
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    assert.equal(await page.locator('.mobile-nav').getByRole('link', { name: '日历' }).getAttribute('aria-current'), 'location')
    await page.locator('.mobile-user-text').getByText('小家：小家').waitFor()
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.mobile-nav-link.section-active')
        assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} mobile selected calendar: ${result.ratio}`)
      }
    }
    await page.locator('.mobile-nav').getByRole('link', { name: '菜品' }).click()
    await page.waitForURL('**/meals')
    await page.waitForFunction(() => document.querySelector('.mobile-nav')?.getAttribute('aria-hidden') === 'true')
    await page.getByRole('button', { name: '打开导航菜单' }).click()
    assert.equal(await page.locator('.mobile-nav').getByRole('link', { name: '菜品' }).getAttribute('aria-current'), 'page')
    console.log('Desktop navigation checks passed: current section, detail context, responsive layout and themes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
