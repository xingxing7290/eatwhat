const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Editor checks require a local server')
async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 844 } }); page.setDefaultTimeout(12000)
    await page.addInitScript(() => { localStorage.setItem('token', 'test'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let mode = 'empty'; let writes = 0; let imageStep = false
    const loaded = { _id: 'a', name: '原菜', householdId: 'h1', ingredients: [], steps: [], photos: [], tags: [], supportsConditionalEdit: true, editVersion: { revision: 'v1', updatedAt: null } }
    await page.route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname
      if (path === '/api/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/api/meals/a' && request.method() === 'GET') return route.fulfill({ json: loaded })
      if ((path === '/api/meals/a' && request.method() === 'PUT') || (path === '/api/meals' && request.method() === 'POST')) {
        writes++
        const expectedId = request.method() === 'PUT' ? 'a' : 'new-id'
        const expectedName = request.method() === 'PUT' ? '修改后的菜' : '新建菜'
        const response = mode === 'empty' ? {} : { _id: mode === 'wrong-id' ? 'other-id' : expectedId, name: mode === 'wrong-name' ? '错误菜名' : expectedName, householdId: mode === 'wrong-home' ? 'h2' : 'h1', ingredients: mode === 'wrong-ingredient' ? [{ name: '错误食材', amount: '' }] : [], steps: mode === 'wrong-step' ? [{ description: '错误步骤', imageUrl: '' }] : imageStep && request.method() === 'POST' ? [{ description: '', imageUrl: mode === 'missing-image' ? '' : '/uploads/step.png' }] : [] }
        if (mode === 'missing-fields') delete response.steps
        return route.fulfill({ json: response })
      }
      if (path === '/api/meals') return route.fulfill({ json: { data: [], total: 0, page: 1, limit: 8 } })
      return route.fulfill({ json: [] })
    })
    const nameInput = page.getByPlaceholder('给这道菜起个名字')
    const acknowledge = async () => {
      await page.getByRole('button', { name: '已核对，允许重试' }).click()
      await page.getByRole('dialog', { name: '确认已核对' }).getByRole('button', { name: '已核对，允许重试' }).click()
    }
    await page.goto(`${base}/meals/editor/a`)
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '原菜')
    await nameInput.fill('修改后的菜')
    await page.getByRole('textbox', { name: '新食材名称' }).fill('保留草稿')
    for (const fault of ['empty', 'wrong-id', 'wrong-name', 'wrong-home', 'wrong-ingredient', 'wrong-step', 'missing-fields']) {
      mode = fault
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await page.getByRole('dialog', { name: '检查未添加的内容' }).getByRole('button', { name: '仍要保存' }).click()
      await page.getByText('保存结果未确认，请先在菜谱列表核对，避免重复提交。').waitFor()
      assert.equal(new URL(page.url()).pathname, '/meals/editor/a')
      assert.equal(await nameInput.inputValue(), '修改后的菜')
      assert.equal(await page.getByRole('textbox', { name: '新食材名称' }).inputValue(), '保留草稿')
      assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
      await acknowledge()
    }
    mode = 'valid'
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByRole('dialog', { name: '检查未添加的内容' }).getByRole('button', { name: '仍要保存' }).click()
    await page.waitForURL('**/meals')
    assert.equal(writes, 8)
    await page.goto(`${base}/meals/editor`)
    await nameInput.fill('新建菜')
    const description = page.getByRole('textbox', { name: '简介' })
    await description.fill('🍅'.repeat(1001))
    await page.getByText('1001 / 1000 字，请删减后保存').waitFor()
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('菜品简介不能超过 1000 字').waitFor()
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-describedby')?.includes('description-count'))
    assert.equal(writes, 8, 'overlong description must not send a request')
    assert.equal((await description.inputValue()).length, 2002, 'existing long text must not be truncated')
    await description.fill('❤️'.repeat(1000))
    await page.getByText('1000 / 1000 字', { exact: true }).waitFor()
    await description.fill('🍅'.repeat(1000))
    await page.getByText('1000 / 1000 字', { exact: true }).waitFor()
    mode = 'empty'; await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('保存结果未确认，请先在菜谱列表核对，避免重复提交。').waitFor()
    assert.equal(await nameInput.inputValue(), '新建菜')
    await acknowledge()
    await page.locator('.step-editor input[type="file"]').setInputFiles({ name: 'step.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aKsAAAAASUVORK5CYII=', 'base64') })
    await page.getByRole('button', { name: '添加步骤', exact: true }).click()
    await page.getByRole('img', { name: '步骤 1 图片' }).waitFor()
    imageStep = true; mode = 'missing-image'
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('保存结果未确认，请先在菜谱列表核对，避免重复提交。').waitFor()
    await page.getByRole('img', { name: '步骤 1 图片' }).waitFor()
    await acknowledge()
    mode = 'valid'; await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.equal(writes, 11)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('Recipe save receipts passed: identity, household, missing response and draft preservation')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
