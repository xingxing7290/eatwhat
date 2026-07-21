const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pagePath = path.join(__dirname, '..', 'public', 'guest-order.html');

test('guest ordering page contains the essential ordering controls', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  for (const id of ['mealGrid', 'search', 'filters', 'cartBar', 'guestName', 'orderNote', 'submitOrder']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /guest-orders\/public/);
  assert.match(html, /localStorage/);
  assert.match(html, /setInterval\(\(\) => loadSession\(false\), 15000\)/);
});

test('guest ordering page inline script parses as JavaScript', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1], { filename: 'guest-order-inline.js' }));
});
