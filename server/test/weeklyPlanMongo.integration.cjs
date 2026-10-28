// Run only against the dedicated, disposable MongoDB container described in test/README.md.
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'isolated-integration-secret-not-for-production';
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const Schedule = require('../models/scheduleModel');
const WishlistItem = require('../models/wishlistModel');
const weekly = require('../controllers/weeklyPlanController');
const schedules = require('../controllers/scheduleController');
const wishlist = require('../controllers/wishlistController');
const anniversary = require('../controllers/anniversaryController');
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const uri = process.env.EATWHAT_TEST_MONGO_URI;
if (uri !== 'mongodb://eatwhat-integration-mongo:27017/isolated_eatwhat_integration') {
  throw new Error('Refusing to run: the dedicated isolated test MongoDB URI is required');
}

async function main() {
  let server;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    await Schedule.init();
    const house = await Household.create({ name: 'Integration A', inviteCode: 'TEST-A' });
    const otherHouse = await Household.create({ name: 'Integration B', inviteCode: 'TEST-B' });
    const passwordHash = await bcrypt.hash('test-only-password', 4);
    const user = await User.create({ username: 'integration-a', passwordHash, householdId: house._id });
    const otherUser = await User.create({ username: 'integration-b', passwordHash, householdId: otherHouse._id });
    const [mealA, mealB] = await Meal.create([
      { householdId: house._id, name: 'Test meal A' },
      { householdId: house._id, name: 'Test meal B' }
    ]);
    const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
    await Schedule.create({ householdId: house._id, date: dates[2], meals: { dinner: [{ meal: mealA._id, addedBy: user._id }] } });

    const app = express();
    app.use(express.json());
    app.post('/auth/login', authController.login);
    app.get('/auth/me', requireAuth(), authController.me);
    app.use(requireAuth());
    app.get('/weekly-plans', weekly.list);
    app.post('/weekly-plans/apply', weekly.apply);
    app.get('/schedules', schedules.getSchedules);
    app.get('/schedules/day/:date', schedules.getScheduleByDate);
    app.put('/schedules/:date/:mealType', schedules.updateSchedule);
    app.get('/wishlist', wishlist.list);
    app.patch('/wishlist/:id/meal', wishlist.attachMeal);
    app.post('/anniversaries', anniversary.create);
    app.use((error, req, res, next) => res.status(500).json({ error: error.message }));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    let primaryToken;
    async function request(path, { method = 'GET', body, token = primaryToken } = {}) {
      const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: response.status, data: await response.json() };
    }
    const loginA = await request('/auth/login', { method: 'POST', token: null, body: { username: 'integration-a', password: 'test-only-password' } });
    const loginB = await request('/auth/login', { method: 'POST', token: null, body: { username: 'integration-b', password: 'test-only-password' } });
    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);
    assert.ok(loginA.data.token && loginB.data.token);
    primaryToken = loginA.data.token;
    assert.equal((await request('/auth/login', { method: 'POST', token: null, body: { username: 'integration-a', password: 'incorrect' } })).status, 401);
    assert.equal((await request('/auth/me', { token: null })).status, 401);
    assert.equal((await request('/auth/me', { token: 'not-a-valid-token' })).status, 401);
    assert.equal((await request(`/weekly-plans?weekStart=${dates[0]}`, { token: null })).status, 401);
    const me = await request('/auth/me');
    assert.equal(me.status, 200);
    assert.equal(String(me.data.user.householdId), String(house._id));
    assert.equal('passwordHash' in me.data.user, false);
    async function snapshot(weekStart = dates[0]) {
      const result = await request(`/weekly-plans?weekStart=${weekStart}`);
      assert.equal(result.status, 200);
      assert.equal(result.data.supportsConditionalApply, true);
      return Object.fromEntries(result.data.days.map(day => [day.date, day.scheduleVersion]));
    }
    const plan = dates.map(date => ({ date, meals: { breakfast: [], lunch: [], dinner: [String(mealA._id)] } }));
    const expectedVersions = await snapshot();
    assert.equal(expectedVersions[dates[0]], null);
    assert.ok(expectedVersions[dates[2]]);

    // Force a real concurrent write between preflight and the third conditional update.
    const original = Schedule.findOneAndUpdate;
    let injected = false;
    Schedule.findOneAndUpdate = function (filter, ...args) {
      if (filter.date !== dates[2] || injected) return original.call(this, filter, ...args);
      injected = true;
      return (async () => {
        await Schedule.updateOne({ householdId: house._id, date: dates[2] }, {
          $set: { 'meals.lunch': [{ meal: mealB._id, addedBy: user._id }], updatedAt: new Date(Date.parse(expectedVersions[dates[2]]) + 1000) }
        }, { timestamps: false });
        return original.call(this, filter, ...args);
      })();
    };
    const conflict = await request('/weekly-plans/apply', { method: 'POST', body: { days: plan, expectedVersions } });
    Schedule.findOneAndUpdate = original;
    assert.equal(conflict.status, 409);
    assert.deepEqual(conflict.data.appliedDates, dates.slice(0, 2));
    assert.equal(conflict.data.conflictDate, dates[2]);
    const changed = await Schedule.findOne({ householdId: house._id, date: dates[2] });
    assert.equal(String(changed.meals.lunch[0].meal), String(mealB._id));
    assert.equal(await Schedule.countDocuments({ householdId: house._id }), 3);

    const success = await request('/weekly-plans/apply', { method: 'POST', body: { days: plan, expectedVersions: await snapshot() } });
    assert.equal(success.status, 200);
    assert.equal(success.data.applied, 7);
    assert.equal(await Schedule.countDocuments({ householdId: house._id }), 7);
    const monthly = await request('/schedules?year=2026&month=10');
    assert.equal(monthly.status, 200);
    assert.equal(monthly.data.length, 31);
    const monthEnd = monthly.data.find(day => day.date === '2026-10-31');
    assert.equal(monthEnd.scheduleExists, true);
    assert.ok(monthEnd.scheduleVersion);
    assert.equal(String(monthEnd.meals.dinner[0].meal._id), String(mealA._id));

    // A schedule created after preflight must not be overwritten by the batch.
    const nextWeek = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'];
    const nextPlan = nextWeek.map(date => ({ date, meals: { breakfast: [], lunch: [], dinner: [String(mealA._id)] } }));
    const nextVersions = await snapshot(nextWeek[0]);
    const originalCreate = Schedule.create;
    let inserted = false;
    Schedule.create = function (doc, ...args) {
      if (doc.date !== nextWeek[2] || inserted) return originalCreate.call(this, doc, ...args);
      inserted = true;
      return (async () => {
        await originalCreate.call(this, { householdId: house._id, date: doc.date, meals: { lunch: [{ meal: mealB._id, addedBy: user._id }] } });
        return originalCreate.call(this, doc, ...args);
      })();
    };
    const insertConflict = await request('/weekly-plans/apply', { method: 'POST', body: { days: nextPlan, expectedVersions: nextVersions } });
    Schedule.create = originalCreate;
    assert.equal(insertConflict.status, 409);
    assert.deepEqual(insertConflict.data.appliedDates, nextWeek.slice(0, 2));
    assert.equal(insertConflict.data.conflictDate, nextWeek[2]);
    const insertedSchedule = await Schedule.findOne({ householdId: house._id, date: nextWeek[2] });
    assert.equal(String(insertedSchedule.meals.lunch[0].meal), String(mealB._id));
    assert.equal(insertedSchedule.meals.dinner.length, 0);

    const daily = await request(`/schedules/day/${dates[2]}`);
    assert.equal(daily.status, 200);
    assert.ok(daily.data.scheduleVersion);
    await Schedule.updateOne({ householdId: house._id, date: dates[2] }, { $set: { updatedAt: new Date(Date.parse(daily.data.scheduleVersion) + 1000) } }, { timestamps: false });
    const stale = await request(`/schedules/${dates[2]}/dinner`, { method: 'PUT', body: { mealIds: [], expectedVersion: daily.data.scheduleVersion } });
    assert.equal(stale.status, 409);
    assert.equal((await Schedule.findOne({ householdId: house._id, date: dates[2] })).meals.dinner.length, 1);

    const otherDaily = await request(`/schedules/day/${dates[2]}`, { token: loginB.data.token });
    assert.equal(otherDaily.data.scheduleExists, false);
    const crossHouse = await request(`/schedules/${dates[2]}/dinner`, { method: 'PUT', token: loginB.data.token, body: { mealIds: [String(mealA._id)], expectedVersion: null } });
    assert.equal(crossHouse.status, 400);

    const wish = await WishlistItem.create({ householdId: house._id, title: 'Integration wish', status: 'planned', createdBy: user._id });
    const listing = await request('/wishlist');
    assert.equal(listing.data[0].supportsSafeMealLink, true);
    const linked = await request(`/wishlist/${wish._id}/meal`, { method: 'PATCH', body: { mealId: String(mealA._id), onlyIfUnlinked: true } });
    assert.equal(linked.status, 200);
    assert.equal(linked.data.status, 'planned');
    const linkConflict = await request(`/wishlist/${wish._id}/meal`, { method: 'PATCH', body: { mealId: String(mealB._id), onlyIfUnlinked: true } });
    assert.equal(linkConflict.status, 409);
    assert.equal(String((await WishlistItem.findById(wish._id)).mealId), String(mealA._id));
    const foreignLink = await request(`/wishlist/${wish._id}/meal`, { method: 'PATCH', token: loginB.data.token, body: { mealId: String(mealA._id), onlyIfUnlinked: true } });
    assert.equal(foreignLink.status, 400);
    const anniversaryBody = { title: 'Integration anniversary', date: dates[0], meals: { breakfast: [String(mealA._id)], lunch: [String(mealA._id)], dinner: [String(mealA._id)] } };
    const repeatedMeal = await request('/anniversaries', { method: 'POST', body: anniversaryBody });
    assert.equal(repeatedMeal.status, 201);
    assert.equal(String(repeatedMeal.data.meals.breakfast[0]._id), String(mealA._id));
    assert.equal(String(repeatedMeal.data.meals.dinner[0]._id), String(mealA._id));
    const foreignMenu = await request('/anniversaries', { method: 'POST', token: loginB.data.token, body: anniversaryBody });
    assert.equal(foreignMenu.status, 400);
    console.log('Mongo integration passed: real login and JWT, schedules, wish linking, anniversary meals and household isolation');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
