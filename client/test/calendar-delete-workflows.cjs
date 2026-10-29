const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Calendar checks require a local server')
const date = '2026-10-28'
const mealA = { _id: 'a', name: '番茄炒蛋' }
const mealB = { _id: 'b', name: '麻婆豆腐' }
const plan = (meal, time) => ({ date, scheduleExists: true, scheduleVersion: time, updatedAt: time, meals: { breakfast: [], lunch: [], dinner: meal ? [{ meal }] : [] } })

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    let current = plan(mealA, '2026-10-28T08:00:00.000Z'); let mode = 'lost'; let invalidReview = false; let writes = 0
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.route('**/api/**', route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/schedules' && request.method() === 'GET') return route.fulfill({ json: [current] })
      if (path === `/schedules/day/${date}`) return route.fulfill({ json: invalidReview ? { date, meals: current.meals } : current })
      if (path === '/meals') return route.fulfill({ json: [mealA, mealB] })
      if (path === '/wishlist') return route.fulfill({ json: [] })
      if (path === `/schedules/${date}/dinner` && request.method() === 'PUT') {
        const body = request.postDataJSON(); assert.deepEqual(body.mealIds, []); assert.equal(body.expectedVersion, current.scheduleVersion); writes++
        if (mode === 'conflict') { current = plan(mealB, '2026-10-28T10:00:00.000Z'); return route.fulfill({ status: 409, json: { code: 'SCHEDULE_CONFLICT', error: '版本已变化' } }) }
        const nextTime = new Date(Date.parse(current.scheduleVersion) + 1000).toISOString()
        current = plan(null, nextTime)
        if (mode === 'lost') return route.fulfill({ status: 503, json: { error: '响应丢失' } })
        if (mode === 'malformed') return route.fulfill({ json: { date, updatedAt: nextTime } })
        return route.fulfill({ json: current })
      }
      return route.fulfill({ json: {} })
    })
    const deleteButton = () => page.locator('.desktop-only').getByRole('button', { name: `删除${date}晚餐` })
    const startDelete = async () => { await deleteButton().click(); await page.getByRole('button', { name: '确认', exact: true }).click() }
    const review = page.locator('.delete-review')
    await page.goto(`${base}/calendar`)
    await deleteButton().waitFor()
    await startDelete()
    await review.getByText('删除结果未确认，请先核对最新安排。').waitFor()
    await page.evaluate(() => { void document.querySelector('#app').__vue_app__.config.globalProperties.$router.push({ name: 'calendar', query: { month: '2026-11' } }) })
    await page.getByText('请先完成当前操作或核对删除结果').waitFor()
    assert.equal(new URL(page.url()).searchParams.has('month'), false, 'an unresolved delete must block changing the calendar through the URL')
    assert.equal(await deleteButton().isDisabled(), true)
    assert.equal(await page.evaluate(() => !window.dispatchEvent(new Event('beforeunload', { cancelable: true }))), true)
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' })
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          for (const selector of ['.delete-review .el-alert__title', '.delete-review .el-alert__description', '.delete-review .el-button']) {
            const result = await contrast(page, selector)
            assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme} ${selector}: ${result.ratio}`)
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); document.querySelector('.app-container').classList.remove('dark-mode'); document.documentElement.dataset.theme = 'cream' })
    await page.locator('.logo').click()
    await page.getByRole('button', { name: '继续编辑' }).click()
    assert.equal(new URL(page.url()).pathname, '/calendar')
    invalidReview = true
    await review.getByRole('button', { name: '读取最新安排' }).click()
    await review.getByText('最新安排或版本不完整').waitFor()
    assert.equal(await review.getByRole('button', { name: '结束核对' }).count(), 0)
    invalidReview = false
    await review.getByRole('button', { name: '读取最新安排' }).click()
    await review.getByText(`${date} 晚餐：当前没有安排`).waitFor()
    await review.getByRole('button', { name: '结束核对' }).click()
    await page.getByRole('dialog', { name: '结束核对？' }).getByRole('button', { name: '已核对，继续' }).click()
    await review.waitFor({ state: 'hidden' })
    assert.equal(writes, 1, 'review must never repeat the delete')
    await deleteButton().waitFor({ state: 'hidden' })

    current = plan(mealA, '2026-10-28T09:00:00.000Z'); mode = 'conflict'
    await page.reload(); await deleteButton().waitFor(); await startDelete()
    await review.getByText('安排已被其他成员修改，本次没有删除。').waitFor()
    await review.getByRole('button', { name: '读取最新安排' }).click()
    await review.getByText(`${date} 晚餐：当前有 1 道菜`).waitFor()
    await page.locator('.desktop-only .meal-item').filter({ hasText: '麻婆豆腐' }).waitFor()
    await review.getByRole('button', { name: '结束核对' }).click()
    await page.getByRole('dialog', { name: '结束核对？' }).getByRole('button', { name: '已核对，继续' }).click()
    mode = 'normal'; await deleteButton().click(); await page.getByRole('button', { name: '确认', exact: true }).click()
    await deleteButton().waitFor({ state: 'hidden' })
    assert.equal(writes, 3)

    current = plan(mealA, '2026-10-28T11:00:00.000Z'); mode = 'malformed'
    await page.reload(); await deleteButton().waitFor(); await startDelete()
    await review.getByText('删除结果未确认，请先核对最新安排。').waitFor()
    assert.equal(await page.getByText(`${date} 的晚餐安排已删除`).count(), 0)
    await review.getByRole('button', { name: '读取最新安排' }).click()
    await review.getByText(`${date} 晚餐：当前没有安排`).waitFor()
    assert.equal(writes, 4)
    assert.deepEqual(errors, [])
    console.log('Calendar delete checks passed: conflict, uncertain result, verification, themes and navigation guard')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
