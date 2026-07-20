const ShoppingList = require('../models/shoppingListModel');
const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');
const { startOfWeek, weekDates } = require('../utils/week');

function categoryFor(name) {
  const text = String(name || '');
  if (/(鸡|鸭|鱼|虾|肉|牛|羊|猪|蛋|排骨|里脊|火腿|培根|丸|肠)/.test(text)) return 'meat_egg';
  if (/(米|面|粉|饼|馒头|包|粥|年糕|土豆|红薯|玉米|主食)/.test(text)) return 'staple';
  if (/(盐|糖|醋|酱|油|料酒|葱|姜|蒜|椒|香料|孜然|花椒|调料|蚝油|生抽|老抽)/.test(text)) return 'seasoning';
  if (/(菜|豆角|黄瓜|番茄|西红柿|青椒|白菜|菠菜|生菜|油麦|西兰花|萝卜|茄子|芹菜|韭菜|蘑菇|木耳|藕|瓜)/.test(text)) return 'vegetable';
  return 'other';
}
function itemKey(item) { return `${String(item.name || '').trim().toLowerCase()}|${item.category || categoryFor(item.name)}`; }
function normalizeItem(body, uid, manual = true) {
  const name = String(body.name || '').trim();
  if (!name) return null;
  return { name, amount: String(body.amount || '').trim(), category: body.category || categoryFor(name), checked: !!body.checked, manual, sourceMealIds: [], addedBy: uid || null };
}
async function getOrCreateList(householdId, weekStart, uid) {
  let list = await ShoppingList.findOne({ householdId, weekStart });
  if (!list) list = await ShoppingList.create({ householdId, weekStart, items: [], createdBy: uid, updatedBy: uid });
  return list;
}
function serializeList(list) { return list.populate ? list : list; }

exports.get = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.query.weekStart);
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    res.json(list);
  } catch (err) { next(err); }
};

exports.generate = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.body?.weekStart || req.query.weekStart);
    const dates = weekDates(weekStart);
    const schedules = await Schedule.find({ householdId: household._id, date: { $in: dates } }).populate([
      { path: 'meals.breakfast.meal' }, { path: 'meals.lunch.meal' }, { path: 'meals.dinner.meal' }
    ]);
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    const checkedMap = new Map((list.items || []).filter(item => !item.manual).map(item => [itemKey(item), !!item.checked]));
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
            const row = generated.get(key) || { name, amountParts: [], category, checked: checkedMap.get(key) || false, manual: false, sourceMealIds: [] };
            if (ingredient.amount && !row.amountParts.includes(ingredient.amount)) row.amountParts.push(ingredient.amount);
            if (!row.sourceMealIds.some(id => String(id) === String(meal._id))) row.sourceMealIds.push(meal._id);
            generated.set(key, row);
          }
        }
      }
    }
    list.items = [
      ...Array.from(generated.values()).map(item => ({ ...item, amount: item.amountParts.join(' + '), amountParts: undefined, addedBy: req.user.uid })),
      ...manualItems
    ];
    list.generatedFrom = `week:${weekStart}:${Date.now()}`;
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(list);
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.body.weekStart || req.query.weekStart);
    const item = normalizeItem(req.body, req.user.uid, true);
    if (!item) return res.status(400).json({ error: '食材名称不能为空' });
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    list.items.push(item);
    list.updatedBy = req.user.uid;
    await list.save();
    res.status(201).json(list);
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.body.weekStart || req.query.weekStart);
    const list = await ShoppingList.findOne({ householdId: household._id, weekStart });
    if (!list) return res.status(404).json({ error: '购物清单不存在' });
    const item = list.items.id(req.params.id);
    if (!item) return res.status(404).json({ error: '食材项不存在' });
    ['name', 'amount', 'category'].forEach(field => { if (req.body[field] !== undefined) item[field] = String(req.body[field] || '').trim(); });
    if (req.body.checked !== undefined) item.checked = !!req.body.checked;
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(list);
  } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.query.weekStart || req.body?.weekStart);
    const list = await ShoppingList.findOne({ householdId: household._id, weekStart });
    if (!list) return res.status(404).json({ error: '购物清单不存在' });
    list.items = list.items.filter(item => String(item._id) !== String(req.params.id));
    list.updatedBy = req.user.uid;
    await list.save();
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.clearPurchased = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.body?.weekStart || req.query.weekStart);
    const list = await getOrCreateList(household._id, weekStart, req.user.uid);
    list.items = list.items.filter(item => !item.checked);
    list.updatedBy = req.user.uid;
    await list.save();
    res.json(list);
  } catch (err) { next(err); }
};

exports._categoryFor = categoryFor;
