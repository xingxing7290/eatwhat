const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8').replace(/#.*$/gm, ''); }
function block(text, declaration) {
  const start = text.indexOf(declaration);
  assert.notEqual(start, -1, `missing ${declaration}`);
  const open = text.indexOf('{', start + declaration.length);
  assert.notEqual(open, -1, `missing block for ${declaration}`);
  let depth = 1;
  for (let i = open + 1; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}' && --depth === 0) return text.slice(open + 1, i);
  }
  throw new Error(`unclosed block: ${declaration}`);
}

test('all supported proxies route guest capability paths without logging them', () => {
  for (const file of ['nginx.conf', 'nginx.prod.conf', 'client/nginx.conf']) {
    const text = read(file);
    for (const route of ['/guest-order/', '/guest-orders/']) {
      const location = block(text, `location ^~ ${route}`);
      assert.match(location, /\baccess_log\s+off\s*;/, `${file} ${route} must not log capability URLs`);
      assert.match(location, /\bproxy_pass\s+http:\/\/backend(?::3000)?\s*;/, `${file} ${route} must preserve the request path`);
      assert.doesNotMatch(location, /\bproxy_cache\s+(?!off\s*;)/, `${file} ${route} must not use a shared cache`);
    }
  }
});

test('production proxy never shares household API responses through its cache', () => {
  const text = read('nginx.prod.conf');
  const api = block(text, 'location ^~ /api/');
  assert.match(api, /\bproxy_cache\s+off\s*;/);
  assert.match(api, /\bproxy_hide_header\s+Cache-Control\s*;/i);
  assert.match(api, /\badd_header\s+Cache-Control\s+"private, no-store"\s+always\s*;/i);
  assert.doesNotMatch(text, /\bproxy_cache\s+api_cache\s*;/);
  // The HTTP redirect must not log a capability URL before HTTPS is reached.
  assert.match(text.slice(text.indexOf('listen 80;'), text.indexOf('listen 443')), /\baccess_log\s+off\s*;/);
});
