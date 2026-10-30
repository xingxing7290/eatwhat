const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Recipe image tests require a local server')
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="green"/></svg>'
async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const images = []; const errors = []; let savedFields; page.on('pageerror', error => errors.push(error.message))
    const meals = [
      { _id: 'local', name: '旧地址图片', category: '家常', imageUrl: 'http://127.0.0.1/uploads/local.png?v=2#photo', ingredients: [], steps: [{ description: '第一步', imageUrl: 'http://127.0.0.1/uploads/local.png?v=2#photo' }, { description: '第二步', imageUrl: 'https://cdn.example.test/uploads/external.png?v=4' }], tags: [], photos: [...Array(3).fill('http://127.0.0.1/uploads/local.png?v=2#photo'), 'https://cdn.example.test/uploads/external.png?v=4'], supportsConditionalEdit: true, editVersion: { revision: 'v1', updatedAt: null } },
      { _id: 'external', name: '外部图片', category: '家常', imageUrl: 'https://cdn.example.test/uploads/external.png?v=4', ingredients: [], steps: [], tags: [], photos: [] },
      { _id: 'invalid', name: '异常图片', category: '家常', imageUrl: { bad: true }, ingredients: [], steps: [], tags: [], photos: [] }
    ]
    await page.route('**/uploads/**', route => {
      const url = new URL(route.request().url()); images.push(url.href)
      if (url.origin === base && url.pathname === '/api/uploads/local.png') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
      if (url.origin === base && url.pathname === '/api/uploads/external.png') return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
      return route.fulfill({ status: 404, body: '' })
    })
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/meals') return route.fulfill({ json: { data: meals, total: meals.length, page: 1, limit: 8 } })
      if (path === '/meals/categories') return route.fulfill({ json: [{ category: '家常' }] })
      if (path === '/meals/tags' || path === '/wishlist' || path === '/memories') return route.fulfill({ json: [] })
      if (path === '/meals/local' && route.request().method() === 'PUT') {
        const body = route.request().postData()
        const field = name => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1]
        savedFields = { imageUrl: field('imageUrl'), photos: JSON.parse(field('existingPhotos')), steps: JSON.parse(field('steps')) }
        return route.fulfill({ json: meals[0] })
      }
      if (path === '/meals/local') return route.fulfill({ json: meals[0] })
      return route.fulfill({ json: {} })
    })
    await page.route('**/api/uploads/**', route => {
      const url = new URL(route.request().url()); images.push(url.href)
      return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg })
    })
    await page.goto(`${base}/meals`)
    const card = name => page.locator('.meal-card-wrapper').filter({ hasText: name })
    await card('旧地址图片').locator('img').waitFor()
    await page.waitForFunction(() => { const image = [...document.querySelectorAll('.meal-card-wrapper')].find(item => item.textContent.includes('旧地址图片'))?.querySelector('img'); return image?.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/local.png?v=2') })
    await card('外部图片').locator('img[alt="图片暂不可用"]').waitFor()
    await card('异常图片').locator('img').waitFor()
    await card('外部图片').getByText('图片暂不可用', { exact: true }).waitFor()
    await card('异常图片').getByText('暂无菜图', { exact: true }).waitFor()
    assert.equal(await card('旧地址图片').locator('.image-notice').count(), 0, 'successful images must not be marked unavailable')
    assert.ok((await contrast(page, '.image-notice')).ratio >= 4.5, 'image availability notice must remain readable')
    assert.ok(images.some(url => url.startsWith(`${base}/uploads/local.png?v=2`)))
    assert.ok(images.some(url => url.startsWith(`${base}/api/uploads/local.png?v=2`)))
    assert.equal(images.some(url => url.includes('/api/uploads/external.png')), false, 'external failures must not load a local image with the same name')
    await page.getByRole('radio', { name: '列表视图' }).focus(); await page.keyboard.press('Space')
    await page.waitForFunction(() => { const image = [...document.querySelectorAll('.meal-list-item')].find(item => item.textContent.includes('旧地址图片'))?.querySelector('img'); return image?.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/local.png?v=2') })
    await page.locator('.meal-list-item').filter({ hasText: '外部图片' }).locator('img[alt="图片暂不可用"]').waitFor()
    await page.getByRole('radio', { name: '表格视图' }).focus(); await page.keyboard.press('Space')
    await page.waitForFunction(() => [...document.querySelectorAll('.table-image img')].some(image => image.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/local.png?v=2')))
    await page.getByRole('radio', { name: '网格视图' }).focus(); await page.keyboard.press('Space')
    await page.getByRole('button', { name: '查看旧地址图片' }).first().click()
    await page.waitForFunction(() => { const image = document.querySelector('.hero img'); return image?.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/local.png?v=2') })
    assert.equal(images.some(url => url.includes('/api/uploads/external.png')), false)
    await page.goto(`${base}/meals/editor/local`)
    await page.waitForFunction(() => ['.cover-box img', '.step-item img', '.photo-item img'].every(selector => { const image = document.querySelector(selector); return image?.complete && image.naturalWidth > 0 && image.src.includes('/api/uploads/local.png?v=2') }))
    await page.locator('.step-item').nth(1).locator('img[alt="图片暂不可用"]').waitFor()
    assert.equal(images.some(url => url.includes('/api/uploads/external.png')), false)
    assert.equal(await page.locator('.photo-item').count(), 4)
    await page.getByRole('button', { name: '移除已有菜品照片 1' }).focus(); await page.keyboard.press('Enter')
    assert.equal(await page.locator('.photo-item').count(), 3, 'removing one duplicate must preserve the others')
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('撤销最近移除'))
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('.photo-item').count(), 4)
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '移除已有菜品照片 1')
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false, 'undo restores the clean draft when it was the only change')
    await page.getByRole('button', { name: '移除已有菜品照片 1' }).click()
    await page.getByRole('button', { name: '移除已有菜品照片 3' }).click()
    await page.getByText('已移除 2 张，保存后生效。').waitFor()
    await page.getByRole('button', { name: '撤销最近移除' }).click()
    assert.equal(await page.locator('.photo-item').count(), 3)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        for (const selector of ['.photo-undo span', '.photo-undo button']) {
          const result = await contrast(page, selector)
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${theme} ${selector}: ${JSON.stringify(result)}`)
        }
      }
    }
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.equal(savedFields.imageUrl, meals[0].imageUrl)
    assert.deepEqual(savedFields.photos, meals[0].photos.slice(1))
    assert.deepEqual(savedFields.steps.map(step => step.imageUrl), meals[0].steps.map(step => step.imageUrl))
    assert.deepEqual(errors, [])
    console.log('Recipe image checks passed: legacy URLs, local retry, external isolation and view consistency')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
