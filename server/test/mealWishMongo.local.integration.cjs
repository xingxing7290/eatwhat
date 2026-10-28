// Starts a new loopback-only mongod in a fresh temporary directory. It never
// accepts a MongoDB URI and refuses to write unless the spawned process reports
// the expected port and database directory and the test database is empty.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
// Mongoose must not create collections before the empty-database safety check.
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'isolated-local-test-secret-never-use-in-production';
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const MealMemory = require('../models/memoryModel');
const AnniversaryMenu = require('../models/anniversaryMenuModel');
const Schedule = require('../models/scheduleModel');
const ShoppingList = require('../models/shoppingListModel');
const WishlistItem = require('../models/wishlistModel');
const wishlist = require('../controllers/wishlistController');
const mealController = require('../controllers/mealController');
const dashboardController = require('../controllers/dashboardController');
const scheduleController = require('../controllers/scheduleController');
const weeklyPlanController = require('../controllers/weeklyPlanController');
const shoppingController = require('../controllers/shoppingListController');
const photoAlbumController = require('../controllers/photoAlbumController');
const memoryController = require('../controllers/memoryController');
const anniversaryController = require('../controllers/anniversaryController');
const anniversaryTemplateController = require('../controllers/anniversaryTemplateController');
const authController = require('../controllers/authController');
const householdController = require('../controllers/householdController');
const requireAuth = require('../middleware/auth');
const { auditAndApply } = require('../scripts/meal-wish-index');
const { auditAndApply: auditShoppingIndex } = require('../scripts/shopping-list-index');

