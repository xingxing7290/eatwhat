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
    let holdA = false; let releaseA; let foreign = false; let failB = false; let malformed = ''; let writes = 0; let submittedIngredients; let submittedSteps; let submittedBody
    const originalCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'
    const meal = id => ({ _id: id, name: id === 'a' ? '菜品甲' : '菜品乙', imageUrl: originalCover, ingredients: id === 'b' ? [{ name: '鸡蛋', amount: '2个' }] : [], steps: id === 'b' ? [{ description: '炒熟', imageUrl: '' }, { description: '', imageUrl: '/uploads/step.jpg' }] : [], photos: [], tags: [], supportsConditionalEdit: true, editVersion: { revision: `rev-${id}`, updatedAt: null } })
    await page.route('**/api/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/auth/me') return route.fulfill({ json: { user: { id: 'u1', householdId: 'h1', username: 'test' }, household: { id: 'h1' } } })
      if (request.method() === 'GET' && (path === '/meals/a' || path === '/meals/b')) {
        const id = path.slice(-1)
        if (id === 'a' && holdA) await new Promise(resolve => { releaseA = resolve })
        if (id === 'b' && failB) return route.fulfill({ status: 503, json: { error: '暂时无法读取菜品' } })
        const data = meal(foreign && id === 'a' ? 'b' : id)
        if (id === 'a' && malformed === 'missing-name') data.ingredients = [{ amount: '少许' }]
        if (id === 'a' && malformed === 'bad-ingredient') data.ingredients = [{ name: { text: '鸡蛋' }, amount: '2个' }]
        if (id === 'a' && malformed === 'bad-step') data.steps = [{ description: '炒熟', imageUrl: { url: '/bad' } }]
        return route.fulfill({ json: data })
      }
      if (request.method() === 'PUT' && path === '/meals/b') {
        writes++
        submittedBody = request.postData()
        const match = request.postData()?.match(/name="ingredients"\r\n\r\n([^\r]*)/)
        submittedIngredients = match && JSON.parse(match[1])
        const stepMatch = request.postData()?.match(/name="steps"\r\n\r\n([^\r]*)/)
        submittedSteps = stepMatch && JSON.parse(stepMatch[1])
        return route.fulfill({ json: meal('b') })
      }
      if (request.method() !== 'GET') writes++
      return route.fulfill({ json: path === '/meal-image-issues' ? [] : {} })
    })
    const navigate = path => page.evaluate(target => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(target) }, path)
    const input = page.getByPlaceholder('给这道菜起个名字')
    malformed = 'missing-name'
    await page.goto(`${base}/meals/editor/a`)
    assert.equal(await page.getByRole('textbox', { name: '第 1 项食材名称' }).inputValue(), '')
    assert.equal(await page.getByRole('textbox', { name: '第 1 项食材用量' }).inputValue(), '少许')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('第 1 项食材名称不能为空', { exact: false }).waitFor()
    assert.equal(writes, 0)
    for (const fault of ['bad-ingredient', 'bad-step']) {
      malformed = fault; await page.reload()
      await page.getByText('无法加载菜品：菜品数据不完整或不属于当前页面').waitFor()
      assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isDisabled(), true)
      assert.equal(writes, 0)
    }
    malformed = ''
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
    const photo = { name: 'preview.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aKsAAAAASUVORK5CYII=', 'base64') }
    const cover = page.locator('.side-column .el-card').first()
    await cover.locator('input[type="file"]').setInputFiles(photo)
    await page.getByRole('button', { name: '撤销封面选择' }).click()
    assert.equal(await cover.getByAltText('菜品封面预览').getAttribute('src'), originalCover, 'undo restores the existing cover')
    await cover.locator('input[type="file"]').setInputFiles(photo)
    await page.getByRole('button', { name: '撤销封面选择' }).click()
    const stepUpload = page.locator('.step-editor input[type="file"]')
    await stepUpload.setInputFiles(photo)
    await page.getByRole('img', { name: '待添加步骤图' }).waitFor()
    await page.getByRole('button', { name: '移除待添加步骤图' }).click()
    assert.equal(await page.getByRole('img', { name: '待添加步骤图' }).count(), 0)
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false, 'undoing image selections leaves a clean draft')
    await page.getByRole('button', { name: '移除第 2 步图片' }).click()
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('第 2 步没有文字或图片', { exact: false }).waitFor()
    assert.equal(writes, 0, 'removing the only content of a step must not save an empty step')
    await page.getByRole('button', { name: '撤销第 2 步图片修改' }).click()
    const secondStepUpload = page.locator('.step-item').nth(1).locator('input[type="file"]')
    await secondStepUpload.setInputFiles(photo)
    await secondStepUpload.setInputFiles({ ...photo, name: 'replacement.png' })
    await page.getByRole('button', { name: '上移第 2 步' }).click()
    await page.getByRole('button', { name: '撤销第 1 步图片修改' }).click()
    await page.getByRole('button', { name: '下移第 1 步' }).click()
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false, 'undo follows a reordered step and restores a clean draft')
    await page.getByRole('textbox', { name: '新步骤描述' }).fill('临时步骤')
    await stepUpload.setInputFiles(photo)
    await page.getByRole('button', { name: '添加步骤', exact: true }).click()
    const thirdStep = page.locator('.step-item').nth(2)
    const firstPreview = await thirdStep.getByAltText('步骤 3 图片').getAttribute('src')
    await thirdStep.locator('input[type="file"]').setInputFiles({ ...photo, name: 'replacement.png' })
    await page.getByRole('button', { name: '撤销第 3 步图片修改' }).click()
    assert.equal(await thirdStep.getByAltText('步骤 3 图片').getAttribute('src'), firstPreview, 'undo restores an unsaved step image too')
    await page.getByRole('button', { name: '删除第 3 步' }).click()
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false)
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
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' })
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
    await page.getByRole('textbox', { name: '第 1 步描述' }).fill('   ')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.getByText('第 1 步没有文字或图片', { exact: false }).waitFor()
    assert.equal(writes, 0, 'a completely empty step cannot be saved')
    await page.getByRole('textbox', { name: '第 1 步描述' }).fill(' 炒熟 ')
    await page.getByRole('button', { name: '下移第 1 步' }).click()
    assert.equal(await page.getByRole('textbox', { name: '第 1 步描述' }).inputValue(), '')
    assert.equal(await page.getByRole('textbox', { name: '第 2 步描述' }).inputValue(), ' 炒熟 ')
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.deepEqual(submittedIngredients, [{ name: '鸡蛋', amount: '4个' }])
    assert.deepEqual(submittedSteps, [{ description: '', imageUrl: '/uploads/step.jpg' }, { description: '炒熟', imageUrl: '' }])
    assert.equal(writes, 1)
    await navigate('/meals/editor/b')
    await page.waitForFunction(() => document.querySelector('input[placeholder="给这道菜起个名字"]')?.value === '菜品乙')
    await page.getByRole('textbox', { name: '第 2 步描述' }).fill('保留文字')
    await page.getByRole('button', { name: '移除第 2 步图片' }).click()
    await page.getByRole('button', { name: '保存', exact: true }).click()
    await page.waitForURL('**/meals')
    assert.deepEqual(submittedSteps, [{ description: '炒熟', imageUrl: '' }, { description: '保留文字', imageUrl: '' }], 'saving a removed image must clear its stored URL')
    assert.equal(submittedBody.includes('name="stepImages"'), false)
    assert.equal(writes, 2)
    console.log('Meal editor checks passed: draft guard, route switching, stale responses and retry')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
