const MealMemory = require('../models/memoryModel');
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
function stringArray(value) {
  const arr = parseJson(value, []);
  return Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
}
function photoUrls(req) {
  return (req.files || []).map(file => buildImageUrl(req, file.filename));
}
function populateQuery(q) {
  return q.populate('mealIds').populate('createdBy', 'username displayName avatarUrl').populate('participants', 'username displayName avatarUrl');
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const query = { householdId: household._id };
    if (req.query.date) query.date = String(req.query.date);
    if (req.query.month) query.date = { $regex: `^${String(req.query.month)}` };
    if (req.query.mealId) query.mealIds = req.query.mealId;
    const memories = await populateQuery(MealMemory.find(query).sort({ date: -1, createdAt: -1 }).limit(200));
    res.json(memories);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const mealIds = stringArray(req.body.mealIds);
    if (mealIds.length) {
      const count = await Meal.countDocuments({ _id: { $in: mealIds }, householdId: household._id });
      if (count !== mealIds.length) return res.status(400).json({ error: '包含无效菜品' });
    }
    const date = String(req.body.date || '').trim();
    if (!date) return res.status(400).json({ error: '日期必填' });
    const memory = await MealMemory.create({
      householdId: household._id,
      date,
      mealType: req.body.mealType || 'other',
      title: String(req.body.title || '').trim(),
      note: String(req.body.note || '').trim(),
      mood: String(req.body.mood || '').trim(),
      rating: Math.min(Number(req.body.rating) || 0, 5),
      actualCookTime: Math.max(Number(req.body.actualCookTime) || 0, 0),
      nextImprovement: String(req.body.nextImprovement || '').trim(),
      photos: [...stringArray(req.body.existingPhotos), ...photoUrls(req)],
      mealIds,
      participants: stringArray(req.body.participants),
      createdBy: req.user.uid
    });
    res.status(201).json(await populateQuery(MealMemory.findById(memory._id)));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const existing = await MealMemory.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) return res.status(404).json({ error: '未找到回忆记录' });
    const update = {
      date: String(req.body.date || existing.date).trim(),
      mealType: req.body.mealType || existing.mealType,
      title: String(req.body.title || '').trim(),
      note: String(req.body.note || '').trim(),
      mood: String(req.body.mood || '').trim(),
      rating: Math.min(Number(req.body.rating) || 0, 5),
      actualCookTime: Math.max(Number(req.body.actualCookTime) || 0, 0),
      nextImprovement: String(req.body.nextImprovement || '').trim(),
      photos: [...stringArray(req.body.existingPhotos), ...photoUrls(req)],
      mealIds: stringArray(req.body.mealIds),
      participants: stringArray(req.body.participants)
    };
    const memory = await populateQuery(MealMemory.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, update, { new: true }));
    res.json(memory);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const deleted = await MealMemory.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deleted) return res.status(404).json({ error: '未找到回忆记录' });
    res.status(204).send();
  } catch (err) { next(err); }
};