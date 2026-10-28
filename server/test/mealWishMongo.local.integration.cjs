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
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'isolated-local-test-secret-never-use-in-production';
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const Schedule = require('../models/scheduleModel');
const WishlistItem = require('../models/wishlistModel');
const wishlist = require('../controllers/wishlistController');
const mealController = require('../controllers/mealController');
const dashboardController = require('../controllers/dashboardController');
const scheduleController = require('../controllers/scheduleController');
const weeklyPlanController = require('../controllers/weeklyPlanController');
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/auth');
const { auditAndApply } = require('../scripts/meal-wish-index');

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
    app.use(requireAuth());
    app.get('/meals', mealController.getAllMeals);
    app.get('/meals/categories', mealController.getMealCategories);
    app.get('/meals/tags', mealController.getMealTags);
    app.get('/meals/:id', mealController.getMealById);
    app.get('/schedules', scheduleController.validateSchedulesQuery, scheduleController.getSchedules);
    app.get('/schedules/day/:date', scheduleController.validateScheduleDate, scheduleController.getScheduleByDate);
    app.put('/schedules/:date/:mealType', scheduleController.validateScheduleUpdate, scheduleController.updateSchedule);
    app.get('/weekly-plans', weeklyPlanController.list);
    app.post('/weekly-plans/apply', weeklyPlanController.apply);
    app.get('/dashboard/summary', dashboardController.summary);
    app.get('/wishlist', wishlist.list);
    let legacyCalls = 0;
    let atomicCalls = 0;
    app.post('/wishlist', (req, res, next) => { legacyCalls++; next(); }, wishlist.create);
    app.post('/wishlist/meal', (req, res, next) => { atomicCalls++; next(); }, wishlist.createMealWish);
    app.patch('/wishlist/:id/status', wishlist.updateStatus);
    app.patch('/wishlist/:id/meal', wishlist.attachMeal);
    app.use((error, req, res, next) => res.status(500).json({ error: error.message }));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(url, { method = 'GET', body, token } = {}) {
      const result = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: result.status, data: await result.json() };
    }
    async function login(username) {
      const result = await request('/auth/login', { method: 'POST', body: { username, password: 'test-only-password' } });
      assert.equal(result.status, 200);
      return result.data.token;
    }
    const [tokenA, tokenPartner, tokenB] = await Promise.all(['test-local-a', 'test-local-partner', 'test-local-b'].map(login));
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
    assert.ok(reminders.indexOf('partner high') < reminders.indexOf('partner normal'));
    assert.ok(reminders.indexOf('partner normal') < reminders.indexOf('partner low newest'), 'priority must not be sorted alphabetically');
    assert.equal(reminders.includes('Test A meal'), false, 'another household must remain isolated');
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
      assert.deepEqual(browserErrors, []);
      await pages[1].screenshot({ path: path.join(root, 'mobile-catalog.png'), fullPage: true });
      console.log('Real browser integration passed: partner reminders, catalog, atomic meal wishes and desktop/mobile conflict-safe meal selection.');
    }
    await WishlistItem.create(Array.from({ length: 8 }, (_, index) => ({ householdId: homeA._id, title: `priority-burst-${index}`, status: 'open', priority: 'high', votes: [partnerA._id], createdBy: partnerA._id })));
    const limitedDashboard = await request('/dashboard/summary', { token: tokenA });
    assert.equal(limitedDashboard.data.partnerWishlist.length, 6);
    assert.ok(limitedDashboard.data.partnerWishlist.every(item => item.title.startsWith('priority-burst-')), 'the six newest high-priority partner wishes must win over lower-priority items');
    console.log('Isolated MongoDB integration passed: migration audit, 16 concurrent requests, household isolation, partner reminders, priority ordering, legacy conflicts, and re-add after completion.');
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
