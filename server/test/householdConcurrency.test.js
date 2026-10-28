const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/userModel');
const Household = require('../models/householdModel');
const defaults = require('../utils/defaultMeals');
// Stub seeding before the household utility is loaded: unit tests must not
// write default images or connect to any database.
defaults.seedDefaultMealsForHousehold = async () => ({});
const household = require('../utils/household');
let createHousehold;
household.createHousehold = (...args) => createHousehold(...args);
household.withCurrentMembers = async home => ({ ...home, members: [{ _id: 'u1', username: 'test' }] });
const auth = require('../controllers/authController');
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }

test('new invitation codes use a sufficiently long random value and check uniqueness', async () => {
  let calls = 0;
  Household.exists = async () => { calls++; return false; };
  const code = await household.generateInviteCode();
  assert.match(code, /^[0-9A-F]{20}$/);
  assert.equal(calls, 1);
});

test('invitation generation does not return an unchecked code after collisions', async () => {
  let calls = 0;
  Household.exists = async () => { calls++; return true; };
  await assert.rejects(household.generateInviteCode(), /无法生成唯一邀请码/);
  assert.equal(calls, 20);
});

test('legacy fallback cannot overwrite a concurrent household switch', async () => {
  let reads = 0;
  User.findById = async () => (++reads === 1 ? { _id: 'u1', householdId: null } : { _id: 'u1', householdId: 'home-b' });
  Household.findOne = async () => ({ _id: 'default-home', createdBy: null });
  Household.findById = async id => ({ _id: id });
  let filter;
  User.findOneAndUpdate = async query => { filter = query; return null; };
  const membershipUpdates = [];
  Household.updateOne = async query => { membershipUpdates.push(query); };
  const result = await household.ensureUserHousehold('u1');
  assert.equal(filter.householdId, null);
  assert.equal(result.user.householdId, 'home-b');
  assert.equal(result.household._id, 'home-b');
  assert.deepEqual(membershipUpdates, [{ _id: 'home-b' }]);
});

test('expected household is rechecked before fallback or membership updates', async () => {
  User.findById = async () => ({ _id: 'u1', householdId: 'home-b' });
  let writes = 0;
  Household.updateOne = async () => { writes++; };
  await assert.rejects(household.ensureUserHousehold('u1', 0, 'home-a'), error => error.status === 409 && error.code === 'HOUSEHOLD_SCOPE_CHANGED');
  assert.equal(writes, 0);
});

test('a scoped request cannot repair a missing household into another household', async () => {
  User.findById = async () => ({ _id: 'u1', householdId: 'deleted-home' });
  Household.findById = async () => null;
  let fallbackReads = 0;
  Household.findOne = async () => { fallbackReads++; return null; };
  await assert.rejects(household.ensureUserHousehold('u1', 0, 'deleted-home'), error => error.status === 409 && error.code === 'HOUSEHOLD_SCOPE_CHANGED');
  assert.equal(fallbackReads, 0);
});

test('fallback initializes an unassigned account only if it remains unassigned', async () => {
  User.findById = async () => ({ _id: 'u1', householdId: null });
  Household.findOne = async () => ({ _id: 'default-home', createdBy: null });
  User.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter.householdId, null);
    assert.equal(update.$set.householdId, 'default-home');
    return { _id: 'u1', householdId: 'default-home' };
  };
  Household.updateOne = async () => {};
  const result = await household.ensureUserHousehold('u1');
  assert.equal(result.user.householdId, 'default-home');
});

test('repairing a missing household cannot overwrite a concurrent switch', async () => {
  let reads = 0;
  User.findById = async () => (++reads === 1 ? { _id: 'u1', householdId: 'deleted-home' } : { _id: 'u1', householdId: 'home-b' });
  Household.findById = async id => id === 'deleted-home' ? null : { _id: id };
  Household.findOne = async () => ({ _id: 'default-home', createdBy: null });
  User.findOneAndUpdate = async filter => { assert.equal(filter.householdId, 'deleted-home'); return null; };
  Household.updateOne = async () => {};
  const result = await household.ensureUserHousehold('u1');
  assert.equal(result.user.householdId, 'home-b');
  assert.equal(result.household._id, 'home-b');
});

test('repeated fallback races stop with a conflict instead of looping', async () => {
  let attempts = 0;
  User.findById = async () => ({ _id: 'u1', householdId: null });
  Household.findOne = async () => ({ _id: 'default-home', createdBy: null });
  User.findOneAndUpdate = async () => { attempts++; return null; };
  await assert.rejects(household.ensureUserHousehold('u1'), error => error.status === 409);
  assert.equal(attempts, 4);
});

test('registration does not replace a concurrently assigned household', async () => {
  User.findOne = async () => null;
  User.create = async () => ({ _id: 'u1', username: 'test', householdId: null });
  createHousehold = async () => ({ _id: 'new-home', name: '新家', inviteCode: 'ABC123' });
  User.findOneAndUpdate = async filter => { assert.equal(filter.householdId, null); return null; };
  const res = response();
  let failure;
  await auth.register({ body: { username: 'test', password: 'test-only-password' } }, res, error => { failure = error; });
  assert.equal(failure, undefined);
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.code, 'ACCOUNT_SETUP_CONFLICT');
});

test('registration returns the household it successfully claimed', async () => {
  User.findOne = async () => null;
  User.create = async () => ({ _id: 'u1', username: 'test', householdId: null });
  createHousehold = async () => ({ _id: 'new-home', name: '新家', inviteCode: 'ABC123' });
  User.findOneAndUpdate = async () => ({ _id: 'u1', username: 'test', householdId: 'new-home' });
  const res = response();
  let failure;
  await auth.register({ body: { username: 'test', password: 'test-only-password' } }, res, error => { failure = error; });
  assert.equal(failure, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(res.data.user.householdId, 'new-home');
  assert.equal(res.data.household.id, 'new-home');
});
