const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

const base = process.env.EATWHAT_TEST_URL || 'http://127.0.0.1:5178';
const themes = ['cream', 'peach', 'caramel', 'matcha', 'azuki', 'mist'];

async function contrast(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const blend = (top, bottom) => {
      const a = top[3] / 255;
      return top.slice(0, 3).map((value, index) => value * a + bottom[index] * (1 - a));
    };
    const luminance = rgb => {
      const linear = rgb.map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.push(node);
    let background = document.documentElement.classList.contains('dark') ? [32, 26, 24] : [255, 255, 255];
    for (const node of ancestors.reverse()) background = blend(rgba(getComputedStyle(node).backgroundColor), background);
    const foreground = blend(rgba(getComputedStyle(element).color), background);
    const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
    return { ratio: (a + 0.05) / (b + 0.05), foreground, background, ancestors: ancestors.map(node => ({ tag: node.tagName, className: node.className, background: getComputedStyle(node).backgroundColor })) };
  });
}

async function gradientContrast(page, selector) {
  return page.locator(selector).first().evaluate(element => {
    const style = getComputedStyle(element);
    const parse = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const colors = [...style.backgroundImage.matchAll(/rgb\([^)]*\)/g)].map(match => parse(match[0]));
    if (colors.length < 2) throw new Error(`Expected a two-stop gradient: ${style.backgroundImage}`);
    const luminance = rgb => rgb.map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    const foreground = luminance(parse(style.color));
    return Math.min(...colors.map(color => { const background = luminance(color); return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05); }));
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('token', 'theme-test-token');
      localStorage.setItem('user', JSON.stringify({ id: 'theme-user', username: 'theme-user' }));
      localStorage.setItem('darkMode', 'false');
      localStorage.setItem('colorTheme', 'cream');
    });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let data = {};
      if (url.pathname === '/api/meals') data = { data: [{ _id: 'meal-a', name: '番茄炒蛋', description: '家常味道', category: '家常菜', tags: ['家常'] }], total: 1 };
      else if (url.pathname === '/api/meals/categories') data = [{ category: '家常菜' }];
      else if (url.pathname === '/api/meals/tags' || url.pathname === '/api/wishlist') data = [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${base}/meals`);
    await page.locator('.meal-card-wrapper .meal-name').waitFor();
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
      for (const [width, height] of [[1280, 900], [390, 844]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.getByRole('radio', { name: '网格视图' }).count(), 1, 'view selector must retain its accessible name on mobile');
        if (width === 390) {
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
    console.log('Meal theme checks passed across six palettes, light/dark modes and two viewport sizes');
    await context.close();
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exit(1); });
