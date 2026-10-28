const test = require('node:test');
const assert = require('node:assert/strict');
const { buildUploadUrl } = require('../utils/uploadUrl');

test('upload URL preserves the public host port ahead of an internal proxy port', () => {
  const req = { headers: { 'x-forwarded-proto': 'http', 'x-forwarded-host': 'example.test:8080', 'x-forwarded-port': '80' } };
  assert.equal(buildUploadUrl(req, 'avatar.png'), 'http://example.test:8080/uploads/avatar.png');
  req.headers['x-forwarded-host'] = 'example.test:80';
  req.headers['x-forwarded-port'] = '8080';
  assert.equal(buildUploadUrl(req, 'avatar.png'), 'http://example.test/uploads/avatar.png');
});

test('upload URL handles IPv6, forwarded ports and standard ports', () => {
  assert.equal(buildUploadUrl({ protocol: 'http', headers: { host: '[::1]:8080' } }, 'a.png'), 'http://[::1]:8080/uploads/a.png');
  assert.equal(buildUploadUrl({ headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': '[2001:db8::1]', 'x-forwarded-port': '8443' } }, 'a.png'), 'https://[2001:db8::1]:8443/uploads/a.png');
  assert.equal(buildUploadUrl({ headers: { 'x-forwarded-proto': 'https', host: 'example.test', 'x-forwarded-port': '443' } }, 'a.png'), 'https://example.test/uploads/a.png');
});

test('configured public base wins and generated filenames are safely encoded', () => {
  const previous = process.env.PUBLIC_BASE_URL;
  try {
    process.env.PUBLIC_BASE_URL = 'https://assets.example.test/app/';
    assert.equal(buildUploadUrl({ headers: { host: 'internal:3000' } }, 'a b.png'), 'https://assets.example.test/app/uploads/a%20b.png');
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_BASE_URL;
    else process.env.PUBLIC_BASE_URL = previous;
  }
});

test('malformed origin headers fall back to a local API path', () => {
  for (const headers of [{ host: 'evil.test/path' }, { host: 'user@evil.test' }, { host: 'bad host' }, { host: 'example.test', 'x-forwarded-proto': 'javascript' }, { host: 'example.test', 'x-forwarded-port': '99999' }]) {
    assert.equal(buildUploadUrl({ headers }, 'a.png'), '/api/uploads/a.png');
  }
  assert.equal(buildUploadUrl({ headers: {} }, 'a.png'), '/api/uploads/a.png');
});
