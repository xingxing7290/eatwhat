const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { contrast, gradientContrast } = require('./contrast-helpers.cjs');

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178';
const themes = ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist'];

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('token', 'theme-test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'theme-user', username: 'theme-user', householdId: 'home-a' }));
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('colorTheme', 'cream');
    });
    await page.route('**/api/**', async route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/household-scope')) return route.fulfill({ json: { supportsHouseholdScope: true, householdId: route.request().headers()['x-eatwhat-household'] } })
      const url = new URL(route.request().url());
      let data = {};
      if (url.pathname === '/api/meals') data = { data: [{ _id: 'meal-a', name: '番茄炒蛋', description: '家常味道', category: '家常菜', tags: ['家常'] }], total: 1 };
      else if (url.pathname === '/api/meals/categories') data = [{ category: '家常菜' }];
      else if (url.pathname === '/api/meals/tags' || url.pathname === '/api/wishlist') data = [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${base}/meals`);
    await page.locator('.meal-card-wrapper .meal-name').waitFor();
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    const checks = [
      ['page title', '.page-title'],
      ['presence title', '.presence-copy strong'],
      ['presence description', '.presence-copy p'],
      ['search results', '.results-summary'],
      ['active category', '.category-list button.active'],
      ['meal name', '.meal-card-wrapper .meal-name'],
      ['meal description', '.meal-card-wrapper .meal-description'],
      ['meal tag', '.meal-card-wrapper .meal-tag'],
      ['add-to-wishlist action', '.meal-card-wrapper .feed-btn']
    ];
    for (const mode of ['light', 'dark']) {
      if (mode === 'dark') {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole('button', { name: '切换到暗色模式' }).click();
        await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
        await page.getByRole('button', { name: '切换到亮色模式' }).hover();
        const tooltip = page.getByRole('tooltip').filter({ hasText: '切换到亮色模式' });
        await tooltip.waitFor();
        const tooltipContrast = await contrast(page, '[role="tooltip"]:visible');
        assert.ok(tooltipContrast.ratio >= 4.5, `dark tooltip contrast ${JSON.stringify(tooltipContrast)}`);
      }
      for (const [width, height] of [[1280, 900], [390, 844], [320, 844]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.getByRole('radio', { name: '网格视图' }).count(), 1, 'view selector must retain its accessible name on mobile');
        if (width <= 390) {
          if (mode === 'light' && width === 390 && process.env.EATWHAT_MEAL_COMPACT_SHOT) await page.screenshot({ path: process.env.EATWHAT_MEAL_COMPACT_SHOT, fullPage: true });
          const searchTop = await page.getByRole('textbox', { name: '搜索菜品' }).evaluate(element => element.getBoundingClientRect().top);
          assert.ok(searchTop < 510, `mobile search should remain easy to reach, got ${searchTop}`);
          for (const name of ['菜品回收站', '添加菜品', '查看想吃清单']) {
            const box = await page.getByRole('button', { name }).boundingBox();
            assert.ok(box && box.height >= 44 && box.width >= 44, `${name} must remain a usable touch target: ${JSON.stringify(box)}`);
          }
          if (width === 320) {
            const actionBoxes = await page.locator('.meal-card-wrapper .meal-actions .el-button').evaluateAll(buttons => buttons.map(button => { const box = button.getBoundingClientRect(); return { width: box.width, height: box.height, top: box.top } }));
            assert.equal(actionBoxes.length, 5);
            assert.ok(actionBoxes.every(box => box.width >= 44 && box.height >= 44), 'card actions must remain tappable');
            assert.ok(new Set(actionBoxes.map(box => Math.round(box.top))).size <= 2, 'card actions should not stack into more than two rows');
            const imageRatio = await page.locator('.meal-card-wrapper').evaluate(card => card.querySelector('.meal-image-container').getBoundingClientRect().width / card.getBoundingClientRect().width);
            assert.ok(imageRatio > 0.8, `recipe image should use the available card width: ${imageRatio}`);
            const title = page.locator('.meal-card-wrapper .meal-name');
            const original = await title.textContent();
            await title.evaluate(element => { element.textContent = 'LongRecipeName'.repeat(12); });
            assert.equal(await title.evaluate(element => element.scrollWidth <= element.clientWidth), true, 'long unbroken names must wrap inside the card');
            await title.evaluate((element, text) => { element.textContent = text; }, original);
          }
          for (const selector of ['.view-switcher .el-radio-button__inner', '.category-list button', '.meal-card-wrapper .feed-btn']) {
            const box = await page.locator(selector).first().boundingBox();
            assert.ok(box && box.height >= 44, `${selector} must have a 44px touch target`);
          }
        }
        for (const theme of themes) {
          await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
          for (const [label, selector] of checks) {
            const result = await contrast(page, selector);
            assert.ok(result.ratio >= 4.5, `${mode} ${width} ${theme} ${label} contrast ${result.ratio.toFixed(2)} < 4.5`);
          }
          for (const selector of ['.add-meal-btn', '.feed-inspiration-btn']) {
            const ratio = await gradientContrast(page, selector);
            assert.ok(ratio >= 4.5, `${mode} ${width} ${theme} ${selector} gradient contrast ${ratio.toFixed(2)} < 4.5`);
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${mode} ${width} ${theme} overflows horizontally`);
        }
        await page.evaluate(() => { document.documentElement.dataset.theme = 'cream'; });
        await page.screenshot({ path: path.join(os.tmpdir(), `eatwhat-meal-${mode}-${width}.png`), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('.meal-card-wrapper .feed-btn').hover();
    assert.ok((await contrast(page, '.meal-card-wrapper .feed-btn')).ratio >= 4.5, 'hovered add-to-wishlist contrast');
    await page.keyboard.press('Tab');
    await page.getByRole('radio', { name: '列表视图' }).focus();
    const focusStyle = await page.getByRole('radio', { name: '列表视图' }).evaluate(input => ({ visible: input.matches(':focus-visible'), outline: getComputedStyle(input.nextElementSibling).outlineStyle }));
    assert.equal(focusStyle.visible, true, 'keyboard-focused view control must expose focus-visible');
    assert.notEqual(focusStyle.outline, 'none', 'keyboard focus must have a visible indicator');
    await page.keyboard.press('Space');
    await page.locator('.meal-list-name').waitFor();
    for (const selector of ['.meal-list-name', '.meal-list-description', '.meal-list-tags .meal-tag']) assert.ok((await contrast(page, selector)).ratio >= 4.5, `dark ${selector} contrast`);
    await page.getByRole('radio', { name: '表格视图' }).focus();
    await page.keyboard.press('Space');
    await page.locator('.table-name').waitFor();
    for (const selector of ['.table-name', '.table-description', '.table-tags .table-tag']) {
      const result = await contrast(page, selector);
      assert.ok(result.ratio >= 4.5, `dark ${selector} contrast ${JSON.stringify(result)}`);
    }
    assert.ok((await contrast(page, '.meals-table .el-table__header th .cell')).ratio >= 4.5, 'dark table header contrast');
    await page.locator('.meals-table .el-table__row').first().hover();
    assert.ok((await contrast(page, '.table-name')).ratio >= 4.5, 'dark hovered table row contrast');
    await page.getByRole('radio', { name: '分组视图' }).focus();
    await page.keyboard.press('Space');
    await page.locator('.meals-grouped .el-collapse-item__header').first().waitFor();
    assert.ok((await contrast(page, '.meals-grouped .el-collapse-item__header')).ratio >= 4.5, 'dark grouped header contrast');
    console.log('Meal theme checks passed across six palettes, light/dark modes and three viewport sizes');
    await context.close();
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
