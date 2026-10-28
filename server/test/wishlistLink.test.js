const test = require('node:test');
const assert = require('node:assert/strict');
const WishlistItem = require('../models/wishlistModel');
const Meal = require('../models/mealModel');
const household = require('../utils/household');
household.ensureUserHousehold = async () => ({ household: { _id: 'home-a' } });
const controller = require('../controllers/wishlistController');

function query(value) { return { populate() { return this; }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } }; }
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.data = value; return this; } }; }
async function attach(body) {
  const res = response();
  let failure;
  await controller.attachMeal({ user: { uid: 'user-a' }, params: { id: 'wish-a' }, body }, res, error => { failure = error; });
  if (failure) throw failure;
  return res;
}

test('safe attachment checks household and requires an unlinked wish without changing its status', async () => {
  Meal.findOne = async () => ({});
  let observed;
  WishlistItem.findOneAndUpdate = (filter, update) => { observed = { filter, update }; return query({ votes: [], mealId: 'meal-a' }); };
  const res = await attach({ mealId: 'meal-a', onlyIfUnlinked: true });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(observed.filter, { _id: 'wish-a', householdId: 'home-a', mealId: null });
  assert.deepEqual(observed.update, { mealId: 'meal-a' });
});

test('safe attachment reports an existing link without overwriting it', async () => {
  Meal.findOne = async () => ({});
  WishlistItem.findOneAndUpdate = () => query(null);
  WishlistItem.exists = async () => true;
  const res = await attach({ mealId: 'meal-a', onlyIfUnlinked: true });
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.code, 'WISH_ALREADY_LINKED');
});

test('missing or foreign wishes and foreign meals are rejected', async () => {
  Meal.findOne = async () => null;
  assert.equal((await attach({ mealId: 'meal-a', onlyIfUnlinked: true })).statusCode, 400);
  Meal.findOne = async () => ({});
  WishlistItem.findOneAndUpdate = () => query(null);
  WishlistItem.exists = async () => false;
  assert.equal((await attach({ mealId: 'meal-a', onlyIfUnlinked: true })).statusCode, 404);
});

test('legacy attachment behavior remains available', async () => {
  Meal.findOne = async () => ({});
  let update;
  WishlistItem.findOneAndUpdate = (filter, value) => { update = value; return query({ votes: [] }); };
  assert.equal((await attach({ mealId: 'meal-a' })).statusCode, 200);
  assert.deepEqual(update, { mealId: 'meal-a', status: 'open' });
});
