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
      if (path === '/api/meals/categories') return route.fulfill({ json: [{ category: '家常菜', subcategory: '热菜' }, ...Array.from({ length: 30 }, (_, index) => ({ category: `分类${String(index + 1).padStart(2, '0')}`, subcategory: '' }))] })
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
    for (const label of ['标签', '分类', '子类', '难度']) assert.equal(await page.getByRole('combobox', { name: label, exact: true }).count(), 1)
    await toggle.click()
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    assert.equal(await chips.getByRole('button').count(), 6, 'collapsed controls retain visible filter context')
    for (const button of await chips.getByRole('button').all()) assert.ok((await button.boundingBox()).height >= 44)
    await toggle.click()
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 })
      for (const dark of [false, true]) {
        await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          const result = await contrast(page, '.active-filter-chip')
          assert.ok(result.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme}: ${result.ratio}`)
          const label = await contrast(page, '.filter-field-label')
          assert.ok(label.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} filter label: ${label.ratio}`)
          const hint = await contrast(page, '.search-hint')
          assert.ok(hint.ratio >= 4.5, `${width} ${dark ? 'dark' : 'light'} ${theme} search hint: ${hint.ratio}`)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 320, height: 844 })
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('长'.repeat(200))
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.getByRole('textbox', { name: '搜索菜品' }).fill('鸡蛋')
    await toggle.click()
    await chips.getByRole('button', { name: '移除分类：家常菜筛选' }).click()
    assert.equal(await chips.getByRole('button', { name: '移除子类：热菜筛选' }).count(), 0)
    assert.equal(await chips.getByRole('button', { name: '移除标签：清淡筛选' }).count(), 1)
    await page.waitForFunction(() => { const q = new URL(location.href).searchParams; return !q.has('category') && !q.has('subcategory') && q.get('tag') === '清淡' })
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('active-filter-chip')), true)
    await page.getByRole('complementary', { name: '菜品分类' }).getByRole('button', { name: '全部分类' }).click()
    assert.equal(await chips.getByRole('button', { name: '移除只看收藏筛选' }).count(), 0)
    assert.equal(await chips.getByRole('button', { name: '移除标签：清淡筛选' }).count(), 1)
    assert.equal(await page.getByRole('textbox', { name: '搜索菜品' }).inputValue(), '鸡蛋', 'all categories keeps search active')
    await chips.getByRole('button', { name: '移除标签：清淡筛选' }).click()
    await chips.getByRole('button', { name: '移除难度：简单筛选' }).click()
    await chips.getByRole('button', { name: '移除搜索：鸡蛋筛选' }).click()
    assert.equal(await chips.count(), 0)
    assert.equal(await toggle.evaluate(node => document.activeElement === node), true, 'removing last chip restores focus to filter control')
    await page.waitForFunction(() => location.search === '')
    assert.equal(await page.getByRole('textbox', { name: '搜索菜品' }).inputValue(), '')
    const search = page.getByRole('textbox', { name: '搜索菜品' })
    await search.fill('没有匹配')
    await page.getByRole('heading', { name: '没有找到匹配的菜品' }).waitFor()
    await page.getByRole('button', { name: '清除筛选', exact: true }).click()
    assert.equal(await search.inputValue(), '')
    assert.equal(await search.evaluate(node => document.activeElement === node), true, 'clearing from empty results focuses search')
    await search.fill('鸡蛋')
    await page.getByRole('button', { name: '清除', exact: true }).click()
    assert.equal(await search.inputValue(), '')
    assert.equal(await search.evaluate(node => document.activeElement === node), true, 'clearing from toolbar focuses search')
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 600 })
      await page.goto(`${base}/meals?category=${encodeURIComponent('分类30')}`)
      const sidebar = page.getByRole('complementary', { name: '菜品分类' })
      const selected = sidebar.getByRole('button', { name: '分类30', exact: true })
      await selected.waitFor({ state: 'attached' })
      await page.waitForFunction(() => {
        const box = document.querySelector('.category-sidebar'); const item = box?.querySelector('[data-category="分类30"]')
        if (!box || !item) return false
        const outer = box.getBoundingClientRect(); const inner = item.getBoundingClientRect()
        return box.scrollTop > 0 && inner.top >= outer.top && inner.bottom <= outer.bottom
      })
      assert.equal(await selected.getAttribute('aria-pressed'), 'true')
      assert.equal(await page.evaluate(() => window.scrollY), 0, 'revealing a sidebar category must not scroll the page')
    }
    console.log('Catalog chips passed: visible filters, individual removal, URL, keyboard focus and themes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
