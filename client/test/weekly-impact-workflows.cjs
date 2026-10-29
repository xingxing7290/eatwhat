const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Weekly impact checks require a local server')
const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
const mealA = { _id: 'a', name: '番茄炒蛋', category: '家常菜' }
const mealB = { _id: 'b', name: '麻婆豆腐', category: '川菜' }
const empty = () => ({ breakfast: [], lunch: [], dinner: [] })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let applications = 0
    const current = dates.map((date, index) => ({ date, scheduleExists: index === 0, scheduleVersion: index === 0 ? '2026-10-28T00:00:00.000Z' : null, meals: index === 0 ? { breakfast: [{ meal: mealA }], lunch: [{ meal: mealA }], dinner: [{ meal: mealA }] } : empty() }))
    const days = dates.map((date, index) => ({ date, meals: index === 0 ? { breakfast: [], lunch: ['b'], dinner: ['a'] } : index === 1 ? { ...empty(), dinner: ['b'] } : empty() }))
    const preview = days.map(day => ({ date: day.date, meals: Object.fromEntries(Object.entries(day.meals).map(([type, ids]) => [type, ids.map(id => id === 'a' ? mealA : mealB)])), hints: [] }))
    await page.context().route('**/api/**', route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/weekly-plans' && request.method() === 'GET') return route.fulfill({ json: { weekStart: dates[0], supportsConditionalApply: true, days: current } })
      if (path === '/weekly-plans/generate') return route.fulfill({ json: { weekStart: dates[0], days, preview } })
      if (path === '/weekly-plans/apply') { applications++; return route.fulfill({ status: 500, json: { error: 'unexpected application' } }) }
      if (path === '/meals/categories') return route.fulfill({ json: [{ category: '家常菜' }, { category: '川菜' }] })
      if (path === '/meals') return route.fulfill({ json: { data: [mealA, mealB], page: 1, limit: 8, total: 2 } })
      if (path === '/meals/a') return route.fulfill({ json: mealA })
      if (path === '/meals/b') return route.fulfill({ json: mealB })
      if (path === '/memories') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/weekly-plan`)
    const currentLink = page.getByRole('link', { name: '在新标签页查看2026-10-26早餐的番茄炒蛋菜谱' })
    assert.equal(await currentLink.getAttribute('href'), '/meals/detail/a')
    assert.equal(await currentLink.getAttribute('target'), '_blank')
    await page.getByRole('button', { name: '生成草稿' }).click()
    const impact = page.getByLabel('草稿对当前安排的影响')
    await impact.waitFor()
    const draftLink = page.getByRole('link', { name: '在新标签页查看草稿中2026-10-26午餐的麻婆豆腐菜谱' })
    assert.equal(await draftLink.getAttribute('rel'), 'noopener noreferrer')
    assert.ok((await draftLink.boundingBox()).height >= 44)
    const popupPromise = page.waitForEvent('popup')
    await draftLink.click()
    const popup = await popupPromise
    await popup.waitForURL('**/meals/detail/b')
    await popup.getByRole('heading', { name: '麻婆豆腐' }).waitFor()
    await popup.close()
    assert.equal(await impact.isVisible(), true, 'opening a recipe must preserve the draft')
    assert.equal(applications, 0)
    const impactText = () => impact.innerText()
    assert.match(await impactText(), /新增\s*1\s*餐/)
    assert.match(await impactText(), /替换\s*1\s*餐/)
    assert.match(await impactText(), /清空\s*1\s*餐/)
    assert.match(await impactText(), /菜品相同\s*18\s*餐/)
    await page.getByText('将清空', { exact: true }).waitFor()
    assert.equal(await page.getByText('将替换', { exact: true }).count(), 1)
    assert.equal(await page.locator('.draft-slot').getByText('新增', { exact: true }).count(), 1)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.weekly-page .eyebrow', '.weekly-page h1', '.week-link', '.day-calendar-link', '.draft-heading strong', '.draft-heading span', '.impact-summary > div span', '.impact-summary > div strong', '.impact-summary p', '.change-note', '.day-card h3', '.draft-slot .el-tag', '.draft-slot .recipe-link', '.recipe-context', '.edit-slot']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${JSON.stringify(result)}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await page.getByRole('button', { name: '放弃草稿', exact: true }).click()
    let confirm = page.getByRole('dialog', { name: '放弃周计划草稿？' })
    await confirm.getByRole('button', { name: '继续编辑' }).click()
    await confirm.waitFor({ state: 'hidden' })
    assert.equal(await impact.isVisible(), true)
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.getByRole('button', { name: '应用到日历' }).click()
    confirm = page.getByRole('dialog', { name: '确认应用周计划' })
    await confirm.getByText('新增 1 餐，替换 1 餐，清空 1 餐，菜品相同 18 餐', { exact: false }).waitFor()
    await confirm.getByText('其他排餐信息也可能变化', { exact: false }).waitFor()
    await confirm.getByRole('button', { name: '再检查一下' }).click()
    assert.equal(applications, 0)
    await page.getByRole('button', { name: '调整2026-10-26午餐' }).click()
    const picker = page.getByRole('dialog', { name: '调整 2026-10-26 午餐' })
    await picker.getByRole('button', { name: '移除麻婆豆腐' }).click()
    await picker.getByRole('button', { name: '保存到草稿' }).click()
    await page.getByText('已调整，请自行核对当天搭配。').waitFor()
    assert.match(await impactText(), /替换\s*0\s*餐/)
    assert.match(await impactText(), /清空\s*2\s*餐/)
    assert.equal(await page.getByText('将清空', { exact: true }).count(), 2)
    await page.getByRole('button', { name: '放弃草稿', exact: true }).click()
    confirm = page.getByRole('dialog', { name: '放弃周计划草稿？' })
    await confirm.getByRole('button', { name: '放弃草稿', exact: true }).click()
    await impact.waitFor({ state: 'hidden' })
    assert.equal(applications, 0)
    assert.equal(await page.getByText('番茄炒蛋', { exact: true }).count(), 3)
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), false)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    console.log('Weekly impact checks passed: replacement preview, clear warnings and discard without writes')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
