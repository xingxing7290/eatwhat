const assert = require('node:assert/strict')
const { chromium } = require('playwright')

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Editor checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1', username: 'test' })) })
    let holdA = false; let releaseA; let foreign = false; let failB = false; let writes = 0
    const meal = id => ({ _id: id, name: id === 'a' ? '菜品甲' : '菜品乙', ingredients: [], steps: [], photos: [], tags: [], supportsConditionalEdit: true, editVersion: { revision: `rev-${id}`, updatedAt: null } })
    await page.route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/auth/me') return route.fulfill({ json: { user: { id: 'u1', householdId: 'h1', username: 'test' }, household: { id: 'h1' } } })
      if (request.method() === 'GET' && (path === '/meals/a' || path === '/meals/b')) {
        const id = path.slice(-1)
        if (id === 'a' && holdA) await new Promise(resolve => { releaseA = resolve })
        if (id === 'b' && failB) return route.fulfill({ status: 503, json: { error: '暂时无法读取菜品' } })
        return route.fulfill({ json: meal(foreign && id === 'a' ? 'b' : id) })
      }
      if (request.method() !== 'GET') writes++
      return route.fulfill({ json: path === '/meal-image-issues' ? [] : {} })
    })
    const navigate = path => page.evaluate(target => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(target) }, path)
    const input = page.getByPlaceholder('给这道菜起个名字')
    await page.goto(`${base}/meals/editor/a`)
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品甲')
    await input.fill('尚未保存的草稿')
    await navigate('/meals/editor/b')
    await page.getByText('当前编辑内容尚未保存').waitFor()
    await page.getByRole('button', { name: '继续编辑' }).click()
    await page.getByText('当前编辑内容尚未保存').waitFor({ state: 'hidden' })
    assert.equal(new URL(page.url()).pathname, '/meals/editor/a')
    assert.equal(await input.inputValue(), '尚未保存的草稿')
    await navigate('/meals/editor/b')
    await page.getByRole('button', { name: '放弃并离开' }).click()
    await page.waitForURL('**/meals/editor/b')
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品乙')

    holdA = true
    await navigate('/meals/editor/a')
    for (let i = 0; i < 100 && !releaseA; i++) await new Promise(resolve => setTimeout(resolve, 50))
    assert.equal(typeof releaseA, 'function')
    assert.equal(await input.isDisabled(), true)
    assert.equal(await page.locator('.meal-editor').getAttribute('aria-busy'), 'true')
    await navigate('/meals/editor/b')
    await page.waitForURL('**/meals/editor/b')
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品乙')
    const lateResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/meals/a')
    releaseA(); await lateResponse
    await page.waitForTimeout(150)
    assert.equal(await input.inputValue(), '菜品乙', 'a late response must not replace the current recipe')

    holdA = false; foreign = true
    await navigate('/meals/editor/a')
    await page.getByText('无法加载菜品：菜品数据不完整或不属于当前页面').waitFor()
    assert.equal(await input.count(), 0)
    assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    foreign = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品甲')
    await navigate('/meals/editor')
    await page.waitForURL('**/meals/editor')
    assert.equal(await input.inputValue(), '')
    assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), false)
    failB = true
    await navigate('/meals/editor/b')
    await page.getByText('无法加载菜品：暂时无法读取菜品').waitFor()
    assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
    failB = false
    await page.getByRole('button', { name: '重新加载' }).click()
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品乙')
    assert.equal(writes, 0)
    console.log('Meal editor checks passed: draft guard, route switching, stale responses and retry')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
