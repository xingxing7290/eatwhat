const test = require('node:test');
const assert = require('node:assert/strict');
const { auditAndApply } = require('../scripts/meal-wish-index');
const { INDEX_KEY, INDEX_OPTIONS } = require('../utils/mealWishIndex');

function fixture({ duplicates = 0, invalidMeals = 0, invalidHomes = 0, verify = true } = {}) {
  let indexed = false;
  let createCalls = 0;
  let countCalls = 0;
  const collection = {
    indexes: async () => indexed && verify ? [{ key: INDEX_KEY, ...INDEX_OPTIONS }] : [],
    aggregate: () => ({ toArray: async () => duplicates ? [{ groups: duplicates }] : [] }),
    countDocuments: async () => (++countCalls % 2 ? invalidMeals : invalidHomes),
    createIndex: async (key, options) => { assert.deepEqual(key, INDEX_KEY); assert.deepEqual(options, INDEX_OPTIONS); createCalls++; indexed = true; }
  };
  return { collection, created: () => createCalls };
}

test('audit is read-only even when duplicates or invalid references exist', async () => {
  const f = fixture({ duplicates: 2, invalidMeals: 1, invalidHomes: 3 });
  const result = await auditAndApply(f.collection, { database: 'test', apply: false });
  assert.equal(result.duplicateGroups, 2);
  assert.equal(result.invalidMealRefs, 1);
  assert.equal(result.invalidHouseholds, 3);
  assert.equal(f.created(), 0);
});

test('apply refuses duplicates or invalid references without creating an index', async () => {
  for (const data of [{ duplicates: 1 }, { invalidMeals: 1 }, { invalidHomes: 1 }]) {
    const f = fixture(data);
    await assert.rejects(auditAndApply(f.collection, { database: 'test', apply: true }));
    assert.equal(f.created(), 0);
  }
});

test('apply creates and verifies only the expected index', async () => {
  const f = fixture();
  const result = await auditAndApply(f.collection, { database: 'test', apply: true });
  assert.equal(result.created, true);
  assert.equal(f.created(), 1);
  const again = await auditAndApply(f.collection, { database: 'test', apply: true });
  assert.equal(again.safeIndexExists, true);
  assert.equal(f.created(), 1);
});

test('apply reports failure if the created index cannot be verified', async () => {
  const f = fixture({ verify: false });
  await assert.rejects(auditAndApply(f.collection, { database: 'test', apply: true }), /Could not verify/);
});
