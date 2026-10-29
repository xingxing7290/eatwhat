import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveUploadedImage, resolveRecipeImage, handleUploadedImageError } from '../src/utils/uploadedImage.mjs'

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

test('recipe covers normalize historical paths and reject invalid image sources', () => {
  const origin = 'https://example.test:8443'
  assert.equal(resolveRecipeImage('http://example.test/api/uploads/a.png?v=2#x', 'fallback', origin), 'https://example.test:8443/api/uploads/a.png?v=2#x')
  assert.equal(resolveRecipeImage('//cdn.example.test/uploads/a.png', 'fallback', origin), '//cdn.example.test/uploads/a.png')
  for (const value of [null, {}, 'javascript:alert(1)', 'data:text/html,invalid', 'relative.jpg', 'http://[invalid']) assert.equal(resolveRecipeImage(value, 'fallback', origin), 'fallback')
})

test('only same-origin legacy uploads retry through the API and retain URL parameters', () => {
  const origin = 'https://example.test:8443'
  const local = { src: `${origin}/uploads/a.png?v=2#x`, alt: '菜品', dataset: {} }
  handleUploadedImageError({ target: local }, '/placeholder.svg', origin)
  assert.equal(local.src, `${origin}/api/uploads/a.png?v=2#x`)
  handleUploadedImageError({ target: local }, '/placeholder.svg', origin)
  assert.equal(local.src, '/placeholder.svg')
  assert.equal(local.alt, '图片暂不可用')
  for (const src of ['https://cdn.example.test/uploads/a.png', 'https://example.test:9999/uploads/a.png', `${origin}/images/a.png`]) {
    const image = { src, alt: '菜品', dataset: {} }
    handleUploadedImageError({ target: image }, '/placeholder.svg', origin)
    assert.equal(image.src, '/placeholder.svg', 'external or unrelated paths must not retry as local uploads')
    assert.equal(image.dataset.retry, undefined)
  }
})
