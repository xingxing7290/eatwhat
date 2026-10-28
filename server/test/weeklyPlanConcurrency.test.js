const test = require('node:test');
const assert = require('node:assert/strict');
const Schedule = require('../models/scheduleModel');
const household = require('../utils/household');
household.ensureUserHousehold = async () => ({ household: { _id: 'home-a' } });
const controller = require('../controllers/weeklyPlanController');
const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
const makeDays = () => dates.map(date => ({ date, meals: { breakfast: [], lunch: [], dinner: [] } }));
const makeVersions = () => Object.fromEntries(dates.map(date => [date, null]));
function response() { return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }
function findResult(docs) { return { then(resolve, reject) { return Promise.resolve(docs).then(resolve, reject); }, populate: async () => docs }; }
async function apply(body) {
  const res = response();
  let failure;
  await controller.apply({ user: { uid: 'user-a' }, body }, res, error => { failure = error; });
  if (failure) throw failure;
  return res;
}

test('rejects incomplete conditional plans before writing', async () => {
  let wrote = false;
  Schedule.create = async () => { wrote = true; };
  const res = await apply({ days: makeDays().slice(0, 6), expectedVersions: makeVersions() });
  assert.equal(res.statusCode, 400);
  assert.equal(wrote, false);
});

test('preflight detects a changed day before any writes', async () => {
  let wrote = false;
  Schedule.find = () => findResult([{ date: dates[3], updatedAt: new Date('2026-10-28T08:00:00.000Z') }]);
  Schedule.create = async () => { wrote = true; };
  const res = await apply({ days: makeDays(), expectedVersions: makeVersions() });
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.conflictDate, dates[3]);
  assert.deepEqual(res.data.appliedDates, []);
  assert.equal(wrote, false);
});

test('a concurrent insert reports the exact days written before the conflict', async () => {
  Schedule.find = () => findResult([]);
  let count = 0;
  Schedule.create = async () => { if (++count === 3) { const error = new Error('duplicate'); error.code = 11000; throw error; } };
  const res = await apply({ days: makeDays(), expectedVersions: makeVersions() });
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.conflictDate, dates[2]);
  assert.deepEqual(res.data.appliedDates, dates.slice(0, 2));
  assert.equal(count, 3);
});

test('write errors report confirmed days and the uncertain date', async () => {
  Schedule.find = () => findResult([]);
  let count = 0;
  Schedule.create = async () => { if (++count === 2) throw new Error('connection interrupted'); };
  const res = await apply({ days: makeDays(), expectedVersions: makeVersions() });
  assert.equal(res.statusCode, 500);
  assert.equal(res.data.code, 'WEEKLY_PLAN_INCOMPLETE');
  assert.deepEqual(res.data.appliedDates, [dates[0]]);
  assert.equal(res.data.uncertainDate, dates[1]);
});

test('an existing-day compare-and-set detects a race after preflight', async () => {
  const version = '2026-10-28T08:00:00.000Z';
  const versions = makeVersions();
  versions[dates[1]] = version;
  Schedule.find = () => findResult([{ date: dates[1], updatedAt: new Date(version) }]);
  Schedule.create = async () => {};
  Schedule.findOneAndUpdate = async () => null;
  const res = await apply({ days: makeDays(), expectedVersions: versions });
  assert.equal(res.statusCode, 409);
  assert.equal(res.data.conflictDate, dates[1]);
  assert.deepEqual(res.data.appliedDates, [dates[0]]);
});

test('existing days use an atomic version filter and new days use unique inserts', async () => {
  const version = '2026-10-28T08:00:00.000Z';
  const versions = makeVersions();
  versions[dates[0]] = version;
  Schedule.find = () => findResult([{ date: dates[0], updatedAt: new Date(version), meals: {} }]);
  let filter;
  Schedule.findOneAndUpdate = async (query, update, options) => { filter = { query, options }; return {}; };
  const created = [];
  Schedule.create = async doc => { created.push(doc.date); };
  const res = await apply({ days: makeDays(), expectedVersions: versions });
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.applied, 7);
  assert.equal(filter.query.householdId, 'home-a');
  assert.equal(filter.query.updatedAt.toISOString(), version);
  assert.equal(filter.options.upsert, false);
  assert.deepEqual(created, dates.slice(1));
});

test('weekly read exposes empty-day versions and conditional capability', async () => {
  Schedule.find = () => findResult([]);
  const res = response();
  await controller.list({ user: { uid: 'user-a' }, query: { weekStart: dates[0] } }, res, error => { throw error; });
  assert.equal(res.data.supportsConditionalApply, true);
  assert.equal(res.data.days.length, 7);
  assert.equal(res.data.days[0].scheduleExists, false);
  assert.equal(res.data.days[0].scheduleVersion, null);
});

test('legacy weekly clients can still apply without a version snapshot', async () => {
  Schedule.find = () => findResult([]);
  const options = [];
  Schedule.findOneAndUpdate = async (query, update, opts) => { options.push(opts); return {}; };
  const res = await apply({ days: makeDays() });
  assert.equal(res.statusCode, 200);
  assert.equal(options.length, 7);
  assert.equal(options.every(value => value.upsert === true), true);
});
