import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveUploadedImage } from '../src/utils/uploadedImage.mjs'

test('same-host uploads without the public port use the current origin', () => {
  assert.equal(resolveUploadedImage('http://example.test/uploads/a.png?v=1#photo', 'http://example.test:8080'), 'http://example.test:8080/uploads/a.png?v=1#photo')
  assert.equal(resolveUploadedImage('http://example.test/api/uploads/a.png', 'https://example.test'), 'https://example.test/api/uploads/a.png')
})

test('external hosts, explicit ports and non-upload paths are left unchanged', () => {
  const origin = 'https://example.test:8443'
  for (const value of ['https://cdn.example.test/uploads/a.png', 'http://example.test:9000/uploads/a.png', 'http://example.test/images/a.png', '/api/uploads/a.png', 'blob:https://example.test/image', '', null]) {
    assert.equal(resolveUploadedImage(value, origin), value)
  }
})

test('protocol-relative same-host uploads preserve the current public port', () => {
  assert.equal(resolveUploadedImage('//example.test/uploads/a.png', 'https://example.test:8443'), 'https://example.test:8443/uploads/a.png')
})
