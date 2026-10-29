const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Catalog tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/categories') return route.fulfill({ json: [{ category: '家常菜', subcategory: '热菜' }] })
      if (path === '/api/meals/tags') return route.fulfill({ json: ['清淡'] })
      if (path === '/api/meals') return route.fulfill({ json: { data: [], total: 0, page: 1, limit: 8 } })
      return route.fulfill({ json: {} })
    })
    const query = new URLSearchParams({ q: '鸡蛋', category: '家常菜', subcategory: '热菜', tag: '清淡', difficulty: 'easy', favorite: '1' })
    await page.goto(`${base}/meals?${query}`)
    const chips = page.getByRole('group', { name: '当前筛选条件' })
    await chips.getByRole('button', { name: '移除搜索：鸡蛋筛选' }).waitFor()
    for (const label of ['分类：家常菜', '子类：热菜', '标签：清淡', '难度：简单', '只看收藏']) assert.equal(await chips.getByRole('button', { name: `移除${label}筛选` }).count(), 1)
    const toggle = page.getByRole('button', { name: '筛选', exact: true })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
    await toggle.click()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(await chips.getByRole('button').count(), 6, 'collapsed controls retain visible filter context')
    for (const button of await chips.getByRole('button').all()) assert.ok((await button.boundingBox()).height >= 44)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          const result = await contrast(page, '.active-filter-chip')
          assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme}: ${result.ratio}`)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 844 })
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('长'.repeat(200))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('鸡蛋')
    await chips.getByRole('button', { name: '移除分类：家常菜筛选' }).click()
    assert.equal(await chips.getByRole('button', { name: '移除子类：热菜筛选' }).count(), 0)
    assert.equal(await chips.getByRole('button', { name: '移除标签：清淡筛选' }).count(), 1)
    await page.waitForFunction(() => { const q = new URL(location.href).searchParams; return !q.has('category') && !q.has('subcategory') && q.get('tag') === '清淡' })
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('active-filter-chip')), true)
    await chips.getByRole('button', { name: '移除标签：清淡筛选' }).click()
    await chips.getByRole('button', { name: '移除难度：简单筛选' }).click()
    await chips.getByRole('button', { name: '移除只看收藏筛选' }).click()
    await chips.getByRole('button', { name: '移除搜索：鸡蛋筛选' }).click()
    assert.equal(await chips.count(), 0)
    assert.equal(await toggle.evaluate(node => document.activeElement === node), true, 'removing last chip restores focus to filter control')
    await page.waitForFunction(() => location.search === '')
    assert.equal(await page.getByRole('textbox', { name: '搜索菜品' }).inputValue(), '')
    console.log('Catalog chips passed: visible filters, individual removal, URL, keyboard focus and themes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
