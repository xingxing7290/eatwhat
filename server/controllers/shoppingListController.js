const ShoppingList = require('../models/shoppingListModel');
const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');
const { startOfWeek, weekDates } = require('../utils/week');
const mongoose = require('mongoose');
const { hasSafeShoppingListIndex } = require('../utils/shoppingListIndex');
const { schedulePopulation } = require('../utils/schedulePopulation');

function categoryFor(name) {
  const text = String(name || '');
  if (/(鸡|鸭|鱼|虾|肉|牛|羊|猪|蛋|排骨|里脊|火腿|培根|丸|肠)/.test(text)) return 'meat_egg';
  if (/(米|面|粉|饼|馒头|包|粥|年糕|土豆|红薯|玉米|主食)/.test(text)) return 'staple';
  if (/(盐|糖|醋|酱|油|料酒|葱|姜|蒜|椒|香料|孜然|花椒|调料|蚝油|生抽|老抽)/.test(text)) return 'seasoning';
  if (/(菜|豆角|黄瓜|番茄|西红柿|青椒|白菜|菠菜|生菜|油麦|西兰花|萝卜|茄子|芹菜|韭菜|蘑菇|木耳|藕|瓜)/.test(text)) return 'vegetable';
  return 'other';
}
function itemKey(item) { return `${String(item.name || '').trim().toLowerCase()}|${item.category || categoryFor(item.name)}`; }
function requestedWeek(value) {
  if (value === undefined || value === null || value === '') return startOfWeek();
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return startOfWeek(value);
}
function normalizeItem(body, uid, manual = true) {
  const name = String(body.name || '').trim();
  if (!name) return null;
  return { name, amount: String(body.amount || '').trim(), category: body.category || categoryFor(name), checked: !!body.checked, manual, sourceMealIds: [], addedBy: uid || null };
}
async function requireUniqueListIndex() {
  if (!await hasSafeShoppingListIndex(ShoppingList.collection)) {
    const error = new Error('购物清单安全索引未就绪，暂不能读取或修改，请联系管理员');
    error.code = 'SHOPPING_LIST_INDEX_UNAVAILABLE';
    throw error;
  }
}
async function getOrCreateList(householdId, weekStart, uid) {
  let list = await ShoppingList.findOne({ householdId, weekStart });
  if (!list) {
    try { list = await ShoppingList.create({ householdId, weekStart, items: [], createdBy: uid, updatedBy: uid }); }
    catch (error) {
      if (error.code !== 11000) throw error;
      list = await ShoppingList.findOne({ householdId, weekStart });
      if (!list) throw error;
    }
  }
  return list;
}
function serializeList(list) {
  return { ...list.toObject(), supportsConditionalUpdates: true, listVersion: Number.isSafeInteger(list.__v) && list.__v >= 0 ? list.__v : null };
}
function checkVersion(req, res, list) {
  const body = req.body || {};
  const hasBody = Object.prototype.hasOwnProperty.call(body, 'expectedVersion');
  const hasQuery = Object.prototype.hasOwnProperty.call(req.query || {}, 'expectedVersion');
  if (!Number.isSafeInteger(list.__v) || list.__v < 0) {
    res.status(409).json({ code: 'SHOPPING_LIST_VERSION_UNAVAILABLE', error: '购物清单缺少安全版本，请联系管理员核对' });
    return false;
  }
  if (!hasBody && !hasQuery) return true; // Older clients continue to work with server-side optimistic concurrency.
  const input = hasBody ? body.expectedVersion : req.query.expectedVersion;
  const parsed = typeof input === 'string' && /^(0|[1-9]\d*)$/.test(input) ? Number(input) : input;
  if (!Number.isSafeInteger(parsed) || parsed < 0) { res.status(400).json({ error: '购物清单版本无效，请重新加载' }); return false; }
  if (list.__v !== parsed) {
    res.status(409).json({ code: 'SHOPPING_LIST_CONFLICT', error: '购物清单已被其他成员更新，请重新加载' });
    return false;
  }
  return true;
}
function handleError(err, res, next) {
  if (err instanceof mongoose.Error.VersionError) return res.status(409).json({ code: 'SHOPPING_LIST_CONFLICT', error: '购物清单已被其他成员更新，请重新加载' });
  if (err.code === 'SHOPPING_LIST_INDEX_UNAVAILABLE') return res.status(503).json({ code: err.code, error: err.message });
  return next(err);
}

exports.get = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.query.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    res.json(serializeList(list));
  } catch (err) { handleError(err, res, next); }
};

