const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Memory tests require a local test server')
const image = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E'
const meals = Array.from({ length: 75 }, (_, i) => ({ _id: `meal-${String(i + 1).padStart(2, '0')}`, name: `菜品${String(i + 1).padStart(2, '0')}` }))

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ username: 'test' })) })
    const errors = []; const reads = []; let saved = ''; let deleted = false
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/broken-memory.png', route => route.fulfill({ status: 404, body: '' }))
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      let data = {}
      if (req.method() === 'GET' && path === '/auth/me') data = { user: { id: 'u1', username: 'test' }, household: { id: 'home', name: '测试家庭', members: [] } }
      else if (req.method() === 'GET' && path === '/memories') data = deleted ? [] : [{ _id: 'memory-a', date: '2026-10-28', mealType: 'dinner', title: '回忆一', photos: [image, '/broken-memory.png'], mealIds: [] }]
      else if (req.method() === 'POST' && path === '/memories') { saved = req.postData(); data = { _id: 'created' } }
      else if (req.method() === 'DELETE' && path === '/memories/memory-a') { deleted = true; return route.fulfill({ status: 503, json: { error: '无法确认' } }) }
      else if (req.method() === 'GET' && path === '/meals') {
        reads.push(Object.fromEntries(url.searchParams)); const query = url.searchParams.get('search') || ''; const found = meals.filter(meal => meal.name.includes(query))
        data = { data: found.slice(0, 50), total: found.length, page: 1, limit: 50 }
      } else if (req.method() === 'GET' && path.startsWith('/meals/')) data = meals.find(meal => `/meals/${meal._id}` === path) || null
      await route.fulfill({ status: 200, json: data })
    })
    await page.goto(`${base}/memories`)
    await page.getByText('回忆一', { exact: true }).waitFor()
    assert.equal(reads.length, 0, 'Timeline should not load the whole meal catalog')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('button', { name: '查看回忆一的第 1 张照片' }).click()
    const viewer = page.getByRole('dialog', { name: '饭后照片' })
    await viewer.getByText('1 / 2').waitFor()
    await page.keyboard.press('ArrowRight')
    await viewer.getByText('2 / 2').waitFor()
    await viewer.locator('img[alt="图片暂不可用"]').waitFor()
    await page.keyboard.press('ArrowLeft')
    await viewer.getByText('1 / 2').waitFor()
    await page.keyboard.press('Escape')
    await viewer.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: '记录一餐' }).click()
    const dialog = page.getByRole('dialog', { name: '记录饭后回忆' })
    const search = dialog.getByRole('combobox', { name: '搜索相关菜品' })
    await search.click()
    await page.getByText('仅显示前 50 道', { exact: false }).waitFor()
    assert.equal(reads[0].limit, '50')
    await page.getByRole('option', { name: '菜品01', exact: true }).click()
    await search.click()
    await search.fill('菜品75')
    try { await page.getByRole('option', { name: '菜品75', exact: true }).click() } catch (error) { console.error('Meal reads:', reads, 'Visible options:', await page.getByRole('option').allTextContents()); throw error }
    await dialog.getByRole('button', { name: '保存', exact: true }).click()
    await dialog.waitFor({ state: 'hidden' })
    assert.match(saved, /meal-01/); assert.match(saved, /meal-75/)
    await page.getByRole('button', { name: '删除回忆一' }).click()
    await page.getByRole('button', { name: '确定', exact: true }).click()
    await page.getByText('删除结果未确认', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '记录一餐' }).isDisabled(), true)
    await page.getByRole('button', { name: '重新加载并核对' }).click()
    await page.getByText('还没有饭后回忆').waitFor()
    const initialReads = reads.length
    await page.goto(`${base}/memories?new=1&mealId=meal-75`)
    const deepDialog = page.getByRole('dialog', { name: '记录饭后回忆' })
    const title = deepDialog.getByPlaceholder('比如：周五晚上的番茄牛腩')
    await title.waitFor()
    assert.equal(await title.inputValue(), '做过一次：菜品75')
    assert.equal(reads.length, initialReads, 'Deep link should fetch a single meal, not the catalog')
    assert.deepEqual(errors, [])
    console.log('Memory workflows passed: lazy search, selection, preview, uncertain deletion and deep link')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
