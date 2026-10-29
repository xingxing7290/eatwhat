import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMealSearch } from '../src/utils/mealSearch.mjs'

const meals = Array.from({ length: 60 }, (_, index) => ({ _id: `m${index}`, name: `菜${index}`, ingredients: [{ name: index === 59 ? '番茄' : '青菜' }] }))

test('legacy full lists filter across all recipes before limiting results', () => {
  assert.deepEqual(normalizeMealSearch({ data: meals, total: 60 }, '番茄'), { rows: [meals[59]], total: 1 })
  assert.equal(normalizeMealSearch({ data: meals, total: 60 }, '').rows.length, 50)
})

test('paginated results must be complete, unique and on the requested page', () => {
  const valid = { data: meals.slice(0, 50), total: 60, page: 1, limit: 50 }
  assert.equal(normalizeMealSearch(valid, '').total, 60)
  for (const result of [
    { ...valid, page: 2 },
    { ...valid, data: meals.slice(0, 49) },
    { ...valid, data: [...meals.slice(0, 49), meals[0]] },
    { data: meals.slice(0, 1), total: 60 },
    { data: [{ _id: 'x', name: '' }], total: 1, page: 1, limit: 50 }
  ]) assert.throws(() => normalizeMealSearch(result, ''))
  assert.deepEqual(normalizeMealSearch({ data: meals.slice(8, 16), total: 60, page: 2, limit: 8 }, '', 8, { page: 2 }).rows, meals.slice(8, 16))
  assert.throws(() => normalizeMealSearch({ data: meals.slice(0, 8), total: 60, page: 1, limit: 8 }, '', 8, { page: 2 }))
  const categorized = meals.map((meal, index) => ({ ...meal, category: index % 2 ? '素菜' : '荤菜' }))
  assert.deepEqual(normalizeMealSearch({ data: categorized, total: 60 }, '', 8, { page: 2, category: '素菜' }).rows, categorized.filter(meal => meal.category === '素菜').slice(8, 16))
})