exports.generate = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.body?.weekStart || req.query.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const dates = weekDates(weekStart);
    const schedules = await Schedule.find({ householdId: household._id, date: { $in: dates } }).populate(schedulePopulation(household._id, { includeAuthors: false }));
    const unavailableDates = [...new Set(schedules.filter(schedule => ['breakfast', 'lunch', 'dinner'].some(type => (schedule.meals?.[type] || []).some(entry => !entry?.meal))).map(schedule => schedule.date))].sort();
    if (unavailableDates.length) return res.status(409).json({ code: 'SCHEDULE_MEAL_UNAVAILABLE', error: '本周排餐包含不可用的菜品，未生成购物清单。请先在日历中核对。', unavailableDates });
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    if (!checkVersion(req, res, list)) return;
    const checkedMap = new Map((list.items || []).filter(item => !item.manual).map(item => [itemKey(item), { checked: !!item.checked, amount: item.amount || '', quantityComplete: item.quantityComplete === true }]));
    const manualItems = (list.items || []).filter(item => item.manual);
    const generated = new Map();
    for (const schedule of schedules) {
      for (const type of ['breakfast', 'lunch', 'dinner']) {
        for (const entry of schedule.meals?.[type] || []) {
          const meal = entry.meal;
          if (!meal) continue;
          for (const ingredient of meal.ingredients || []) {
            const name = String(ingredient.name || ingredient || '').trim();
            if (!name) continue;
            const category = categoryFor(name);
            const key = `${name.toLowerCase()}|${category}`;
            const row = generated.get(key) || { name, amountParts: [], category, manual: false, sourceMealIds: [], quantityComplete: true };
            // Repeated quantities from separate scheduled meals must not be
            // deduplicated: two recipes needing one egg still need two eggs.
            const quantity = typeof ingredient?.amount === 'string' ? ingredient.amount.trim() : '';
            if (quantity) row.amountParts.push(quantity);
            else row.quantityComplete = false;
            if (!row.sourceMealIds.some(id => String(id) === String(meal._id))) row.sourceMealIds.push(meal._id);
            generated.set(key, row);
          }
        }
      }
    }
    list.items = [
      ...Array.from(generated.values()).map(item => {
        const amount = item.amountParts.join(' + ');
        const previous = checkedMap.get(itemKey(item));
        return { ...item, amount, checked: !!previous?.checked && previous.quantityComplete && item.quantityComplete && previous.amount === amount, amountParts: undefined, addedBy: req.user.uid };
      }),
      ...manualItems
    ];
    list.generatedFrom = `week:${weekStart}:${Date.now()}`;
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(serializeList(list));
  } catch (err) { handleError(err, res, next); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.body.weekStart || req.query.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const item = normalizeItem(req.body, req.user.uid, true);
    if (!item) return res.status(400).json({ error: '食材名称不能为空' });
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    if (!checkVersion(req, res, list)) return;
    list.items.push(item);
    list.updatedBy = req.user.uid;
    await list.save();
    res.status(201).json(serializeList(list));
  } catch (err) { handleError(err, res, next); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.body.weekStart || req.query.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const list = await ShoppingList.findOne({ householdId: household._id, weekStart });
    if (!list) return res.status(404).json({ error: '购物清单不存在' });
    if (!checkVersion(req, res, list)) return;
    const item = list.items.id(req.params.id);
    if (!item) return res.status(404).json({ error: '食材项不存在' });
    ['name', 'amount', 'category'].forEach(field => { if (req.body[field] !== undefined) item[field] = String(req.body[field] || '').trim(); });
    if (req.body.checked !== undefined) item.checked = !!req.body.checked;
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(serializeList(list));
  } catch (err) { handleError(err, res, next); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.query.weekStart || req.body?.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const list = await ShoppingList.findOne({ householdId: household._id, weekStart });
    if (!list) return res.status(404).json({ error: '购物清单不存在' });
    if (!checkVersion(req, res, list)) return;
    list.items = list.items.filter(item => String(item._id) !== String(req.params.id));
    list.updatedBy = req.user.uid;
    await list.save();
    if (Object.prototype.hasOwnProperty.call(req.query || {}, 'expectedVersion') || Object.prototype.hasOwnProperty.call(req.body || {}, 'expectedVersion')) return res.json(serializeList(list));
    res.status(204).send();
  } catch (err) { handleError(err, res, next); }
};

exports.clearPurchased = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    await requireUniqueListIndex();
    const weekStart = requestedWeek(req.body?.weekStart || req.query.weekStart);
    if (!weekStart) return res.status(400).json({ error: '购物清单日期无效' });
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    if (!checkVersion(req, res, list)) return;
    list.items = list.items.filter(item => !item.checked);
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(serializeList(list));
  } catch (err) { handleError(err, res, next); }
};

exports._categoryFor = categoryFor;
