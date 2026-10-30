const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { contrast, gradientContrast } = require('./contrast-helpers.cjs');

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178';
const themes = ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist'];
const today = '2026-10-29';
const summary = {
  today,
  todaySchedule: { meals: { breakfast: [], lunch: [], dinner: [{ meal: { _id: 'a', name: '番茄炒蛋' } }] } },
  todayHints: ['留意蔬菜搭配'],
  week: { days: Array.from({ length: 7 }, (_, index) => ({ date: new Date(Date.UTC(2026, 9, 26 + index)).toISOString().slice(0, 10), meals: { breakfast: [], lunch: [], dinner: index === 3 ? [{ meal: { _id: 'a', name: '番茄炒蛋' } }] : [] } })) },
  partnerWishlist: [{ _id: 'wish-a', title: '家人想吃的菜', mealId: { _id: 'a', name: '番茄炒蛋' } }],
  recentPhotos: [
    { photo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="10" height="10"%3E%3Crect width="10" height="10" fill="%23d49a75"/%3E%3C/svg%3E', memoryId: 'm1', title: '温暖晚餐', date: today },
    { photo: '/missing-test-photo.png', memoryId: 'm2', title: '无法加载的照片', date: today }
  ],
  defaultMeals: { imported: 2, total: 2 }, imageIssues: { open: 1 }, meals: { favorites: 1 }
};

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date(2026, 9, 30, 12));
    let failSummary = false;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('token', 'dashboard-test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'dashboard-user', username: 'dashboard-user', householdId: 'home-a' }));
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('colorTheme', 'cream');
    });
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const url = new URL(route.request().url());
      if (url.pathname === '/api/dashboard/summary' && failSummary) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: '测试读取失败' }) });
      const data = url.pathname === '/api/dashboard/summary' ? summary : url.pathname === '/api/photo-album' ? { photos: [] } : url.pathname === '/api/wishlist'
        ? [
            { _id: 'low', title: '低优先级', status: 'open', priority: 'low', votes: [], createdAt: '2026-10-29T12:00:00Z' },
            { _id: 'normal', title: '普通优先级', status: 'open', priority: 'normal', votes: [], createdAt: '2026-10-29T11:00:00Z' },
            { _id: 'high', title: '高优先级', status: 'open', priority: 'high', votes: [], createdAt: '2026-10-29T10:00:00Z' }
          ]
        : {};
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${base}/dashboard`);
    await page.getByRole('heading', { name: /好好吃饭/ }).waitFor();
    await page.getByText('照片暂不可用').waitFor();
    assert.equal(await page.getByRole('link', { name: '前往饭桌相册：温暖晚餐' }).count(), 1);
    const checks = [
      ['eyebrow', '.eyebrow'], ['title', '.hero-panel h1'], ['accent title', '.hero-panel h1 span'],
      ['summary text', '.hero-panel > div:first-child > p:last-of-type'], ['date notice', '.date-notice'], ['section label', '.section-heading small'],
      ['section title', '.section-heading h2'], ['card title', '.today-card .card-title span'],
      ['meal link', '.today-card .today-recipe-link'], ['today action', '.today-slot-action'], ['warning tag', '.today-card .hint-list .el-tag'],
      ['metric number', '.metric-row strong'], ['weekday label', '.week-day-label'], ['week meal count', '.week-day span:last-child'], ['week date', '.week-day strong'],
      ['partner title', '.wishlist-row strong'], ['partner detail', '.wishlist-row p'], ['wishlist context', '.wishlist-context'],
      ['missing photo', '.photo-unavailable'], ['favorite action', '.status-grid a small'], ['quick link', '.quick-links a'], ['quick link detail', '.quick-link-copy small'], ['card link', '.card-links a']
    ];
    for (const mode of ['light', 'dark']) {
      if (mode === 'dark') {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole('button', { name: '切换到暗色模式' }).click();
        await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
      }
      for (const [width, height] of [[1280, 900], [390, 844], [320, 844]]) {
        await page.setViewportSize({ width, height });
        for (const theme of themes) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
          for (const [label, selector] of checks) {
            const result = await contrast(page, selector);
            assert.ok(result.ratio >= 4.5, `${mode} ${width} ${theme} ${label}: ${JSON.stringify(result)}`);
          }
          const buttonContrast = await gradientContrast(page, '.hero-actions .el-button--primary');
          assert.ok(buttonContrast >= 4.5, `${mode} ${width} ${theme} primary action: ${buttonContrast.toFixed(2)}`);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${mode} ${width} ${theme} overflows`);
        }
        await page.evaluate(() => { document.documentElement.dataset.theme = 'cream'; });
        await page.screenshot({ path: path.join(os.tmpdir(), `eatwhat-dashboard-${mode}-${width}.png`), fullPage: true });
      }
    }
    const shortcuts = page.locator('.quick-links a');
    assert.deepEqual(await shortcuts.evaluateAll(links => links.map(link => link.getAttribute('href'))), ['/weekly-plan', '/shopping-list', '/meals', '/review']);
    assert.match(await shortcuts.first().innerText(), /查看周计划.*查看安排，按需生成草稿/s, 'the shortcut must describe navigation rather than imply automatic generation');
    for (const link of await shortcuts.all()) assert.ok((await link.boundingBox()).height >= 44, 'shortcut touch target');
    await page.keyboard.press('Tab');
    await shortcuts.first().focus();
    assert.equal(await shortcuts.first().evaluate(link => link.matches(':focus-visible')), true, 'shortcuts retain a visible keyboard focus state');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/weekly-plan');
    await page.goto(`${base}/dashboard`);
    await page.getByText('照片暂不可用').waitFor();
    await page.getByRole('button', { name: '打开导航菜单' }).click();
    const close = page.locator('.mobile-nav-header').getByRole('button', { name: '关闭导航菜单' });
    await close.waitFor();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '关闭导航菜单');
    assert.ok((await gradientContrast(page, '.mobile-nav-header')) >= 4.5, 'mobile navigation header contrast');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '打开导航菜单');
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true');
    await page.getByRole('button', { name: '打开导航菜单' }).click();
    await page.locator('.mobile-nav-header').getByRole('button', { name: '关闭导航菜单' }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '打开导航菜单');

    await page.setViewportSize({ width: 600, height: 844 });
    await page.getByRole('button', { name: '打开导航菜单' }).click();
    await page.locator('.mobile-overlay').click({ position: { x: 10, y: 100 } });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '打开导航菜单');
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true');
    await page.setViewportSize({ width: 390, height: 844 });

    assert.ok((await page.getByRole('button', { name: '查看2026-10-29晚餐' }).boundingBox()).height >= 44);
    await page.getByRole('button', { name: '查看2026-10-29晚餐' }).click();
    await page.waitForURL('**/calendar?date=2026-10-29');
    await page.goto(`${base}/dashboard`);
    await page.getByRole('link', { name: '前往饭桌相册：温暖晚餐' }).waitFor();

    await page.getByRole('link', { name: '前往饭桌相册：温暖晚餐' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/photo-album?month=2026-10');
    await page.goto(`${base}/wishlist`);
    await page.getByText('高优先级').waitFor();
    const orderedWishes = await page.locator('.status-column').first().locator('.wish-title strong').allTextContents();
    assert.deepEqual(orderedWishes, ['高优先级', '普通优先级', '低优先级']);
    failSummary = true;
    await page.goto(`${base}/dashboard`);
    await page.getByRole('alert').getByText('暂时没有加载出饭桌信息').waitFor();
    assert.equal(await page.locator('.dashboard-grid').count(), 0, 'error must not appear as zero-valued data');
    failSummary = false;
    await page.getByRole('button', { name: '重新加载' }).click();
    await page.getByText('家人想吃的菜').waitFor();
    await page.setViewportSize({ width: 320, height: 844 });
    summary.todayHints = ['提醒'.repeat(100)];
    summary.todaySchedule.meals.dinner[0].meal.name = '长菜名'.repeat(60);
    summary.partnerWishlist[0].title = '长心愿'.repeat(60);
    await page.getByRole('button', { name: '刷新饭桌' }).click();
    await page.locator('.hint-list .el-tag').getByText(summary.todayHints[0]).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.hint-list .el-tag').length === 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'long content must not cause horizontal page overflow');
    for (const selector of ['.hint-list .el-tag', '.today-recipe-link', '.wishlist-row strong']) {
      assert.equal(await page.locator(selector).first().evaluate(node => {
        const rect = node.getBoundingClientRect(); const card = node.closest('.el-card').getBoundingClientRect();
        return rect.left >= card.left && rect.right <= card.right;
      }), true, `${selector} must stay within its card`);
    }
    assert.equal(await page.locator('.hint-list .el-tag__content').evaluate(node => node.scrollWidth <= node.clientWidth), true, 'long hints must remain readable instead of clipping');
    assert.deepEqual(errors, []);
    console.log('Dashboard themes, mobile navigation, keyboard photo links and retry checks passed');
    await context.close();
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
