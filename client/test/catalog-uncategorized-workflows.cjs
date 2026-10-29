const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Catalog tests require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } })
    page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const meals = [{ _id: 'one', name: '无分类菜', category: '', tags: [] }, { _id: 'two', name: '有分类菜', category: '热菜', tags: [] }, { _id: 'three', name: '同名分类菜', category: '未填写分类', tags: [] }]
    let mode = 'new'; let categoryMode = 'valid'; const requests = []
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()); const path = url.pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/categories') {
        if (categoryMode === 'failed') return route.fulfill({ status: 503, json: { error: '分类暂不可用' } })
        return route.fulfill({ json: categoryMode === 'missing' ? [{ category: '热菜', subcategory: '' }] : [{ category: '', subcategory: '', count: 1 }, { category: '热菜', subcategory: '', count: 2 }, { category: '热菜', subcategory: '小炒', count: 3 }, { category: '未填写分类', subcategory: '', count: 1 }] })
      }
      if (path === '/api/meals/tags') return route.fulfill({ json: [] })
      if (path === '/api/meals') {
        requests.push(url.searchParams.toString())
        if (mode === 'legacy') return route.fulfill({ json: meals })
        const rows = mode === 'new' && url.searchParams.get('uncategorized') === '1' ? meals.filter(item => !item.category) : mode === 'new' && url.searchParams.get('category') ? meals.filter(item => item.category === url.searchParams.get('category')) : meals
        return route.fulfill({ json: { data: rows, total: rows.length, page: 1, limit: 8, ...(mode === 'new' ? { supportsUncategorizedFilter: true } : {}) } })
      }
      return route.fulfill({ json: [] })
    })
    await page.goto(`${base}/meals`)
    const sidebar = page.getByRole('complementary', { name: '菜品分类' })
    await page.getByRole('button', { name: '查看有分类菜' }).first().waitFor()
    await page.getByText('数字为上次更新时的分类总数，不随搜索和筛选变化。').waitFor()
    assert.equal(await sidebar.getByRole('button', { name: '热菜' }).getAttribute('aria-description'), '分类总数 5 道')
    assert.equal(await sidebar.getByRole('button', { name: '未填写分类', exact: true }).getAttribute('aria-description'), '分类总数 1 道')
    await sidebar.getByRole('button', { name: '未填写分类', exact: true }).click()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    await page.waitForFunction(() => new URL(location.href).searchParams.get('uncategorized') === '1')
    assert.ok(requests.some(query => new URLSearchParams(query).get('uncategorized') === '1'))
    await page.reload()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await sidebar.getByRole('button', { name: '未填写分类', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: '筛选', exact: true }).click()
    const categorySelect = page.getByRole('combobox', { name: '分类', exact: true })
    await page.locator('.filter-item').filter({ has: categorySelect }).getByText('未填写分类', { exact: true }).waitFor()
    await categorySelect.focus(); await page.keyboard.press('Enter'); await page.getByRole('option', { name: '热菜', exact: true }).click()
    await page.getByRole('button', { name: '查看有分类菜' }).first().waitFor()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('category') === '热菜')
    await categorySelect.focus(); await page.keyboard.press('Enter'); await page.getByRole('option', { name: '分类：未填写分类', exact: true }).click()
    await page.getByRole('button', { name: '查看同名分类菜' }).first().waitFor()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('category') === '未填写分类')
    await categorySelect.focus(); await page.keyboard.press('Enter'); await page.getByRole('option', { name: '未填写分类', exact: true }).click()
    await page.getByRole('button', { name: '查看无分类菜' }).first().waitFor()
    await page.waitForFunction(() => new URL(location.href).searchParams.get('uncategorized') === '1')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const dark of [false, true]) for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
      await page.evaluate(({ dark, theme }) => { document.documentElement.classList.toggle('dark', dark); document.querySelector('.app-container').classList.toggle('dark-mode', dark); document.documentElement.dataset.theme = theme }, { dark, theme })
      assert.ok((await contrast(page, '.category-count-note')).ratio >= 4.5, `count note contrast: ${dark} ${theme}`)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    }
    categoryMode = 'missing'; await sidebar.getByRole('button', { name: '更新分类' }).click()
    await page.getByText('数字为上次更新时的分类总数，不随搜索和筛选变化。').waitFor({ state: 'hidden' })
    await sidebar.getByRole('button', { name: '更新分类' }).waitFor()
    assert.equal(await sidebar.getByRole('button', { name: '热菜' }).getAttribute('aria-description'), null, 'old metadata without counts must not imply a zero count')
    categoryMode = 'failed'; await sidebar.getByRole('button', { name: '更新分类' }).click()
    await page.getByText('分类可能不完整').waitFor()
    assert.equal(await sidebar.getByRole('button', { name: '未填写分类', exact: true }).getAttribute('aria-pressed'), 'true')
    categoryMode = 'valid'; await sidebar.getByRole('button', { name: '重试' }).click()
    await page.getByText('数字为上次更新时的分类总数，不随搜索和筛选变化。').waitFor()
    mode = 'old-paged'; await page.reload()
    await page.getByText('当前服务器不支持未分类筛选', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    mode = 'legacy'; await page.reload()
    await page.getByText('筛选结果 · 1 道').waitFor()
    assert.equal(await page.getByRole('button', { name: '查看有分类菜' }).count(), 0)
    await page.getByRole('button', { name: '移除分类：未填写分类（空值）筛选' }).click()
    await page.getByText('全部菜品 · 3 道').waitFor()
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('uncategorized'))
    console.log('Catalog uncategorized filtering passed: scoped capability, links, legacy servers and mobile')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
