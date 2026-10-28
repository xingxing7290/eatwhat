const test = require('node:test');
const assert = require('node:assert/strict');
const WishlistItem = require('../models/wishlistModel');
const Meal = require('../models/mealModel');
const household = require('../utils/household');
const { INDEX_NAME, INDEX_KEY, INDEX_OPTIONS, isSafeMealWishIndex } = require('../utils/mealWishIndex');
household.ensureUserHousehold = async () => ({ household: { _id: 'home-a' } });
const controller = require('../controllers/wishlistController');

const mealId = '507f1f77bcf86cd799439011';
const correctIndex = { ...INDEX_OPTIONS, key: INDEX_KEY };
function query(value) { return { populate() { return this; }, sort() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } }; }
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.data = value; return this; } }; }
async function invoke(method, body = {}, queryParams = {}) {
  const res = response();
  let failure;
  await controller[method]({ user: { uid: 'user-a' }, body, query: queryParams, params: { id: 'wish-a' } }, res, error => { failure = error; });
  if (failure) throw failure;
  return res;
}

test('safe index requires exact keys and partial unique scope', () => {
  assert.equal(isSafeMealWishIndex(correctIndex), true);
  assert.equal(isSafeMealWishIndex({ ...correctIndex, unique: false }), false);
  assert.equal(isSafeMealWishIndex({ ...correctIndex, key: { mealId: 1, householdId: 1, status: 1 } }), false);
  assert.equal(isSafeMealWishIndex({ ...correctIndex, partialFilterExpression: { status: 'open' } }), false);
  assert.equal(isSafeMealWishIndex({ ...correctIndex, name: 'different' }), false);
  assert.equal(INDEX_NAME, 'uniq_open_household_meal');
});

test('capabilities are opt-in and unsafe index blocks atomic creation', async () => {
  WishlistItem.find = () => query([]);
  WishlistItem.collection.indexes = async () => [];
  assert.deepEqual((await invoke('list')).data, []);
  assert.deepEqual((await invoke('list', {}, { includeCapabilities: 'true' })).data, { items: [], supportsAtomicMealWish: false });
  let created = false;
  WishlistItem.create = async () => { created = true; };
  const result = await invoke('createMealWish', { mealId });
  assert.equal(result.statusCode, 503);
  assert.equal(result.data.code, 'MEAL_WISH_INDEX_REQUIRED');
  assert.equal(created, false);
});

test('atomic creation enforces household and converts a concurrent duplicate into the existing record', async () => {
  WishlistItem.collection.indexes = async () => [correctIndex];
  let mealFilter;
  Meal.findOne = async filter => { mealFilter = filter; return { _id: mealId, name: '测试菜', category: '家常菜' }; };
  const item = { _id: 'wish-a', mealId, status: 'open', votes: [] };
  let inserted = false;
  WishlistItem.create = async () => {
    if (inserted) throw { code: 11000, keyPattern: { householdId: 1, mealId: 1 } };
    inserted = true;
    return item;
  };
  WishlistItem.findOne = filter => { assert.deepEqual(filter, { householdId: 'home-a', mealId, status: 'open' }); return query(item); };
  WishlistItem.findById = () => query(item);
  const results = await Promise.all([invoke('createMealWish', { mealId }), invoke('createMealWish', { mealId })]);
  assert.deepEqual(results.map(result => result.statusCode).sort(), [200, 201]);
  assert.deepEqual(results.map(result => result.data.alreadyExists).sort(), [false, true]);
  assert.deepEqual(mealFilter, { _id: mealId, householdId: 'home-a' });
  Meal.findOne = async () => null;
  assert.equal((await invoke('createMealWish', { mealId })).statusCode, 404);
  assert.equal((await invoke('createMealWish', { mealId: 'invalid' })).statusCode, 400);
});

test('legacy create returns a clear conflict when the safe index rejects a duplicate', async () => {
  Meal.findOne = async () => ({});
  WishlistItem.create = async () => { throw { code: 11000, keyPattern: { householdId: 1, mealId: 1 } }; };
  const result = await invoke('create', { title: '测试菜', mealId });
  assert.equal(result.statusCode, 409);
  assert.equal(result.data.code, 'WISH_ALREADY_OPEN');
});

test('legacy status and attachment conflicts are reported without overwriting another open wish', async () => {
  Meal.findOne = async () => ({});
  WishlistItem.findOneAndUpdate = () => { throw { code: 11000, keyPattern: { householdId: 1, mealId: 1 } }; };
  for (const [method, body] of [['updateStatus', { status: 'open' }], ['attachMeal', { mealId, onlyIfUnlinked: true }]]) {
    const result = await invoke(method, body);
    assert.equal(result.statusCode, 409);
    assert.equal(result.data.code, 'WISH_ALREADY_OPEN');
  }
});
