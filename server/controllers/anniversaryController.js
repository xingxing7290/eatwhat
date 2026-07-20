const AnniversaryMenu = require('../models/anniversaryMenuModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');

function buildImageUrl(req, filename) {
  const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
  return publicBase ? `${publicBase.replace(/\/$/, '')}/uploads/${filename}` : `/api/uploads/${filename}`;
}
function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}
function photoUrls(req) {
  return (req.files || []).map(file => buildImageUrl(req, file.filename));
}
function normalizeMeals(value) {
  const input = parseJson(value, {});
  const out = { breakfast: [], lunch: [], dinner: [] };
  for (const key of Object.keys(out)) out[key] = Array.isArray(input?.[key]) ? input[key].filter(Boolean) : [];
  return out;
}
function allMealIds(meals) {
  return ['breakfast', 'lunch', 'dinner'].flatMap(key => meals[key] || []);
}
function populateQuery(q) {
  return q.populate('meals.breakfast').populate('meals.lunch').populate('meals.dinner').populate('createdBy', 'username displayName avatarUrl');
}
async function assertMealsInHousehold(meals, householdId) {
  const ids = allMealIds(meals);
  if (!ids.length) return true;
  const count = await Meal.countDocuments({ _id: { $in: ids }, householdId });
  return count === ids.length;
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const items = await populateQuery(AnniversaryMenu.find({ householdId: household._id }).sort({ date: 1, createdAt: -1 }));
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const title = String(req.body.title || '').trim();
    const date = String(req.body.date || '').trim();
    if (!title || !date) return res.status(400).json({ error: '标题和日期必填' });
    const meals = normalizeMeals(req.body.meals);
    if (!(await assertMealsInHousehold(meals, household._id))) return res.status(400).json({ error: '包含无效菜品' });
    const item = await AnniversaryMenu.create({
      householdId: household._id,
      title,
      date,
      description: String(req.body.description || '').trim(),
      theme: String(req.body.theme || '').trim(),
      photos: photoUrls(req),
      meals,
      createdBy: req.user.uid
    });
    res.status(201).json(await populateQuery(AnniversaryMenu.findById(item._id)));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const existing = await AnniversaryMenu.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) return res.status(404).json({ error: '未找到纪念日菜单' });
    const meals = normalizeMeals(req.body.meals);
    if (!(await assertMealsInHousehold(meals, household._id))) return res.status(400).json({ error: '包含无效菜品' });
    const existingPhotos = parseJson(req.body.existingPhotos, []);
    const item = await populateQuery(AnniversaryMenu.findOneAndUpdate(
      { _id: req.params.id, householdId: household._id },
      {
        title: String(req.body.title || '').trim(),
        date: String(req.body.date || '').trim(),
        description: String(req.body.description || '').trim(),
        theme: String(req.body.theme || '').trim(),
        photos: [...(Array.isArray(existingPhotos) ? existingPhotos : []), ...photoUrls(req)],
        meals
      },
      { new: true }
    ));
    res.json(item);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const deleted = await AnniversaryMenu.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deleted) return res.status(404).json({ error: '未找到纪念日菜单' });
    res.status(204).send();
  } catch (err) { next(err); }
};