const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Editor checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1', username: 'test' })) })
    let holdA = false; let releaseA; let foreign = false; let failB = false; let writes = 0; let submittedIngredients
    const meal = id => ({ _id: id, name: id === 'a' ? '菜品甲' : '菜品乙', ingredients: id === 'b' ? [{ name: '鸡蛋', amount: '2个' }] : [], steps: [], photos: [], tags: [], supportsConditionalEdit: true, editVersion: { revision: `rev-${id}`, updatedAt: null } })
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
      if (request.method() === 'PUT' && path === '/meals/b') {
        writes++
        const match = request.postData()?.match(/name="ingredients"\r\n\r\n([^\r]*)/)
        submittedIngredients = match && JSON.parse(match[1])
        return route.fulfill({ json: meal('b') })
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
    await page.getByText('已生成的购物清单不会自动更新', { exact: false }).waitFor()
    const ingredient = page.getByRole('textbox', { name: '第 1 项食材名称' })
    const amount = page.getByRole('textbox', { name: '第 1 项食材用量' })
    assert.equal(await ingredient.inputValue(), '鸡蛋')
    assert.equal(await amount.inputValue(), '2个')
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      assert.ok((await page.getByRole('button', { name: '删除第 1 项食材' }).boundingBox()).height >= 44)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.ingredient-help', '.ingredient-item label span']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
      }
    }
    await ingredient.fill('   ')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('第 1 项食材名称不能为空', { exact: false }).waitFor()
    assert.equal(writes, 0, 'an empty ingredient cannot be saved')
    await ingredient.fill(' 鸡蛋 ')
    await amount.fill(' 4个 ')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.deepEqual(submittedIngredients, [{ name: '鸡蛋', amount: '4个' }])
    assert.equal(writes, 1)
    console.log('Meal editor checks passed: draft guard, route switching, stale responses and retry')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
