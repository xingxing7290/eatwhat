const test = require('node:test');
const assert = require('node:assert/strict');
const Schedule = require('../models/scheduleModel');
const household = require('../utils/household');
household.ensureUserHousehold = async () => ({ household: { _id: 'home-a' } });
const controller = require('../controllers/scheduleController');

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
}
function request(body) {
  return { user: { uid: 'user-a' }, params: { date: '2026-10-28', mealType: 'dinner' }, body, headers: {} };
}
async function update(body) {
  const res = response();
  let failure;
  await controller.updateSchedule(request(body), res, error => { failure = error; });
  if (failure) throw failure;
  return res;
}

test('conditional updates compare the household and version atomically', async () => {
  let observed;
  Schedule.findOneAndUpdate = (filter, update, options) => {
    observed = { filter, update, options };
    return { populate: async () => ({ date: '2026-10-28' }) };
  };
  const res = await update({ mealIds: [], expectedVersion: '2026-10-28T08:00:00.000Z' });
  assert.equal(res.statusCode, 200);
  assert.equal(observed.filter.householdId, 'home-a');
  assert.equal(observed.filter.date, '2026-10-28');
  assert.equal(observed.filter.updatedAt.toISOString(), '2026-10-28T08:00:00.000Z');
  assert.equal(observed.options.upsert, false);
  assert.deepEqual(observed.update.$set['meals.dinner'], []);
});

test('stale versions return a conflict rather than upserting', async () => {
  Schedule.findOneAndUpdate = () => ({ populate: async () => null });
  const res = await update({ mealIds: [], expectedVersion: '2026-10-28T08:00:00.000Z' });
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.code, 'SCHEDULE_CONFLICT');
});

test('new schedules use a unique insert and duplicate inserts are conflicts', async () => {
  let created;
  Schedule.create = async data => { created = data; return { populate: async () => {} }; };
  assert.equal((await update({ mealIds: [], expectedVersion: null })).statusCode, 200);
  assert.equal(created.householdId, 'home-a');
  assert.deepEqual(created.meals.dinner, []);
  Schedule.create = async () => { const error = new Error('duplicate'); error.code = 11000; throw error; };
  assert.equal((await update({ mealIds: [], expectedVersion: null })).statusCode, 409);
});

test('legacy clients remain supported and malformed versions are rejected', async () => {
  let options;
  Schedule.findOneAndUpdate = (filter, update, opts) => { options = opts; return { populate: async () => ({}) }; };
  assert.equal((await update({ mealIds: [] })).statusCode, 200);
  assert.equal(options.upsert, true);
  assert.equal((await update({ mealIds: [], expectedVersion: 'invalid' })).statusCode, 400);
});

test('daily read exposes version support even when no schedule exists', async () => {
  Schedule.findOne = async () => null;
  const res = response();
  await controller.getScheduleByDate(request({}), res, error => { throw error; });
  assert.equal(res.data.scheduleExists, false);
  assert.equal(res.data.scheduleVersion, null);
});

test('daily read returns the persisted version to web and keeps the mobile response compact', async () => {
  const doc = {
    date: '2026-10-28', updatedAt: new Date('2026-10-28T08:00:00.000Z'),
    meals: { breakfast: [], lunch: [], dinner: [] },
    populate: async () => {},
    toObject() { return { date: this.date, meals: this.meals, updatedAt: this.updatedAt }; }
  };
  Schedule.findOne = async () => doc;
  const web = response();
  await controller.getScheduleByDate(request({}), web, error => { throw error; });
  assert.equal(web.data.scheduleExists, true);
  assert.equal(web.data.scheduleVersion, '2026-10-28T08:00:00.000Z');
  const mobile = response();
  const mobileRequest = request({});
  mobileRequest.headers['x-mobile-client'] = 'eatwhat-flutter';
  await controller.getScheduleByDate(mobileRequest, mobile, error => { throw error; });
  assert.equal(mobile.data.scheduleVersion, undefined);
  assert.equal(mobile.data.date, '2026-10-28');
});
