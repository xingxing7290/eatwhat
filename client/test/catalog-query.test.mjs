import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCatalogQuery, filterCatalogQuery, readCatalogQuery } from '../src/utils/catalogQuery.mjs'

test('catalog links preserve recognized filters and normalize page and view', () => {
  const query = { q: '番茄', category: '家常菜', subcategory: '热菜', tag: '清淡', difficulty: 'easy', favorite: '1', page: '3', view: 'list' }
  assert.deepEqual(buildCatalogQuery(readCatalogQuery(query)), query)
})

test('catalog links discard malformed or unrelated parameters', () => {
  const parsed = readCatalogQuery({ q: ['a', 'b'], category: 3, subcategory: 'orphan', tag: 'x'.repeat(1001), difficulty: 'other', favorite: 'true', page: '999999999999999999999', view: 'unknown', redirect: 'https://example.test/' })
  assert.deepEqual(buildCatalogQuery(parsed), {})
  assert.deepEqual(filterCatalogQuery({ q: 'a'.repeat(201), page: '0', favorite: '1' }), { favorite: '1' })
})

test('uncategorized links are distinct from a named category and survive round trips', () => {
  const query = { q: '番茄', uncategorized: '1', favorite: '1', page: '2' }
  assert.deepEqual(buildCatalogQuery(readCatalogQuery(query)), query)
  assert.deepEqual(filterCatalogQuery({ uncategorized: '1', category: '热菜', subcategory: '炒菜' }), { uncategorized: '1' })
  assert.deepEqual(filterCatalogQuery({ uncategorized: 'true' }), {})
})