const executable = process.env.EATWHAT_TEST_MONGOD;
if (!executable || !path.isAbsolute(executable) || !fs.existsSync(executable)) throw new Error('EATWHAT_TEST_MONGOD must name a trusted absolute mongod executable.');

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve, reject) => socket.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eatwhat-local-mongo-'));
  const dbPath = path.join(root, 'db');
  fs.mkdirSync(dbPath);
  const port = await freePort();
  const child = spawn(executable, ['--bind_ip', '127.0.0.1', '--port', String(port), '--dbpath', dbPath, '--logpath', path.join(root, 'mongod.log'), '--wiredTigerCacheSizeGB', '0.25', '--setParameter', 'diagnosticDataCollectionEnabled=false'], { windowsHide: true, stdio: 'ignore' });
  let spawnError;
  child.on('error', error => { spawnError = error; });
  let server;
  let webServer;
  let browser;
  let connected = false;
  let ownedMongo = false;
  try {
    const uri = `mongodb://127.0.0.1:${port}/isolated_meal_wish`;
    for (let attempt = 0; attempt < 40 && !connected; attempt++) {
      if (spawnError || child.exitCode !== null) throw spawnError || new Error(`mongod exited early; inspect ${path.join(root, 'mongod.log')}`);
      try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 700, directConnection: true, autoCreate: false, autoIndex: false }); connected = true; }
      catch (_) { await new Promise(resolve => setTimeout(resolve, 250)); }
    }
    if (!connected) throw new Error(`isolated MongoDB did not start; inspect ${path.join(root, 'mongod.log')}`);
    const options = await mongoose.connection.db.admin().command({ getCmdLineOpts: 1 });
    assert.equal(path.resolve(options.parsed.storage.dbPath), path.resolve(dbPath), 'refuse unexpected MongoDB data directory');
    assert.equal(options.parsed.net.port, port, 'refuse unexpected MongoDB port');
    assert.equal(options.parsed.net.bindIp, '127.0.0.1', 'refuse non-loopback MongoDB');
    ownedMongo = true;
    assert.equal(mongoose.connection.name, 'isolated_meal_wish');
    assert.equal((await mongoose.connection.db.listCollections().toArray()).length, 0, 'refuse a non-empty database');
    await Schedule.collection.createIndex({ householdId: 1, date: 1 }, { unique: true });
    await ShoppingList.collection.createIndex({ householdId: 1, weekStart: 1 }, { unique: true });
    await Household.collection.createIndex({ inviteCode: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });

    const [homeA, homeB] = await Household.create([{ name: 'Test A', inviteCode: 'LOCAL-A' }, { name: 'Test B', inviteCode: 'LOCAL-B' }]);
    const hash = await bcrypt.hash('test-only-password', 4);
    const [userA, partnerA, userB] = await User.create([
      { username: 'test-local-a', passwordHash: hash, householdId: homeA._id },
      { username: 'test-local-partner', passwordHash: hash, householdId: homeA._id },
      { username: 'test-local-b', passwordHash: hash, householdId: homeB._id }
    ]);
    const [mealA, mealB, otherMeal] = await Meal.create([
      { householdId: homeA._id, name: 'Test A meal' },
      { householdId: homeA._id, name: 'Test duplicate audit meal' },
      { householdId: homeB._id, name: 'Test A meal' }
    ]);
    const duplicates = await WishlistItem.create([
      { householdId: homeA._id, mealId: mealB._id, title: 'duplicate 1', status: 'open', createdBy: userA._id },
      { householdId: homeA._id, mealId: mealB._id, title: 'duplicate 2', status: 'open', createdBy: userA._id }
    ]);
    const invalid = await WishlistItem.collection.insertOne({ householdId: homeA._id, mealId: String(mealB._id), title: 'invalid fixture', status: 'open', createdBy: userA._id });
    const invalidHome = await WishlistItem.collection.insertOne({ householdId: 'invalid', mealId: mealB._id, title: 'invalid household fixture', status: 'open', createdBy: userA._id });
    const collection = WishlistItem.collection;
    const audit = await auditAndApply(collection, { database: mongoose.connection.name, apply: false });
    assert.equal(audit.duplicateGroups, 1);
    assert.equal(audit.invalidMealRefs, 1);
    assert.equal(audit.invalidHouseholds, 1);
    await assert.rejects(auditAndApply(collection, { database: mongoose.connection.name, apply: true }));
    assert.equal((await auditAndApply(collection, { database: mongoose.connection.name, apply: false })).safeIndexExists, false);

    const app = express();
    app.use(express.json());
    app.post('/auth/login', authController.login);
    app.post('/auth/register', authController.register);
    app.use(requireAuth());
    app.get('/auth/me', authController.me);
    app.get('/household/me', householdController.me);
    app.post('/household/invite/refresh', householdController.refreshInvite);
    app.post('/household/join', householdController.join);
    app.get('/meals', mealController.getAllMeals);
    app.get('/meals/categories', mealController.getMealCategories);
    app.get('/meals/tags', mealController.getMealTags);
    app.get('/meals/:id', mealController.getMealById);
    app.get('/schedules', scheduleController.validateSchedulesQuery, scheduleController.getSchedules);
    app.get('/schedules/day/:date', scheduleController.validateScheduleDate, scheduleController.getScheduleByDate);
    app.put('/schedules/:date/:mealType', scheduleController.validateScheduleUpdate, scheduleController.updateSchedule);
    app.get('/weekly-plans', weeklyPlanController.list);
    app.post('/weekly-plans/generate', weeklyPlanController.generate);
    app.post('/weekly-plans/apply', weeklyPlanController.apply);
    app.get('/shopping-list', shoppingController.get);
    app.post('/shopping-list/generate', shoppingController.generate);
    app.post('/shopping-list/items', shoppingController.addItem);
    app.patch('/shopping-list/items/:id', shoppingController.updateItem);
    app.delete('/shopping-list/items/:id', shoppingController.deleteItem);
    app.delete('/shopping-list/purchased', shoppingController.clearPurchased);
    app.get('/dashboard/summary', dashboardController.summary);
    app.get('/photo-album', photoAlbumController.month);
    app.get('/memories', memoryController.list);
    app.get('/memories/:id', memoryController.get);
    app.post('/memories', multer().array('photos', 12), memoryController.create);
    app.put('/memories/:id', multer().array('photos', 12), memoryController.update);
    app.delete('/memories/:id', memoryController.remove);
    app.get('/anniversaries', anniversaryController.list);
    app.get('/anniversary-templates', anniversaryTemplateController.list);
    app.post('/anniversaries', multer().array('photos', 12), anniversaryController.create);
    app.put('/anniversaries/:id', multer().array('photos', 12), anniversaryController.update);
    app.delete('/anniversaries/:id', anniversaryController.remove);
    app.get('/wishlist', wishlist.list);
    app.get('/wishlist/:id', wishlist.get);
    let legacyCalls = 0;
    let atomicCalls = 0;
    app.post('/wishlist', (req, res, next) => { legacyCalls++; next(); }, wishlist.create);
    app.post('/wishlist/meal', (req, res, next) => { atomicCalls++; next(); }, wishlist.createMealWish);
    app.post('/wishlist/:id/vote', wishlist.vote);
    app.put('/wishlist/:id/vote', wishlist.setVote);
    app.patch('/wishlist/:id/status', wishlist.updateStatus);
    app.patch('/wishlist/:id/meal', wishlist.attachMeal);
    app.delete('/wishlist/:id', wishlist.remove);
    app.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(url, { method = 'GET', body, token } = {}) {
      const result = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: result.status, data: result.status === 204 ? null : await result.json() };
    }
    async function login(username) {
      const result = await request('/auth/login', { method: 'POST', body: { username, password: 'test-only-password' } });
      assert.equal(result.status, 200);
      return result.data.token;
    }
    const [tokenA, tokenPartner, tokenB] = await Promise.all(['test-local-a', 'test-local-partner', 'test-local-b'].map(login));
    assert.equal((await request('/household/join', { method: 'POST', token: tokenA })).status, 400, 'a missing invitation is a validation error');
    await Household.updateOne({ _id: homeA._id }, { $addToSet: { members: userB._id } });
    const homeAProfile = await request('/auth/me', { token: tokenA });
    assert.equal(homeAProfile.status, 200);
    assert.ok(homeAProfile.data.household.members.some(member => String(member._id) === String(partnerA._id)));
    assert.equal(homeAProfile.data.household.members.some(member => String(member._id) === String(userB._id)), false, 'stale member arrays must not disclose another household member');
    assert.ok(homeAProfile.data.household.members.every(member => !('passwordHash' in member)));
    const oldInviteB = homeB.inviteCode;
    const refreshedB = await request('/household/invite/refresh', { method: 'POST', token: tokenB, body: {} });
    assert.equal(refreshedB.status, 200);
    const newInviteB = refreshedB.data.household.inviteCode;
    assert.notEqual(newInviteB, oldInviteB);
    assert.match(newInviteB, /^[0-9A-F]{20}$/, 'new invitation codes have 80 random bits');
    const invalidRegistration = await request('/auth/register', { method: 'POST', body: { username: 'local-invalid-invite', password: 'test-only-password', inviteCode: oldInviteB } });
    assert.equal(invalidRegistration.status, 404, 'a rotated link must no longer register into the household');
    assert.equal(await User.countDocuments({ username: 'local-invalid-invite' }), 0);
    const invitedRegistration = await request('/auth/register', { method: 'POST', body: { username: 'local-invited-b', password: 'test-only-password', inviteCode: newInviteB } });
    assert.equal(invitedRegistration.status, 201);
    assert.equal(String(invitedRegistration.data.household.id), String(homeB._id));
    assert.ok(invitedRegistration.data.household.members.some(member => String(member._id) === String(invitedRegistration.data.user.id)), 'registration returns the joined member immediately');
    const invitedToken = await login('local-invited-b');
    const invitedMeals = await request('/meals', { token: invitedToken });
    assert.equal(invitedMeals.data.length, 1);
    assert.equal(String(invitedMeals.data[0]._id), String(otherMeal._id));
    const homeC = await Household.create({ name: 'Test C', inviteCode: 'LOCAL-C' });
    const homeCMeal = await Meal.create({ householdId: homeC._id, name: 'Test C meal' });
    const switchUser = await User.create({ username: 'test-local-switch', passwordHash: hash, householdId: homeA._id });
    const switchToken = await login('test-local-switch');
    const originalFindById = User.findById;
    let arrived = 0;
    let releaseJoinReads;
    const joinBarrier = new Promise(resolve => { releaseJoinReads = resolve; });
    const joinBarrierTimeout = setTimeout(releaseJoinReads, 5000);
    User.findById = function (id, ...args) {
      const query = originalFindById.call(this, id, ...args);
      if (String(id) !== String(switchUser._id) || arrived >= 2) return query;
      return (async () => { const doc = await query; if (++arrived === 2) releaseJoinReads(); await joinBarrier; return doc; })();
    };
    let switches;
    try {
      switches = await Promise.all([newInviteB, homeC.inviteCode].map(inviteCode => request('/household/join', { method: 'POST', token: switchToken, body: { inviteCode } })));
    } finally { clearTimeout(joinBarrierTimeout); User.findById = originalFindById; }
    assert.equal(arrived, 2, 'both switches must start from the same membership snapshot');
    assert.deepEqual(switches.map(result => result.status).sort(), [200, 409], 'competing switches from one starting household cannot both commit');
    const winningSwitch = switches.find(result => result.status === 200).data;
    assert.ok(winningSwitch.household.members.some(member => String(member._id) === String(switchUser._id)), 'successful join returns the new member');
    const switchProfile = await request('/auth/me', { token: switchToken });
    assert.equal(String(switchProfile.data.household.id), String(winningSwitch.household.id));
    const switchedMeals = await request('/meals', { token: switchToken });
    assert.equal(switchedMeals.data.length, 1);
    const expectedMeal = String(winningSwitch.household.id) === String(homeB._id) ? otherMeal : homeCMeal;
    assert.equal(String(switchedMeals.data[0]._id), String(expectedMeal._id), 'an old token still resolves only the current household');
    const oldHomeAfterSwitch = await request('/auth/me', { token: tokenA });
    assert.equal(oldHomeAfterSwitch.data.household.members.some(member => String(member._id) === String(switchUser._id)), false);
    assert.equal((await request('/weekly-plans?weekStart=2026-02-31', { token: tokenA })).status, 400);
    assert.equal((await request('/weekly-plans/generate', { method: 'POST', token: tokenA, body: { weekStart: 'not-a-date' } })).status, 400);
    const futureDraft = await request('/weekly-plans/generate', { method: 'POST', token: tokenA, body: { weekStart: '2026-11-19' } });
    assert.equal(futureDraft.status, 200);
    assert.equal(futureDraft.data.weekStart, '2026-11-16');
    assert.deepEqual(futureDraft.data.days.map(day => day.date), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    for (let index = 0; index < 7; index++) for (const type of ['breakfast', 'lunch', 'dinner']) {
      assert.deepEqual(futureDraft.data.preview[index].meals[type].map(meal => String(meal._id)), futureDraft.data.days[index].meals[type]);
    }
    const foreignDraft = futureDraft.data.days.map((day, index) => index ? day : { ...day, meals: { ...day.meals, dinner: [String(otherMeal._id)] } });
    const invalidDraft = await request('/weekly-plans/apply', { method: 'POST', token: tokenA, body: { days: foreignDraft, expectedVersions: Object.fromEntries(foreignDraft.map(day => [day.date, null])) } });
    assert.equal(invalidDraft.status, 400);
    assert.equal(invalidDraft.data.code, 'WEEKLY_PLAN_INVALID');
    assert.deepEqual(invalidDraft.data.appliedDates, []);
    assert.equal(await Schedule.countDocuments({ householdId: homeA._id, date: { $in: foreignDraft.map(day => day.date) } }), 0, 'invalid plans never write a partial week');
    const shoppingWeek = '2026-11-09';
    await ShoppingList.collection.dropIndex('householdId_1_weekStart_1');
    const unsafeShopping = await request(`/shopping-list?weekStart=${shoppingWeek}`, { token: tokenA });
    assert.equal(unsafeShopping.status, 503);
    assert.equal(unsafeShopping.data.code, 'SHOPPING_LIST_INDEX_UNAVAILABLE');
    assert.equal(await ShoppingList.countDocuments({ householdId: homeA._id, weekStart: shoppingWeek }), 0, 'no list is created without a safe unique index');
    const indexFixtures = await ShoppingList.collection.insertMany([
      { householdId: homeA._id, weekStart: '2026-12-07' },
      { householdId: homeA._id, weekStart: '2026-12-07' },
      { householdId: 'invalid', weekStart: '2026-12-08' },
      { householdId: homeA._id, weekStart: '2026-13-01' }
    ]);
    const shoppingAudit = await auditShoppingIndex(ShoppingList.collection, { database: mongoose.connection.name, apply: false });
    assert.equal(shoppingAudit.duplicateGroups, 1);
    assert.equal(shoppingAudit.invalidHouseholds, 1);
    assert.equal(shoppingAudit.invalidWeekStarts, 2);
    await assert.rejects(auditShoppingIndex(ShoppingList.collection, { database: mongoose.connection.name, apply: true }));
    await ShoppingList.collection.updateOne({ _id: indexFixtures.insertedIds[1] }, { $set: { weekStart: '2026-12-14' } });
    await ShoppingList.collection.updateOne({ _id: indexFixtures.insertedIds[2] }, { $set: { householdId: homeB._id, weekStart: '2026-12-21' } });
    await ShoppingList.collection.updateOne({ _id: indexFixtures.insertedIds[3] }, { $set: { weekStart: '2026-12-28' } });
    assert.equal((await auditShoppingIndex(ShoppingList.collection, { database: mongoose.connection.name, apply: true })).created, true);
    const oldUnversioned = await request('/shopping-list?weekStart=2026-12-07', { token: tokenA });
    assert.equal(oldUnversioned.data.listVersion, null, 'an old unversioned list must not be advertised as safely writable');
    const oldEdit = await request('/shopping-list/items', { method: 'POST', token: tokenA, body: { weekStart: '2026-12-07', expectedVersion: 0, name: '不可覆盖' } });
    assert.equal(oldEdit.status, 409);
    assert.equal(oldEdit.data.code, 'SHOPPING_LIST_VERSION_UNAVAILABLE');
    const oldLegacyEdit = await request('/shopping-list/items', { method: 'POST', token: tokenPartner, body: { weekStart: '2026-12-07', name: '旧客户端不可覆盖' } });
    assert.equal(oldLegacyEdit.status, 409);
    assert.equal(oldLegacyEdit.data.code, 'SHOPPING_LIST_VERSION_UNAVAILABLE');
    const initialLists = await Promise.all([tokenA, tokenPartner].map(token => request(`/shopping-list?weekStart=${shoppingWeek}`, { token })));
    assert.ok(initialLists.every(result => result.status === 200 && result.data.supportsConditionalUpdates && result.data.listVersion === 0));
    assert.equal(await ShoppingList.countDocuments({ householdId: homeA._id, weekStart: shoppingWeek }), 1, 'concurrent reads create only one list');
    assert.equal((await request('/shopping-list?weekStart=2026-02-31', { token: tokenA })).status, 400);
    const firstShopping = await request('/shopping-list/items', { method: 'POST', token: tokenA, body: { weekStart: shoppingWeek, expectedVersion: 0, name: '鸡蛋', amount: '2个' } });
    assert.equal(firstShopping.status, 201);
    assert.equal(firstShopping.data.listVersion, 1);
    const staleShopping = await request('/shopping-list/items', { method: 'POST', token: tokenPartner, body: { weekStart: shoppingWeek, expectedVersion: 0, name: '牛奶' } });
    assert.equal(staleShopping.status, 409);
    assert.equal(staleShopping.data.code, 'SHOPPING_LIST_CONFLICT');
    const concurrentShopping = await Promise.all([tokenA, tokenPartner].map((token, index) => request('/shopping-list/items', { method: 'POST', token, body: { weekStart: shoppingWeek, expectedVersion: 1, name: `并发食材${index}` } })));
    assert.deepEqual(concurrentShopping.map(result => result.status).sort(), [201, 409], 'only one concurrent edit from a shared version may commit');
    const afterShopping = await request(`/shopping-list?weekStart=${shoppingWeek}`, { token: tokenA });
    assert.equal(afterShopping.data.items.length, 2);
    const egg = afterShopping.data.items.find(item => item.name === '鸡蛋');
    const toggles = await Promise.all([tokenA, tokenPartner].map(token => request(`/shopping-list/items/${egg._id}`, { method: 'PATCH', token, body: { weekStart: shoppingWeek, expectedVersion: afterShopping.data.listVersion, checked: true } })));
    assert.deepEqual(toggles.map(result => result.status).sort(), [200, 409]);
    const updatedShopping = toggles.find(result => result.status === 200).data;
    const staleClear = await request(`/shopping-list/purchased?weekStart=${shoppingWeek}&expectedVersion=${afterShopping.data.listVersion}`, { method: 'DELETE', token: tokenPartner });
    assert.equal(staleClear.status, 409);
    const otherShopping = await request(`/shopping-list?weekStart=${shoppingWeek}`, { token: tokenB });
    assert.equal(otherShopping.data.items.length, 0, 'shopping lists remain isolated by household');
    const shoppingMeal = await Meal.create({ householdId: homeA._id, name: '购物清单测试菜', ingredients: [{ name: '番茄', amount: '1个' }] });
    await Schedule.create({ householdId: homeA._id, date: shoppingWeek, meals: { dinner: [{ meal: shoppingMeal._id, addedBy: userA._id }] } });
    await Schedule.create({ householdId: homeA._id, date: '2026-11-10', meals: { lunch: [{ meal: shoppingMeal._id, addedBy: partnerA._id }] } });
    const generatedShopping = await request('/shopping-list/generate', { method: 'POST', token: tokenPartner, body: { weekStart: shoppingWeek, expectedVersion: updatedShopping.listVersion } });
    assert.equal(generatedShopping.status, 200);
    assert.ok(generatedShopping.data.items.some(item => item.name === '番茄' && !item.manual));
    assert.equal(generatedShopping.data.items.find(item => item.name === '番茄').amount, '1个 + 1个', 'equal ingredient amounts from different meals must not disappear');
    assert.ok(generatedShopping.data.items.some(item => item.name === '鸡蛋' && item.checked && item.manual));
    const deletedShopping = await request(`/shopping-list/items/${egg._id}?weekStart=${shoppingWeek}&expectedVersion=${generatedShopping.data.listVersion}`, { method: 'DELETE', token: tokenA });
    assert.equal(deletedShopping.status, 200);
    assert.equal(deletedShopping.data.items.some(item => item.name === '鸡蛋'), false);
    const legacyShopping = await Promise.all(Array.from({ length: 8 }, (_, index) => request('/shopping-list/items', {
      method: 'POST', token: index % 2 ? tokenA : tokenPartner, body: { weekStart: shoppingWeek, name: `旧版并发${index}` }
    })));
    assert.ok(legacyShopping.every(result => result.status === 201 || result.status === 409), 'legacy concurrent writes either succeed or conflict');
    const afterLegacyShopping = await request(`/shopping-list?weekStart=${shoppingWeek}`, { token: tokenA });
    const successfulLegacyNames = legacyShopping.flatMap((result, index) => result.status === 201 ? [`旧版并发${index}`] : []);
    assert.ok(successfulLegacyNames.length > 0);
    assert.ok(successfulLegacyNames.every(name => afterLegacyShopping.data.items.some(item => item.name === name)), 'no acknowledged legacy write is lost');
    assert.equal((await request('/wishlist?includeCapabilities=true', { token: tokenA })).data.supportsAtomicMealWish, false);
    assert.equal((await request('/wishlist/meal', { method: 'POST', token: tokenA, body: { mealId: String(mealA._id) } })).status, 503);

    // Change only the synthetic fixtures inside this verified isolated DB.
    await collection.updateMany({ _id: { $in: duplicates.map(item => item._id) } }, { $set: { status: 'done' } });
    await assert.rejects(auditAndApply(collection, { database: mongoose.connection.name, apply: true }), /Invalid open meal or household/);
    await collection.updateOne({ _id: invalid.insertedId }, { $set: { status: 'done' } });
    await assert.rejects(auditAndApply(collection, { database: mongoose.connection.name, apply: true }), /Invalid open meal or household/);
    await collection.updateOne({ _id: invalidHome.insertedId }, { $set: { status: 'done' } });
    const applied = await auditAndApply(collection, { database: mongoose.connection.name, apply: true });
    assert.equal(applied.created, true);
    assert.equal((await request('/wishlist?includeCapabilities=true', { token: tokenA })).data.supportsAtomicMealWish, true);
    const concurrent = await Promise.all(Array.from({ length: 16 }, (_, i) => request('/wishlist/meal', { method: 'POST', token: i % 2 ? tokenA : tokenPartner, body: { mealId: String(mealA._id) } })));
    assert.equal(concurrent.filter(result => result.status === 201).length, 1);
    assert.equal(concurrent.filter(result => result.status === 200 && result.data.alreadyExists).length, 15);
    const ids = new Set(concurrent.map(result => String(result.data.item._id)));
    assert.equal(ids.size, 1);
    assert.equal(await WishlistItem.countDocuments({ householdId: homeA._id, mealId: mealA._id, status: 'open' }), 1);
    assert.equal((await request('/wishlist/meal', { method: 'POST', token: tokenB, body: { mealId: String(mealA._id) } })).status, 404);
    assert.equal((await request('/wishlist/meal', { method: 'POST', token: tokenB, body: { mealId: String(otherMeal._id) } })).status, 201);
    assert.equal((await request('/wishlist', { method: 'POST', token: tokenA, body: { title: 'duplicate', mealId: String(mealA._id) } })).status, 409);
    const planned = await WishlistItem.create({ householdId: homeA._id, mealId: mealA._id, title: 'planned fixture', status: 'planned', createdBy: userA._id });
    assert.equal((await request(`/wishlist/${planned._id}/status`, { method: 'PATCH', token: tokenA, body: { status: 'open' } })).status, 409);
    assert.equal((await WishlistItem.findById(planned._id)).status, 'planned');
    const unlinked = await WishlistItem.create({ householdId: homeA._id, title: 'unlinked fixture', status: 'open', createdBy: userA._id });
    assert.equal((await request(`/wishlist/${unlinked._id}/meal`, { method: 'PATCH', token: tokenA, body: { mealId: String(mealA._id), onlyIfUnlinked: true } })).status, 409);
    assert.equal((await WishlistItem.findById(unlinked._id)).mealId, null);
    const firstId = [...ids][0];
    assert.equal((await request(`/wishlist/${firstId}/status`, { method: 'PATCH', token: tokenA, body: { status: 'done' } })).status, 200);
    assert.equal((await request('/wishlist/meal', { method: 'POST', token: tokenA, body: { mealId: String(mealA._id) } })).status, 201);
    assert.equal(await WishlistItem.countDocuments({ householdId: homeA._id, mealId: mealA._id, status: 'open' }), 1);
    const familyB = await request('/wishlist?status=open&includeCapabilities=true', { token: tokenB });
    assert.equal(familyB.data.items.length, 1);
    assert.equal(String(familyB.data.items[0].mealId._id), String(otherMeal._id));
    await WishlistItem.create([
      { householdId: homeA._id, title: 'self only', status: 'open', priority: 'high', votes: [userA._id], createdBy: userA._id },
      { householdId: homeA._id, title: 'partner high', status: 'open', priority: 'high', votes: [partnerA._id], createdBy: partnerA._id },
      { householdId: homeA._id, title: 'partner vote on mine', status: 'open', priority: 'high', votes: [userA._id, partnerA._id], createdBy: userA._id },
      { householdId: homeA._id, title: 'partner normal', status: 'open', priority: 'normal', votes: [partnerA._id], createdBy: partnerA._id },
      { householdId: homeA._id, title: 'partner low newest', status: 'open', priority: 'low', votes: [partnerA._id], createdBy: partnerA._id }
    ]);
    await collection.insertOne({ householdId: homeA._id, title: 'null votes only', status: 'open', priority: 'high', votes: [userA._id, null], createdBy: userA._id, createdAt: new Date() });
    await collection.insertOne({ householdId: homeA._id, title: 'missing creator only', status: 'open', priority: 'high', votes: [userA._id], createdBy: null, createdAt: new Date() });
    await collection.insertOne({ householdId: homeA._id, title: 'foreign vote only', status: 'open', priority: 'high', votes: [userA._id, userB._id], createdBy: userA._id, createdAt: new Date() });
    await collection.insertOne({ householdId: homeA._id, title: 'former member creator', status: 'open', priority: 'high', votes: [userB._id], createdBy: userB._id, createdAt: new Date() });
    const dashboard = await request('/dashboard/summary', { token: tokenA });
    assert.equal(dashboard.status, 200);
    const reminders = dashboard.data.partnerWishlist.map(item => item.title);
    assert.equal(reminders.includes('self only'), false, 'own vote must not appear as a partner signal');
    assert.equal(reminders.includes('null votes only'), false, 'null votes are not partner signals');
    assert.equal(reminders.includes('missing creator only'), false, 'a missing creator is not a partner');
    assert.equal(reminders.includes('foreign vote only'), false, 'a different household member is not a partner');
    assert.equal(reminders.includes('former member creator'), false, 'a former member is not a current household member');
    assert.ok(reminders.includes('partner high') && reminders.includes('partner vote on mine') && reminders.includes('partner normal') && reminders.includes('partner low newest'));
    const voteWish = await WishlistItem.create({ householdId: homeA._id, title: '并发投票测试', status: 'done', votes: [], createdBy: userA._id });
    const voteResults = await Promise.all(Array.from({ length: 20 }, (_, index) => request(`/wishlist/${voteWish._id}/vote`, { method: 'PUT', token: index % 2 ? tokenA : tokenPartner, body: { voted: true } })));
    assert.ok(voteResults.every(result => result.status === 200));
    let storedVotes = (await WishlistItem.findById(voteWish._id)).votes.map(String).sort();
    assert.deepEqual(storedVotes, [String(userA._id), String(partnerA._id)].sort(), 'idempotent votes from different users must not overwrite each other');
    assert.equal((await request(`/wishlist/${voteWish._id}/vote`, { method: 'PUT', token: tokenA, body: { voted: false } })).status, 200);
    assert.equal((await request(`/wishlist/${voteWish._id}/vote`, { method: 'PUT', token: tokenA, body: { voted: false } })).status, 200);
    const legacyToggles = await Promise.all([request(`/wishlist/${voteWish._id}/vote`, { method: 'POST', token: tokenA, body: {} }), request(`/wishlist/${voteWish._id}/vote`, { method: 'POST', token: tokenPartner, body: {} })]);
    assert.ok(legacyToggles.every(result => result.status === 200));
    storedVotes = (await WishlistItem.findById(voteWish._id)).votes.map(String);
    assert.deepEqual(storedVotes, [String(userA._id)], 'legacy toggles must preserve concurrent members\u2019 votes');
    assert.equal((await request(`/wishlist/${voteWish._id}/vote`, { method: 'PUT', token: tokenA, body: { voted: 'true' } })).status, 400);
    assert.equal((await request(`/wishlist/${voteWish._id}/vote`, { method: 'PUT', token: tokenB, body: { voted: true } })).status, 404);
    const foreignWish = await WishlistItem.create({ householdId: homeA._id, title: '跨家庭引用测试', status: 'done', mealId: otherMeal._id, votes: [userA._id, userB._id], createdBy: userB._id });
    const safeWishlist = await request('/wishlist', { token: tokenA });
    const safeVoteWish = safeWishlist.data.find(item => item._id === String(voteWish._id));
    const safeForeignWish = safeWishlist.data.find(item => item._id === String(foreignWish._id));
    assert.equal(safeVoteWish.supportsSetVote, true);
    assert.equal(safeVoteWish.votedByMe, true);
    assert.equal(safeForeignWish.mealId, null);
    assert.equal(safeForeignWish.createdBy, null);
    assert.deepEqual(safeForeignWish.votes.map(user => user._id), [String(userA._id)]);
    const versionWish = await WishlistItem.create({ householdId: homeA._id, title: '并发状态测试', status: 'done', votes: [], createdBy: userA._id });
    const detailWish = await request(`/wishlist/${versionWish._id}`, { token: tokenA });
    assert.equal(detailWish.data.supportsConditionalActions, true);
    assert.equal((await request(`/wishlist/${versionWish._id}`, { token: tokenB })).data.code, 'WISH_NOT_FOUND');
    const wishVersion = detailWish.data.editVersion;
    const competingStatuses = await Promise.all(['planned', 'open'].map(status => request(`/wishlist/${versionWish._id}/status`, { method: 'PATCH', token: tokenA, body: { status, expectedEditVersion: wishVersion } })));
    assert.deepEqual(competingStatuses.map(result => result.status).sort(), [200, 409]);
    assert.equal(competingStatuses.find(result => result.status === 409).data.code, 'WISH_CONFLICT');
    const acceptedWish = competingStatuses.find(result => result.status === 200).data;
    assert.notEqual(acceptedWish.editVersion.revision, wishVersion.revision);
    assert.equal((await request(`/wishlist/${versionWish._id}`, { method: 'DELETE', token: tokenA, body: undefined })).status, 204, 'legacy deletion remains available');
    const deleteWish = await WishlistItem.create({ householdId: homeA._id, title: '并发删除测试', status: 'done', votes: [], createdBy: userA._id });
    const beforeDelete = (await request(`/wishlist/${deleteWish._id}`, { token: tokenA })).data.editVersion;
    assert.equal((await request(`/wishlist/${deleteWish._id}/vote`, { method: 'PUT', token: tokenPartner, body: { voted: true } })).status, 200);
    assert.equal((await request(`/wishlist/${deleteWish._id}?expectedEditVersion=${encodeURIComponent(JSON.stringify(beforeDelete))}`, { method: 'DELETE', token: tokenA })).data.code, 'WISH_CONFLICT');
    assert.ok(await WishlistItem.exists({ _id: deleteWish._id }), 'stale delete must preserve the item');
    const freshDelete = (await request(`/wishlist/${deleteWish._id}`, { token: tokenA })).data.editVersion;
    assert.equal((await request(`/wishlist/${deleteWish._id}?expectedEditVersion=${encodeURIComponent(JSON.stringify(freshDelete))}`, { method: 'DELETE', token: tokenA })).status, 204);
    const legacyWish = await WishlistItem.collection.insertOne({ householdId: homeA._id, title: '旧想吃记录', status: 'done', priority: 'normal', votes: [], createdBy: userA._id });
    const legacyWishItem = (await request(`/wishlist/${legacyWish.insertedId}`, { token: tokenA })).data;
    assert.deepEqual(legacyWishItem.editVersion, { revision: null, updatedAt: null });
    assert.equal((await request(`/wishlist/${legacyWish.insertedId}/status`, { method: 'PATCH', token: tokenA, body: { status: 'planned', expectedEditVersion: legacyWishItem.editVersion } })).status, 200);
    assert.equal((await request(`/wishlist/${legacyWish.insertedId}/status`, { method: 'PATCH', token: tokenA, body: { status: 'done', expectedEditVersion: 'bad-json' } })).status, 400);
    assert.ok(reminders.indexOf('partner high') < reminders.indexOf('partner normal'));
    assert.ok(reminders.indexOf('partner normal') < reminders.indexOf('partner low newest'), 'priority must not be sorted alphabetically');
    assert.equal(reminders.includes('Test A meal'), false, 'another household must remain isolated');
    const imageData = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2280%22%3E%3Crect width=%22100%22 height=%2280%22 fill=%22%23d49a75%22/%3E%3C/svg%3E';
    await MealMemory.create({ householdId: homeA._id, createdBy: userA._id, date: '2026-10-28', mealType: 'dinner', title: '甲家庭相册', photos: Array.from({ length: 26 }, (_, index) => `${imageData}#${index}`), mealIds: [mealA._id, otherMeal._id], participants: [userA._id, userB._id] });
    await MealMemory.create({ householdId: homeB._id, createdBy: userB._id, date: '2026-10-28', mealType: 'lunch', title: '乙家庭私密照片', photos: [imageData], mealIds: [otherMeal._id] });
    const firstPhotoPage = await request('/photo-album?month=2026-10&page=1&limit=24', { token: tokenA });
    assert.equal(firstPhotoPage.status, 200);
    assert.equal(firstPhotoPage.data.total, 26);
    assert.equal(firstPhotoPage.data.photos.length, 24);
    assert.ok(firstPhotoPage.data.photos.every(item => item.meals.length === 1 && String(item.meals[0]._id) === String(mealA._id)), 'foreign meal references must not leak into the album');
    const secondPhotoPage = await request('/photo-album?month=2026-10&page=2&limit=24', { token: tokenA });
    assert.equal(secondPhotoPage.data.photos.length, 2);
    assert.deepEqual(secondPhotoPage.data.photos.map(item => item.photoIndex), [24, 25]);
    assert.equal((await request('/photo-album?month=2026-10', { token: tokenA })).data.photos.length, 26, 'legacy unpaginated reads remain available');
    assert.equal((await request('/photo-album?month=2026-10&page=1&limit=24', { token: tokenB })).data.total, 1);
    assert.equal((await request('/photo-album?month=2026-13', { token: tokenA })).status, 400);
    assert.equal((await request('/photo-album?month=2026-10&page=0', { token: tokenA })).status, 400);
    const memoryListA = await request('/memories?month=2026-10', { token: tokenA });
    assert.equal(memoryListA.status, 200);
    assert.equal(memoryListA.data.length, 1);
    assert.deepEqual(memoryListA.data[0].mealIds.map(item => String(item._id)), [String(mealA._id)]);
    assert.deepEqual(memoryListA.data[0].participants.map(item => String(item._id)), [String(userA._id)], 'foreign references must not expose another household');
    assert.equal((await request('/memories?month=.*', { token: tokenA })).status, 400);
    const memoryCount = await MealMemory.countDocuments({ householdId: homeA._id });
    const invalidMemory = await request('/memories', { method: 'POST', token: tokenA, body: { date: '2026-11-11', mealIds: [String(otherMeal._id)], participants: [String(userA._id)] } });
    assert.equal(invalidMemory.status, 400);
    assert.equal(await MealMemory.countDocuments({ householdId: homeA._id }), memoryCount);
    assert.equal((await request('/memories', { method: 'POST', token: tokenA, body: { date: '2026-02-31', mealIds: [] } })).status, 400);
    assert.equal((await request('/memories', { method: 'POST', token: tokenA, body: { date: '2026-11-11', participants: [String(userB._id)] } })).status, 400);
    const validMemory = await request('/memories', { method: 'POST', token: tokenA, body: { date: '2026-11-11', title: '原始回忆', mealIds: [String(mealA._id)], participants: [String(userA._id)], existingPhotos: [imageData] } });
    assert.equal(validMemory.status, 201);
    const memoryId = validMemory.data._id;
    const partialMemory = await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { title: '只修改标题' } });
    assert.equal(partialMemory.status, 200);
    assert.equal(partialMemory.data.title, '只修改标题');
    assert.equal(partialMemory.data.photos.length, 1, 'partial updates must not silently remove photos');
    assert.equal(partialMemory.data.mealIds.length, 1, 'partial updates must not silently remove linked meals');
    assert.equal(partialMemory.data.participants.length, 1);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { mealIds: [String(otherMeal._id)] } })).status, 400);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { existingPhotos: 'invalid-json' } })).status, 400);
    assert.equal((await MealMemory.findById(memoryId)).photos.length, 1);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenB, body: { title: '越权修改' } })).status, 404);
    const memoryDetail = await request(`/memories/${memoryId}`, { token: tokenA });
    assert.equal(memoryDetail.status, 200);
    assert.equal(memoryDetail.data.supportsConditionalEdit, true);
    assert.equal((await request(`/memories/${memoryId}`, { token: tokenB })).data.code, 'MEMORY_NOT_FOUND');
    const initialMemoryVersion = memoryDetail.data.editVersion;
    const memoryEdits = await Promise.all(['并发回忆甲', '并发回忆乙'].map(title => request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { title, expectedEditVersion: initialMemoryVersion } })));
    assert.deepEqual(memoryEdits.map(result => result.status).sort(), [200, 409]);
    assert.equal(memoryEdits.find(result => result.status === 409).data.code, 'MEMORY_CONFLICT');
    assert.equal((await MealMemory.findById(memoryId)).photos.length, 1);
    const updatedMemory = memoryEdits.find(result => result.status === 200).data;
    assert.notEqual(updatedMemory.editVersion.revision, initialMemoryVersion.revision);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { title: '旧客户端回忆修改' } })).status, 200);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { title: '不能覆盖', expectedEditVersion: updatedMemory.editVersion } })).status, 409);
    assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { expectedEditVersion: 'bad-json' } })).status, 400);
    const legacyMemory = await MealMemory.collection.insertOne({ householdId: homeA._id, createdBy: userA._id, title: '旧回忆数据', date: '2026-11-12', mealType: 'dinner', photos: [], mealIds: [], participants: [] });
    const legacyMemoryDetail = await request(`/memories/${legacyMemory.insertedId}`, { token: tokenA });
    assert.deepEqual(legacyMemoryDetail.data.editVersion, { revision: null, updatedAt: null });
    assert.equal((await request(`/memories/${legacyMemory.insertedId}`, { method: 'PUT', token: tokenA, body: { title: '旧回忆已编辑', expectedEditVersion: legacyMemoryDetail.data.editVersion } })).status, 200);
    const anniversary = await AnniversaryMenu.create({ householdId: homeA._id, createdBy: userA._id, title: '测试纪念日', date: '2026-11-11', photos: [imageData], meals: { breakfast: [mealA._id], lunch: [otherMeal._id], dinner: [mealA._id, otherMeal._id] } });
    const anniversaryList = await request('/anniversaries', { token: tokenA });
    assert.equal(anniversaryList.status, 200);
    assert.deepEqual(anniversaryList.data[0].meals.lunch, []);
    assert.deepEqual(anniversaryList.data[0].meals.dinner.map(item => String(item._id)), [String(mealA._id)], 'foreign meal references must not be exposed');
    assert.equal((await request('/anniversaries', { method: 'POST', token: tokenA, body: { title: '无效日期', date: '2026-02-30' } })).status, 400);
    assert.equal((await request('/anniversaries', { method: 'POST', token: tokenA, body: { title: '跨家庭', date: '2026-11-11', meals: { dinner: [String(otherMeal._id)] } } })).status, 400);
    const createdAnniversary = await request('/anniversaries', { method: 'POST', token: tokenA, body: { title: '可重复菜品', date: '2026-11-12', meals: { breakfast: [String(mealA._id)], dinner: [String(mealA._id)] } } });
    assert.equal(createdAnniversary.status, 201);
    assert.equal(createdAnniversary.data.meals.breakfast.length, 1);
    assert.equal(createdAnniversary.data.meals.dinner.length, 1);
    const partialAnniversary = await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { title: '只修改标题' } });
    assert.equal(partialAnniversary.status, 200);
    assert.equal(partialAnniversary.data.photos.length, 1);
    assert.equal(partialAnniversary.data.meals.breakfast.length, 1);
    const partialSlots = await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { meals: { breakfast: [] } } });
    assert.equal(partialSlots.status, 200);
    assert.equal(partialSlots.data.meals.breakfast.length, 0);
    assert.equal(partialSlots.data.meals.dinner.length, 1, 'untouched meal slots must remain intact');
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { meals: 'invalid-json' } })).status, 400);
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { existingPhotos: 'invalid-json' } })).status, 400);
    assert.equal((await AnniversaryMenu.findById(anniversary._id)).photos.length, 1);
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenB, body: { title: '越权修改' } })).status, 404);
    assert.equal(partialSlots.data.supportsConditionalEdit, true);
    const expectedEditVersion = partialSlots.data.editVersion;
    const concurrentEdits = await Promise.all(['并发编辑甲', '并发编辑乙'].map(title => request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { title, expectedEditVersion } })));
    assert.deepEqual(concurrentEdits.map(result => result.status).sort(), [200, 409], 'only one conditional edit may succeed');
    assert.equal(concurrentEdits.find(result => result.status === 409).data.code, 'ANNIVERSARY_CONFLICT');
    assert.equal((await AnniversaryMenu.findById(anniversary._id)).photos.length, 1);
    const afterConditional = concurrentEdits.find(result => result.status === 200).data;
    assert.notEqual(afterConditional.editVersion.revision, expectedEditVersion.revision);
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { title: '旧客户端编辑' } })).status, 200);
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { title: '不应覆盖', expectedEditVersion: afterConditional.editVersion } })).status, 409, 'legacy writes invalidate a conditional editor');
    assert.equal((await request(`/anniversaries/${anniversary._id}`, { method: 'PUT', token: tokenA, body: { expectedEditVersion: 'bad-json' } })).status, 400);
    const legacyMenu = await AnniversaryMenu.collection.insertOne({ householdId: homeA._id, createdBy: userA._id, title: '旧数据菜单', date: '2026-11-13', photos: [], meals: { breakfast: [], lunch: [], dinner: [] } });
    const legacyList = await request('/anniversaries', { token: tokenA });
    const legacyItem = legacyList.data.find(item => item._id === String(legacyMenu.insertedId));
    assert.deepEqual(legacyItem.editVersion, { revision: null, updatedAt: null });
    assert.equal((await request(`/anniversaries/${legacyMenu.insertedId}`, { method: 'PUT', token: tokenA, body: { title: '旧数据已编辑', expectedEditVersion: legacyItem.editVersion } })).status, 200);
    if (process.env.EATWHAT_TEST_BROWSER === '1') {
      const dist = path.resolve(__dirname, '../../client/dist');
      assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'build client/dist before browser integration');
      const frontend = express();
      frontend.use('/api', (req, res) => {
        const upstream = http.request({ hostname: '127.0.0.1', port: server.address().port, path: req.url, method: req.method, headers: req.headers }, response => {
          res.writeHead(response.statusCode, response.headers);
          response.pipe(res);
        });
        upstream.on('error', error => { if (!res.headersSent) res.status(502).end(error.message); else res.destroy(error); });
        req.pipe(upstream);
      });
      frontend.use(express.static(dist, { dotfiles: 'allow' }));
      frontend.use((req, res) => res.sendFile(path.join(dist, 'index.html'), { dotfiles: 'allow' }));
      webServer = await new Promise(resolve => { const instance = frontend.listen(0, '127.0.0.1', () => resolve(instance)); });
      const webBase = `http://127.0.0.1:${webServer.address().port}`;
      const uiMeal = await Meal.create({ householdId: homeA._id, name: '浏览器并发菜', category: '家常菜' });
      const secondMeal = await Meal.create({ householdId: homeA._id, name: '浏览器排餐二', category: '家常菜' });
      const playwright = require('../../client/node_modules/playwright');
      browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
      const contexts = await Promise.all([
        browser.newContext({ viewport: { width: 1280, height: 900 } }),
        browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
      ]);
      const pages = await Promise.all(contexts.map(async (context, i) => {
        await context.addInitScript(({ token, user, householdId }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({ id: user, householdId, username: `test-local-${user}` }));
        }, { token: i ? tokenPartner : tokenA, user: String(i ? partnerA._id : userA._id), householdId: String(homeA._id) });
        return context.newPage();
      }));
      const browserErrors = [];
      for (const page of pages) page.on('pageerror', error => browserErrors.push(error.message));
      await Promise.all(pages.map(page => page.goto(`${webBase}/dashboard`)));
      await Promise.all([pages[0].getByText('partner high', { exact: true }).waitFor(), pages[1].getByText('self only', { exact: true }).waitFor()]);
      assert.equal(await pages[0].getByText('self only', { exact: true }).count(), 0, 'dashboard must not show own wish as a partner reminder');
      assert.equal(await pages[1].getByText('partner high', { exact: true }).count(), 0, 'the partner must not see their own wish as another member’s');
      const browserVote = await WishlistItem.create({ householdId: homeA._id, title: '浏览器协作投票', status: 'open', votes: [], createdBy: userA._id });
      await Promise.all(pages.map(page => page.goto(`${webBase}/wishlist`)));
      await Promise.all(pages.map(page => page.getByRole('button', { name: '我想吃浏览器协作投票' }).click()));
      await Promise.all(pages.map(page => page.getByRole('button', { name: '取消想吃浏览器协作投票' }).waitFor()));
      assert.deepEqual((await WishlistItem.findById(browserVote._id)).votes.map(String).sort(), [String(userA._id), String(partnerA._id)].sort());
      const browserWishCard = pages[0].locator('.wish-card').filter({ hasText: '浏览器协作投票' });
      assert.equal((await request(`/wishlist/${browserVote._id}/vote`, { method: 'PUT', token: tokenPartner, body: { voted: false } })).status, 200);
      await browserWishCard.getByRole('button', { name: '标记已安排' }).click();
      await pages[0].getByText('这条想吃已被其他成员修改或删除', { exact: false }).waitFor();
      assert.equal((await WishlistItem.findById(browserVote._id)).status, 'open');
      await pages[0].getByRole('button', { name: '刷新清单并核对' }).click();
      await browserWishCard.getByRole('button', { name: '标记已安排' }).click();
      await browserWishCard.getByRole('button', { name: '重新想吃' }).waitFor();
      await pages[1].getByRole('button', { name: '删除浏览器协作投票' }).click();
      await pages[1].getByRole('button', { name: '确定', exact: true }).click();
      await pages[1].getByText('这条想吃已被其他成员修改或删除', { exact: false }).waitFor();
      assert.ok(await WishlistItem.exists({ _id: browserVote._id }), 'a stale browser must not delete the newer item');
      await pages[1].getByRole('button', { name: '刷新清单并核对' }).click();
      const scheduledWish = await WishlistItem.create({ householdId: homeA._id, title: '排餐不会覆盖完成状态', status: 'open', mealId: uiMeal._id, votes: [], createdBy: userA._id });
      await pages[0].goto(`${webBase}/selection?date=2026-12-20&mealType=dinner&suggestedMealId=${uiMeal._id}&wishlistId=${scheduledWish._id}`);
      await pages[0].getByRole('button', { name: '保存安排' }).waitFor({ state: 'visible' });
      await pages[0].waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('保存安排') && !button.disabled));
      assert.equal((await request(`/wishlist/${scheduledWish._id}/status`, { method: 'PATCH', token: tokenPartner, body: { status: 'done' } })).status, 200);
      await pages[0].getByRole('button', { name: '保存安排' }).click();
      await pages[0].waitForURL('**/calendar');
      assert.equal((await WishlistItem.findById(scheduledWish._id)).status, 'done', 'saving a schedule must not overwrite a later completion');
      await Promise.all(pages.map(page => page.goto(`${webBase}/meals`)));
      await Promise.all([
        pages[0].waitForResponse(response => new URL(response.url()).pathname === '/api/meals' && new URL(response.url()).searchParams.get('search') === '浏览器并发菜'),
        pages[0].getByRole('textbox', { name: '搜索菜品' }).fill('浏览器并发菜')
      ]);
      const category = pages[1].getByRole('complementary', { name: '菜品分类' }).getByRole('button', { name: '家常菜' });
      await Promise.all([
        pages[1].waitForResponse(response => new URL(response.url()).pathname === '/api/meals' && new URL(response.url()).searchParams.get('category') === '家常菜'),
        category.click()
      ]);
      assert.equal(await category.getAttribute('aria-pressed'), 'true');
      const buttons = pages.map(page => page.locator('.meal-card-wrapper').filter({ hasText: '浏览器并发菜' }).getByRole('button', { name: '加入想吃清单：浏览器并发菜' }));
      await Promise.all(buttons.map(button => button.waitFor()));
      assert.equal(await pages[1].evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'mobile catalog must not overflow');
      const beforeAtomic = atomicCalls;
      const beforeLegacy = legacyCalls;
      await Promise.all(buttons.map(button => button.click()));
      await Promise.all(pages.map(page => page.waitForFunction(() => [...document.querySelectorAll('.el-message')].some(message => /已加入小家的想吃清单|已经在想吃清单中/.test(message.textContent)))));
      assert.ok(atomicCalls > beforeAtomic, 'browser must use the atomic endpoint');
      assert.equal(legacyCalls, beforeLegacy, 'browser must not use legacy create on a capable server');
      assert.equal(await WishlistItem.countDocuments({ householdId: homeA._id, mealId: uiMeal._id, status: 'open' }), 1);
      await Meal.create(Array.from({ length: 10 }, (_, index) => ({ householdId: homeA._id, name: `浏览器分页${index}`, category: '家常菜' })));
      // Two family members open the same absent day, then the second must
      // reload rather than overwrite the first member's saved selection.
      const dinnerDate = '2026-10-29';
      await Promise.all([
        pages[0].goto(`${webBase}/selection?date=${dinnerDate}&mealType=dinner&suggestedMealId=${uiMeal._id}`),
        pages[1].goto(`${webBase}/selection?date=${dinnerDate}&mealType=dinner&suggestedMealId=${secondMeal._id}`)
      ]);
      await Promise.all([
        pages[0].getByRole('button', { name: '移除浏览器并发菜' }).waitFor(),
        pages[1].getByRole('button', { name: '移除浏览器排餐二' }).waitFor()
      ]);
      assert.ok(await pages[0].locator('.meals-grid .meal-card-wrapper').count() <= 8);
      await pages[0].getByRole('button', { name: '保存安排' }).click();
      await pages[0].waitForURL('**/calendar');
      await pages[1].getByRole('button', { name: '保存安排' }).click();
      await pages[1].getByText('其他成员刚刚更新了安排').waitFor();
      assert.equal(await pages[1].getByRole('button', { name: '保存安排' }).isDisabled(), true);
      await pages[1].getByRole('button', { name: '重新加载最新安排' }).click();
      await pages[1].getByRole('button', { name: '重新加载', exact: true }).click();
      await pages[1].getByRole('button', { name: '移除浏览器并发菜' }).waitFor();
      assert.equal(await pages[1].getByRole('button', { name: '移除浏览器排餐二' }).count(), 0);
      await pages[1].getByRole('textbox', { name: '搜索可选菜品' }).fill('浏览器排餐二');
      await pages[1].getByRole('button', { name: '选择浏览器排餐二' }).click();
      await pages[1].getByRole('button', { name: '保存安排' }).click();
      await pages[1].waitForURL('**/calendar');
      const savedDinner = await request(`/schedules/day/${dinnerDate}`, { token: tokenA });
      assert.equal(savedDinner.status, 200);
      assert.deepEqual(savedDinner.data.meals.dinner.map(item => String(item.meal._id)), [String(uiMeal._id), String(secondMeal._id)]);
      assert.deepEqual(savedDinner.data.meals.dinner.map(item => String(item.addedBy._id)), [String(userA._id), String(partnerA._id)], 'editing retains the original member and attributes only the new dish');
      assert.equal((await request(`/schedules/day/${dinnerDate}`, { token: tokenB })).data.scheduleExists, false);
      const unknownMeal = await Meal.create({ householdId: homeA._id, name: '历史未知添加人', category: '家常菜' });
      const newMeal = await Meal.create({ householdId: homeA._id, name: '周计划新增菜', category: '家常菜' });
      await Schedule.updateOne({ householdId: homeA._id, date: dinnerDate }, { $push: { 'meals.dinner': { meal: unknownMeal._id, addedBy: null } } });
      const unknownDaily = await request(`/schedules/day/${dinnerDate}`, { token: tokenPartner });
      assert.equal(unknownDaily.data.meals.dinner[2].addedBy, null, 'unknown history must not be attributed to the viewer');
      const unknownMonth = await request('/schedules?year=2026&month=10', { token: tokenA });
      assert.equal(unknownMonth.data.find(day => day.date === dinnerDate).meals.dinner[2].addedBy, null);
      await pages[0].clock.setFixedTime(new Date(2026, 9, 29, 12));
      await pages[0].goto(`${webBase}/calendar`);
      await pages[0].getByRole('img', { name: '添加者未知' }).first().waitFor();
      await pages[0].getByRole('img', { name: '由test-local-a添加' }).first().waitFor();
      await pages[0].getByRole('img', { name: '由test-local-partner添加' }).first().waitFor();
      const weekly = await request('/weekly-plans?weekStart=2026-10-26', { token: tokenPartner });
      const expectedVersions = Object.fromEntries(weekly.data.days.map(day => [day.date, day.scheduleVersion]));
      const plan = weekly.data.days.map(day => ({ date: day.date, meals: { breakfast: [], lunch: [], dinner: day.date === dinnerDate ? [uiMeal, secondMeal, unknownMeal, newMeal].map(meal => String(meal._id)) : [] } }));
      const appliedPlan = await request('/weekly-plans/apply', { method: 'POST', token: tokenPartner, body: { days: plan, expectedVersions } });
      assert.equal(appliedPlan.status, 200, 'weekly apply must accept a verified plan');
      const afterWeekly = await request(`/schedules/day/${dinnerDate}`, { token: tokenA });
      assert.deepEqual(afterWeekly.data.meals.dinner.map(item => item.addedBy ? String(item.addedBy._id) : null), [String(userA._id), String(partnerA._id), null, String(partnerA._id)], 'weekly plans preserve retained and unknown authors');
      const legacy = await request(`/schedules/${dinnerDate}/dinner`, { method: 'PUT', token: tokenA, body: { mealIds: [uiMeal, unknownMeal, newMeal].map(meal => String(meal._id)) } });
      assert.equal(legacy.status, 200);
      assert.deepEqual(legacy.data.meals.dinner.map(item => item.addedBy ? String(item.addedBy._id) : null), [String(userA._id), null, String(partnerA._id)], 'legacy updates preserve retained authors');
      const readded = await request(`/schedules/${dinnerDate}/dinner`, { method: 'PUT', token: tokenA, body: { mealIds: [uiMeal, unknownMeal, newMeal, secondMeal].map(meal => String(meal._id)), expectedVersion: legacy.data.updatedAt } });
      assert.equal(readded.status, 200);
      assert.equal(String(readded.data.meals.dinner[3].addedBy._id), String(userA._id), 'a newly re-added dish belongs to the member who re-added it');
      const legacyNew = await request('/schedules/2026-11-15/dinner', { method: 'PUT', token: tokenA, body: { mealIds: [String(uiMeal._id)] } });
      assert.equal(legacyNew.status, 200, 'legacy single-day upsert remains supported');
      assert.ok(legacyNew.data.createdAt && legacyNew.data.updatedAt, 'upsert preserves timestamps');
      assert.equal(String(legacyNew.data.meals.dinner[0].addedBy._id), String(userA._id));
      const nextWeek = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'];
      const legacyPlan = nextWeek.map(date => ({ date, meals: { breakfast: [], lunch: [], dinner: [String(uiMeal._id)] } }));
      const legacyApplied = await request('/weekly-plans/apply', { method: 'POST', token: tokenPartner, body: { days: legacyPlan } });
      assert.equal(legacyApplied.status, 200, 'legacy weekly upserts remain supported');
      const legacyWeeklyDay = await request(`/schedules/day/${nextWeek[0]}`, { token: tokenA });
      assert.ok(legacyWeeklyDay.data.createdAt && legacyWeeklyDay.data.scheduleVersion);
      assert.equal(String(legacyWeeklyDay.data.meals.dinner[0].addedBy._id), String(partnerA._id));
      const futureVersion = new Date(Date.now() + 60000);
      await Schedule.updateOne({ householdId: homeA._id, date: '2026-11-15' }, { $set: { updatedAt: futureVersion } }, { timestamps: false });
      const competingUpdates = await Promise.all([tokenA, tokenPartner].map(token => request('/schedules/2026-11-15/dinner', {
        method: 'PUT', token, body: { mealIds: [String(uiMeal._id)], expectedVersion: futureVersion.toISOString() }
      })));
      assert.deepEqual(competingUpdates.map(result => result.status).sort(), [200, 409], 'one of two writes with the same version must conflict');
      const acceptedUpdate = competingUpdates.find(result => result.status === 200);
      assert.ok(Date.parse(acceptedUpdate.data.updatedAt) > futureVersion.getTime(), 'a version must advance even when the existing timestamp is not behind the clock');
      const legacyRace = await Promise.all([tokenA, tokenPartner].map(token => request('/schedules/2026-11-23/dinner', {
        method: 'PUT', token, body: { mealIds: [String(uiMeal._id)] }
      })));
      assert.deepEqual(legacyRace.map(result => result.status), [200, 200], 'legacy concurrent creation must recover from the unique-index race');
      assert.equal(await Schedule.countDocuments({ householdId: homeA._id, date: '2026-11-23' }), 1);
      assert.equal(String(legacyRace[0].data.meals.dinner[0].addedBy._id), String(legacyRace[1].data.meals.dinner[0].addedBy._id), 'both legacy writers retain the actual first creator');
      await pages[1].clock.setFixedTime(new Date(2026, 9, 29, 12));
      await Promise.all(pages.map(page => page.goto(`${webBase}/shopping-list`)));
      await Promise.all(pages.map(page => page.waitForFunction(() => !document.querySelector('input[aria-label="食材名称"]')?.disabled)));
      await pages[0].getByRole('textbox', { name: '食材名称' }).fill('浏览器鸡蛋');
      await pages[1].getByRole('textbox', { name: '食材名称' }).fill('浏览器面包');
      await pages[0].getByRole('button', { name: '添加食材' }).click();
      await pages[0].getByText('浏览器鸡蛋', { exact: true }).waitFor();
      await pages[1].getByRole('button', { name: '添加食材' }).click();
      await pages[1].getByText('其他成员更新了购物清单', { exact: false }).waitFor();
      assert.equal(await pages[1].getByRole('textbox', { name: '食材名称' }).inputValue(), '浏览器面包');
      assert.equal(await pages[1].getByRole('button', { name: '添加食材' }).isDisabled(), true);
      await pages[1].getByRole('button', { name: '重新加载并核对' }).click();
      await pages[1].getByText('浏览器鸡蛋', { exact: true }).waitFor();
      assert.equal(await pages[1].getByRole('textbox', { name: '食材名称' }).inputValue(), '浏览器面包');
      await pages[1].getByRole('button', { name: '添加食材' }).click();
      await pages[1].getByText('浏览器面包', { exact: true }).waitFor();
      assert.equal(await pages[1].evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      const sharedShopping = await request('/shopping-list?weekStart=2026-10-26', { token: tokenA });
      assert.deepEqual(sharedShopping.data.items.map(item => item.name).sort(), ['浏览器面包', '浏览器鸡蛋'].sort());
      await pages[1].getByText('浏览器面包', { exact: true }).click();
      await pages[1].waitForFunction(() => [...document.querySelectorAll('.item-row')].some(row => row.textContent.includes('浏览器面包') && row.querySelector('input')?.checked));
      await pages[1].getByRole('button', { name: '清空已购' }).click();
      await pages[1].getByRole('button', { name: '清空', exact: true }).click();
      await pages[1].getByText('浏览器面包', { exact: true }).waitFor({ state: 'hidden' });
      await pages[1].getByRole('button', { name: '从排餐生成' }).click();
      await pages[1].getByText('已按本周排餐生成购物清单').waitFor();
      await pages[1].getByText('浏览器鸡蛋', { exact: true }).waitFor();
      await pages[1].getByRole('button', { name: '删除浏览器鸡蛋' }).click();
      await pages[1].getByText('浏览器鸡蛋', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal((await request('/shopping-list?weekStart=2026-10-26', { token: tokenA })).data.items.length, 0);
      await pages[0].goto(`${webBase}/weekly-plan`);
      await pages[0].getByRole('button', { name: '生成草稿' }).click();
      await pages[0].getByText('规则生成草稿').waitFor();
      const editableMeal = await Meal.create({ householdId: homeA._id, name: '周计划手动加菜', category: '家常菜' });
      const beforeDraftEdit = await Schedule.countDocuments({ householdId: homeA._id });
      await pages[0].getByRole('button', { name: '调整2026-10-26晚餐' }).click();
      const weeklyPicker = pages[0].getByRole('dialog', { name: '调整 2026-10-26 晚餐' });
      await weeklyPicker.getByRole('textbox', { name: '搜索周计划菜品' }).fill('周计划手动加菜');
      await weeklyPicker.getByRole('button', { name: '选择周计划手动加菜' }).click();
      await weeklyPicker.getByRole('button', { name: '保存到草稿' }).click();
      await pages[0].locator('.draft-card').getByText('周计划手动加菜', { exact: true }).waitFor();
      assert.equal(await Schedule.countDocuments({ householdId: homeA._id }), beforeDraftEdit, 'editing the draft must not write any schedules');
      await pages[0].getByRole('button', { name: '应用到日历' }).click();
      await pages[0].getByRole('button', { name: '确认替换' }).click();
      await pages[0].getByText('已应用到日历').waitFor();
      assert.equal(await pages[0].getByText('规则生成草稿').count(), 0);
      assert.equal(await Schedule.countDocuments({ householdId: homeA._id, date: { $in: ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'] } }), 7);
      const editedDay = await request('/schedules/day/2026-10-26', { token: tokenA });
      assert.ok(editedDay.data.meals.dinner.some(item => String(item.meal._id) === String(editableMeal._id)), 'the edited draft is what reaches the database');
      await pages[0].goto(`${webBase}/photo-album`);
      await pages[0].getByText('2026-10 · 26 张照片').waitFor();
      assert.equal(await pages[0].locator('.photo-card').count(), 24);
      await pages[0].getByRole('button', { name: '下一页' }).click();
      await pages[0].getByRole('button', { name: /第 25 张/ }).click();
      const photoDialog = pages[0].getByRole('dialog', { name: '饭桌回忆' });
      await photoDialog.getByText('25 / 26').waitFor();
      await pages[0].keyboard.press('ArrowLeft');
      await photoDialog.getByText('24 / 26').waitFor();
      await pages[0].keyboard.press('ArrowRight');
      await photoDialog.getByText('25 / 26').waitFor();
      assert.equal(await pages[0].getByText('乙家庭私密照片').count(), 0);
      await photoDialog.getByRole('link', { name: '编辑这条饭后回忆' }).click();
      const linkedMemory = pages[0].getByRole('dialog', { name: '编辑饭后回忆' });
      assert.equal(await linkedMemory.getByPlaceholder('比如：周五晚上的番茄牛腩').inputValue(), '甲家庭相册');
      await linkedMemory.getByRole('button', { name: '取消', exact: true }).click();
      await pages[0].getByRole('button', { name: '编辑旧客户端回忆修改' }).click();
      const editMemory = pages[0].getByRole('dialog', { name: '编辑饭后回忆' });
      const memoryTitle = editMemory.getByPlaceholder('比如：周五晚上的番茄牛腩');
      await memoryTitle.fill('本页回忆草稿');
      assert.equal((await request(`/memories/${memoryId}`, { method: 'PUT', token: tokenA, body: { title: '家人更新的回忆' } })).status, 200);
      await editMemory.getByRole('button', { name: '保存', exact: true }).click();
      await editMemory.getByText('回忆已被修改或删除，本次未保存', { exact: false }).waitFor();
      assert.equal(await memoryTitle.inputValue(), '本页回忆草稿');
      await editMemory.getByRole('button', { name: '读取最新回忆并核对' }).click();
      await editMemory.getByText('家人更新的回忆', { exact: false }).waitFor();
      await editMemory.getByRole('button', { name: '放弃草稿并载入最新' }).click();
      await pages[0].getByRole('button', { name: '放弃草稿并载入', exact: true }).click();
      assert.equal(await memoryTitle.inputValue(), '家人更新的回忆');
      await memoryTitle.fill('浏览器确认的回忆');
      await editMemory.getByRole('spinbutton').fill('25');
      await editMemory.getByRole('button', { name: '保存', exact: true }).click();
      await pages[0].getByText('浏览器确认的回忆', { exact: true }).waitFor();
      const editedMemory = await MealMemory.findById(memoryId);
      assert.equal(editedMemory.actualCookTime, 25);
      assert.equal(editedMemory.photos.length, 1);
      assert.deepEqual(editedMemory.mealIds.map(String), [String(mealA._id)]);
      assert.deepEqual(editedMemory.participants.map(String), [String(userA._id)]);
      await pages[0].goto(`${webBase}/anniversaries`);
      await pages[0].getByText('旧客户端编辑', { exact: true }).waitFor();
      await pages[0].getByRole('button', { name: '新增菜单' }).click();
      const anniversaryDialog = pages[0].getByRole('dialog', { name: '新增纪念日菜单' });
      await anniversaryDialog.getByPlaceholder('比如：三周年晚餐').fill('浏览器纪念日');
      const dinnerSearch = anniversaryDialog.getByRole('combobox', { name: '搜索晚餐菜品' });
      await dinnerSearch.click();
      await pages[0].getByRole('option', { name: '周计划手动加菜', exact: true }).click();
      await anniversaryDialog.getByRole('button', { name: '保存', exact: true }).click();
      await pages[0].getByText('浏览器纪念日', { exact: true }).waitFor();
      const browserAnniversary = await AnniversaryMenu.findOne({ householdId: homeA._id, title: '浏览器纪念日' });
      assert.deepEqual(browserAnniversary.meals.dinner.map(String), [String(editableMeal._id)]);
      await pages[0].getByRole('button', { name: '编辑浏览器纪念日' }).click();
      const editAnniversary = pages[0].getByRole('dialog', { name: '编辑纪念日菜单' });
      const anniversaryTitle = editAnniversary.getByPlaceholder('比如：三周年晚餐');
      await anniversaryTitle.fill('本页未保存草稿');
      assert.equal((await request(`/anniversaries/${browserAnniversary._id}`, { method: 'PUT', token: tokenA, body: { title: '另一位成员的修改' } })).status, 200);
      await editAnniversary.getByRole('button', { name: '保存', exact: true }).click();
      await editAnniversary.getByText('菜单已被修改或删除，本次未保存', { exact: false }).waitFor();
      assert.equal(await anniversaryTitle.inputValue(), '本页未保存草稿');
      await editAnniversary.getByRole('button', { name: '刷新最新菜单并核对' }).click();
      await editAnniversary.getByText('另一位成员的修改', { exact: false }).waitFor();
      await editAnniversary.getByRole('button', { name: '放弃草稿并载入最新' }).click();
      await pages[0].getByRole('button', { name: '放弃草稿并载入', exact: true }).click();
      assert.equal(await anniversaryTitle.inputValue(), '另一位成员的修改');
      await anniversaryTitle.fill('浏览器确认的修改');
      await editAnniversary.getByRole('button', { name: '保存', exact: true }).click();
      await pages[0].getByText('浏览器确认的修改', { exact: true }).waitFor();
      const editedAnniversary = await AnniversaryMenu.findById(browserAnniversary._id);
      assert.equal(editedAnniversary.title, '浏览器确认的修改');
      assert.deepEqual(editedAnniversary.meals.dinner.map(String), [String(editableMeal._id)]);
      const inviteContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const invitePage = await inviteContext.newPage();
      invitePage.on('pageerror', error => browserErrors.push(error.message));
      await invitePage.goto(`${webBase}/apply-account#invite=${encodeURIComponent(homeA.inviteCode)}`);
      assert.equal(await invitePage.getByPlaceholder('请输入家人的邀请码').inputValue(), homeA.inviteCode);
      await invitePage.waitForURL('**/apply-account');
      await invitePage.getByPlaceholder('请输入用户名').fill('browser-invite');
      await invitePage.getByPlaceholder('请输入密码', { exact: true }).fill('test-only-password');
      await invitePage.getByPlaceholder('请再次输入密码').fill('test-only-password');
      await invitePage.getByRole('button', { name: '创建账号' }).click();
      await invitePage.waitForURL('**/login?username=browser-invite');
      await invitePage.getByPlaceholder('请输入密码').fill('test-only-password');
      await invitePage.getByRole('button', { name: '立即登录' }).click();
      await invitePage.waitForURL('**/dashboard');
      const browserUser = await User.findOne({ username: 'browser-invite' });
      assert.equal(String(browserUser.householdId), String(homeA._id));
      await invitePage.goto(`${webBase}/apply-account#invite=${encodeURIComponent(newInviteB)}`);
      await invitePage.getByRole('button', { name: '使用当前账号加入' }).click();
      await invitePage.waitForURL('**/settings');
      assert.equal(await invitePage.getByPlaceholder('输入伴侣的邀请码').inputValue(), newInviteB);
      assert.equal(String((await User.findById(browserUser._id)).householdId), String(homeA._id), 'opening a link does not switch households');
      await invitePage.getByRole('button', { name: '加入', exact: true }).click();
      await invitePage.getByRole('button', { name: '取消', exact: true }).last().click();
      assert.equal(String((await User.findById(browserUser._id)).householdId), String(homeA._id), 'cancelling a switch keeps the existing household');
      await invitePage.getByRole('button', { name: '加入', exact: true }).click();
      await invitePage.getByRole('button', { name: '确认加入' }).click();
      await invitePage.getByText('已加入小家').waitFor();
      assert.equal(String((await User.findById(browserUser._id)).householdId), String(homeB._id));
      const afterInviteSwitch = await request('/auth/me', { token: await login('browser-invite') });
      assert.equal(String(afterInviteSwitch.data.household.id), String(homeB._id));
      assert.ok(afterInviteSwitch.data.household.members.some(member => String(member._id) === String(browserUser._id)));
      assert.equal(afterInviteSwitch.data.household.members.some(member => String(member._id) === String(userA._id)), false);
      assert.deepEqual(browserErrors, []);
      await pages[1].screenshot({ path: path.join(root, 'mobile-catalog.png'), fullPage: true });
      console.log('Real browser integration passed: invitations, household switching, catalog, scheduling and collaborative shopping.');
    }
    await WishlistItem.create(Array.from({ length: 8 }, (_, index) => ({ householdId: homeA._id, title: `priority-burst-${index}`, status: 'open', priority: 'high', votes: [partnerA._id], createdBy: partnerA._id })));
    const limitedDashboard = await request('/dashboard/summary', { token: tokenA });
    assert.equal(limitedDashboard.data.partnerWishlist.length, 6);
    assert.ok(limitedDashboard.data.partnerWishlist.every(item => item.title.startsWith('priority-burst-')), 'the six newest high-priority partner wishes must win over lower-priority items');
    console.log('Isolated MongoDB integration passed: invitation rotation, concurrent household switches, migration audits, household isolation, scheduling and shopping.');
    console.log(`Synthetic database directory retained for inspection: ${root}`);
  } finally {
    if (browser) await browser.close();
    if (webServer) await new Promise(resolve => webServer.close(resolve));
    if (server) await new Promise(resolve => server.close(resolve));
    if (connected) {
      if (ownedMongo) {
        try { await mongoose.connection.db.admin().command({ shutdown: 1, force: true }); } catch (_) { /* Shutdown closes the connection. */ }
      }
      await mongoose.disconnect().catch(() => {});
    }
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
