const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { contrast } = require('./contrast-helpers.cjs')
const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5179'
if (!/^http:\/\/127\.0\.0\.1:(5178|5179)$/.test(base)) throw new Error('Schedule checks require a local server')

async function main () {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(12000)
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12))
    await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); localStorage.setItem('user', JSON.stringify({ id: 'u1', householdId: 'h1' })) })
    const errors = []; let writes = 0; let legacyUnavailable = false; page.on('pageerror', error => errors.push(error.message))
    const dates = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 9, 26 + i)).toISOString().slice(0, 10))
    const slots = () => ({ breakfast: [], lunch: [], dinner: [] })
    const days = dates.map(date => ({ date, meals: ['2026-10-28', '2026-11-01'].includes(date) ? { ...slots(), dinner: [{ meal: null, addedBy: null }] } : slots(), scheduleExists: ['2026-10-28', '2026-11-01'].includes(date), scheduleVersion: ['2026-10-28', '2026-11-01'].includes(date) ? '2026-10-28T08:00:00.000Z' : null, hints: [] }))
    const list = { weekStart: dates[0], supportsConditionalUpdates: true, listVersion: 1, items: [{ _id: 'manual', name: '手动牛奶', amount: '1盒', category: 'other', manual: true, checked: false }] }
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace(/^\/api/, '')
      if (path === '/auth/household-scope') return route.fulfill({ json: { supportsHouseholdScope: true, householdId: 'h1' } })
      if (path === '/dashboard/summary') return route.fulfill({ json: { today: '2026-10-28', todaySchedule: days[2], todayHints: [], week: { days }, partnerWishlist: [], recentPhotos: [], defaultMeals: { imported: 0, total: 0 }, imageIssues: { open: 0 }, meals: { favorites: 0 } } })
      if (path === '/schedules') return route.fulfill({ json: Number(url.searchParams.get('month')) === 10 ? [days[2]] : [] })
      if (path === '/schedules/day/2026-10-28') return route.fulfill({ json: days[2] })
      if (path === '/weekly-plans' && req.method() === 'GET') return route.fulfill({ json: { weekStart: dates[0], supportsConditionalApply: true, days } })
      if (path === '/weekly-plans/generate') {
        const draftDays = dates.map(date => ({ date, meals: date === dates[2] ? { ...slots(), dinner: ['meal-a'] } : slots() }))
        const preview = draftDays.map(day => ({ ...day, meals: { ...day.meals, dinner: day.meals.dinner.map(id => ({ _id: id, name: '安全菜' })) }, hints: [] }))
        return route.fulfill({ json: { weekStart: dates[0], days: draftDays, preview } })
      }
      if (path === '/weekly-plans/apply' || path.startsWith('/schedules/2026-10-28/')) { writes++; return route.fulfill({ json: {} }) }
      if (path === '/shopping-list' && req.method() === 'GET') return route.fulfill({ json: list })
      if (path === '/shopping-list/generate') return route.fulfill({ status: 409, json: { code: 'SCHEDULE_MEAL_UNAVAILABLE', error: '本周排餐包含不可用的菜品', ...(legacyUnavailable ? {} : { unavailableDates: ['2026-11-01', '2026-10-28', '2026-11-01', '2027-01-01', '2026-02-30'] }) } })
      if (path === '/meals') return route.fulfill({ json: { data: [], total: 0, page: 1, limit: 8 } })
      if (path === '/meals/categories' || path === '/meals/tags' || path === '/wishlist') return route.fulfill({ json: [] })
      return route.fulfill({ json: {} })
    })
    await page.goto(`${base}/dashboard`)
    await page.getByText('菜品不可用', { exact: true }).first().waitFor()
    await page.goto(`${base}/calendar`)
    await page.getByText('部分菜品已不可用', { exact: false }).waitFor()
    await page.getByText('菜品不可用', { exact: true }).first().waitFor()
    await page.locator('.mobile-only').getByRole('button', { name: '删除2026-10-28晚餐' }).click()
    const confirm = page.getByRole('dialog', { name: '删除确认' })
    await confirm.getByText('此操作会清除该餐次的全部菜品，包括不可用记录', { exact: false }).waitFor()
    await confirm.getByRole('button', { name: '取消' }).click()
    await page.goto(`${base}/selection?date=2026-10-28&mealType=dinner`)
    await page.locator('.meal-selection').getByText('现有安排中有不可用的菜品', { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: '保存安排' }).isDisabled(), true)
    await page.goto(`${base}/weekly-plan`)
    await page.getByText('当前周有 2 条菜品不可用的排餐', { exact: false }).waitFor()
    assert.equal(await page.getByRole('link', { name: '前往日历', exact: true }).getAttribute('href'), '/calendar?date=2026-10-28')
    const weeklyDates = page.getByRole('navigation', { name: '按日期核对周计划' })
    assert.equal(await weeklyDates.getByRole('link').count(), 2)
    assert.equal(await weeklyDates.getByRole('link', { name: '查看 2026-11-01 的排餐' }).getAttribute('href'), '/calendar?date=2026-11-01')
    await weeklyDates.getByRole('link', { name: '查看 2026-11-01 的排餐' }).click()
    await page.getByText('已定位到 2026-11-01', { exact: false }).waitFor()
    await page.goBack()
    await page.getByText('当前周有 2 条菜品不可用的排餐', { exact: false }).waitFor()
    await page.getByText('菜品不可用', { exact: true }).first().waitFor()
    await page.getByRole('button', { name: '生成草稿' }).click()
    await page.getByText('规则生成草稿').waitFor()
    assert.equal(await page.getByRole('button', { name: '应用到日历' }).isDisabled(), true)
    await weeklyDates.getByRole('link', { name: '查看 2026-11-01 的排餐' }).click()
    await page.getByRole('dialog', { name: '放弃未保存的内容？' }).getByRole('button', { name: '继续编辑' }).click()
    assert.equal(await page.getByText('规则生成草稿').count(), 1, 'date links must retain the existing draft when navigation is cancelled')
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
          const result = await contrast(page, '.calendar-link')
          assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} ${width} ${theme}: ${JSON.stringify(result)}`)
          const dateResult = await contrast(page, '.unavailable-alert .affected-dates a')
          assert.ok(dateResult.ratio >= 4.5, `weekly date links: ${JSON.stringify(dateResult)}`)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        }
      }
    }
    page.on('dialog', dialog => dialog.accept())
    await page.goto(`${base}/shopping-list`)
    await page.getByText('手动牛奶').waitFor()
    await page.getByRole('button', { name: '从排餐生成' }).click()
    await page.getByText('本次未生成购物清单，现有清单保持不变', { exact: false }).waitFor()
    await page.getByText('需核对的日期：2026-10-28、2026-11-01。').waitFor()
    assert.equal(await page.getByRole('link', { name: '前往日历核对' }).getAttribute('href'), '/calendar?date=2026-10-28')
    assert.equal(await page.getByRole('navigation', { name: '按日期核对购物清单' }).getByRole('link').count(), 2)
    await page.getByText('手动牛奶').waitFor()
    for (const dark of [false, true]) {
      await page.evaluate(value => { document.documentElement.classList.toggle('dark', value); document.querySelector('.app-container').classList.toggle('dark-mode', value) }, dark)
      for (const theme of ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist']) {
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const result = await contrast(page, '.generation-alert .calendar-link')
        assert.ok(result.ratio >= 4.5, `${dark ? 'dark' : 'light'} shopping ${theme}: ${JSON.stringify(result)}`)
        const dateResult = await contrast(page, '.generation-alert .affected-dates a')
        assert.ok(dateResult.ratio >= 4.5, `shopping date links: ${JSON.stringify(dateResult)}`)
      }
    }
    assert.equal(await page.getByRole('button', { name: '添加食材' }).isDisabled(), false, 'a confirmed rejection is not an uncertain write')
    legacyUnavailable = true
    await page.getByRole('button', { name: '从排餐生成' }).click()
    await page.getByText('本周可能跨月，请核对整周的安排。').waitFor()
    assert.equal(await page.getByRole('link', { name: '前往日历核对' }).getAttribute('href'), '/calendar?date=2026-10-26')
    legacyUnavailable = false
    await page.getByRole('button', { name: '从排餐生成' }).click()
    await page.getByText('需核对的日期：2026-10-28、2026-11-01。').waitFor()
    await page.getByRole('navigation', { name: '按日期核对购物清单' }).getByRole('link', { name: '查看 2026-11-01 的排餐' }).click()
    await page.getByText('已定位到 2026-11-01', { exact: false }).waitFor()
    assert.equal(await page.locator('.mobile-date-card.target-date .date-number').textContent(), '1')
    await page.goto(`${base}/calendar?date=2026-02-30`)
    await page.getByText('日历链接中的日期无效', { exact: false }).waitFor()
    assert.equal(await page.locator('.target-date').count(), 0)
    assert.equal(writes, 0)
    assert.deepEqual(errors, [])
    console.log('Unavailable schedule checks passed: dashboard, calendar, selection, weekly planning and shopping protection')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
