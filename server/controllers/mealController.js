const Meal = require('../models/mealModel');
const MealMemory = require('../models/memoryModel');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { ensureUserHousehold } = require('../utils/household');
const { ensureMealImage } = require('../utils/defaultMeals');

function buildImageUrl(req, filename) {
  const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
  if (publicBase) return `${publicBase.replace(/\/$/, '')}/uploads/${filename}`;
  try {
    const xfProto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString();
    const xfHostRaw = (req.headers['x-forwarded-host'] || req.headers['host'] || '').toString();
    const xfPort = (req.headers['x-forwarded-port'] || '').toString();
    let host = xfHostRaw;
    let portFromHost = '';
    if (host.includes(':')) {
      const [h, p] = host.split(':');
      host = h;
      portFromHost = p;
    }
    const port = xfPort || portFromHost;
    const isStandardPort = (xfProto === 'https' && port === '443') || (xfProto === 'http' && port === '80');
    const portSuffix = port && !isStandardPort ? `:${port}` : '';
    if (host) return `${xfProto}://${host}${portSuffix}/uploads/${filename}`;
  } catch (_) {}
  return `/api/uploads/${filename}`;
}

function parseMaybeJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}
function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function normalizeStringArray(value) {
  const arr = parseMaybeJson(value, []);
  if (!Array.isArray(arr)) return [];
  return arr.map(v => String(v || '').trim()).filter(Boolean);
}
function normalizeIngredients(value) {
  const arr = parseMaybeJson(value, []);
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return { name: item.trim(), amount: '' };
    return { name: String(item?.name || '').trim(), amount: String(item?.amount || '').trim() };
  }).filter(item => item.name);
}
function normalizeSteps(value) {
  const arr = parseMaybeJson(value, []);
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') return { description: item.trim(), imageUrl: '' };
    return { description: String(item?.description || '').trim(), imageUrl: String(item?.imageUrl || '').trim() };
  }).filter(item => item.description || item.imageUrl);
}
function collectFileUrls(req, field) {
  const files = (req.files && req.files[field]) || [];
  return files.map(file => buildImageUrl(req, file.filename));
}

exports.validateMeal = [
  body('name').notEmpty().withMessage('菜品名称不能为空').isLength({ max: 100 }).withMessage('菜品名称不能超过100个字符'),
  body('description').optional().isLength({ max: 1000 }).withMessage('菜品描述不能超过1000个字符')
];

exports.getAllMeals = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const { search, tag, category, subcategory, difficulty, favorite, page, limit } = req.query;
    const query = { householdId: household._id };
    if (search && String(search).trim()) {
      const rx = { $regex: String(search).trim(), $options: 'i' };
      query.$or = [{ name: rx }, { description: rx }, { tags: rx }, { tips: rx }, { 'ingredients.name': rx }, { 'steps.description': rx }];
    }
    if (tag && String(tag).trim()) query.tags = String(tag).trim();
    if (category && String(category).trim()) query.category = String(category).trim();
    if (subcategory && String(subcategory).trim()) query.subcategory = String(subcategory).trim();
    if (difficulty && String(difficulty).trim()) query.difficulty = String(difficulty).trim();
    if (favorite === 'true') query.favorite = true;

    const pageNum = Number.parseInt(page, 10);
    const limitNumRaw = Number.parseInt(limit, 10);
    const hasPagination = Number.isFinite(pageNum) || Number.isFinite(limitNumRaw);
    if (!hasPagination) return res.status(200).json(await Meal.find(query).sort({ favorite: -1, createdAt: -1 }));
    const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = Math.min(Number.isFinite(limitNumRaw) && limitNumRaw > 0 ? limitNumRaw : 20, 200);
    const total = await Meal.countDocuments(query);
    const meals = await Meal.find(query).sort({ favorite: -1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit);
    res.status(200).json({ data: meals, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) || 1 });
  } catch (error) { logger.error(`获取菜品失败: ${error.message}`); next(error); }
};

exports.getMealCategories = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const rows = await Meal.aggregate([
      { $match: { householdId: household._id } },
      { $group: { _id: { category: { $ifNull: ['$category', ''] }, subcategory: { $ifNull: ['$subcategory', ''] } }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id.category', subcategory: '$_id.subcategory', count: 1 } },
      { $sort: { category: 1, subcategory: 1 } }
    ]);
    res.status(200).json(rows);
  } catch (error) { next(error); }
};

exports.getMealTags = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const tags = await Meal.distinct('tags', { householdId: household._id });
    res.status(200).json((tags || []).filter(t => t && String(t).trim()).map(t => String(t).trim()).sort((a, b) => a.localeCompare(b, 'zh')));
  } catch (error) { next(error); }
};

exports.getMealStats = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const [total, favorites, memories, categories] = await Promise.all([
      Meal.countDocuments({ householdId: household._id }),
      Meal.countDocuments({ householdId: household._id, favorite: true }),
      MealMemory.countDocuments({ householdId: household._id }),
      Meal.aggregate([{ $match: { householdId: household._id } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);
    res.json({ total, favorites, memories, categories });
  } catch (error) { next(error); }
};

exports.getMealById = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '无效的菜品ID' });
    const meal = await Meal.findOne({ _id: req.params.id, householdId: household._id });
    if (!meal) return res.status(404).json({ error: '未找到指定菜品' });
    res.status(200).json(meal);
  } catch (error) { next(error); }
};

function mealPayloadFromRequest(req, existingMeal = null) {
  const body = req.body || {};
  const payload = {
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    category: String(body.category || '').trim(),
    subcategory: String(body.subcategory || '').trim(),
    tags: normalizeStringArray(body.tags),
    ingredients: normalizeIngredients(body.ingredients),
    steps: normalizeSteps(body.steps),
    tips: String(body.tips || '').trim(),
    servingSize: String(body.servingSize || '').trim(),
    prepTime: numberOrZero(body.prepTime),
    cookTime: numberOrZero(body.cookTime),
    difficulty: ['easy', 'medium', 'hard'].includes(body.difficulty) ? body.difficulty : '',
    taste: normalizeStringArray(body.taste),
    spiceLevel: Math.min(numberOrZero(body.spiceLevel), 5),
    source: String(body.source || '').trim(),
    sourcePath: String(body.sourcePath || '').trim(),
    favorite: body.favorite === true || body.favorite === 'true',
    rating: Math.min(numberOrZero(body.rating), 5)
  };
  if (req.files?.image?.[0]) payload.imageUrl = buildImageUrl(req, req.files.image[0].filename);
  else if (body.imageUrl !== undefined) payload.imageUrl = String(body.imageUrl || '').trim();
  else if (existingMeal) payload.imageUrl = existingMeal.imageUrl || '';
  const existingPhotos = body.existingPhotos !== undefined ? normalizeStringArray(body.existingPhotos) : (existingMeal?.photos || []);
  payload.photos = [...existingPhotos, ...collectFileUrls(req, 'photos')];
  const stepIndexes = parseMaybeJson(body.stepImageIndexes, []);
  const stepImages = collectFileUrls(req, 'stepImages');
  if (Array.isArray(stepIndexes) && stepImages.length) {
    stepImages.forEach((url, idx) => {
      const targetIndex = Number(stepIndexes[idx]);
      if (Number.isInteger(targetIndex) && targetIndex >= 0) {
        if (!payload.steps[targetIndex]) payload.steps[targetIndex] = { description: '', imageUrl: '' };
        payload.steps[targetIndex].imageUrl = url;
      }
    });
  }
  return payload;
}

exports.createMeal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid);
    const newMeal = await Meal.create({ ...mealPayloadFromRequest(req), householdId: household._id, createdBy: req.user.uid });
    if (!newMeal.imageUrl) {
      newMeal.imageUrl = ensureMealImage(newMeal);
      newMeal.photos = Array.from(new Set([newMeal.imageUrl, ...(newMeal.photos || [])].filter(Boolean)));
      await newMeal.save();
    }
    res.status(201).json(newMeal);
  } catch (error) { logger.error(`创建菜品失败: ${error.message}`); next(error); }
};

exports.updateMeal = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid);
    const existing = await Meal.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) return res.status(404).json({ error: '未找到指定菜品' });
    const updatedMeal = await Meal.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, mealPayloadFromRequest(req, existing), { new: true, runValidators: true });
    if (!updatedMeal.imageUrl) {
      updatedMeal.imageUrl = ensureMealImage(updatedMeal);
      updatedMeal.photos = Array.from(new Set([updatedMeal.imageUrl, ...(updatedMeal.photos || [])].filter(Boolean)));
      await updatedMeal.save();
    }
    res.status(200).json(updatedMeal);
  } catch (error) { logger.error(`更新菜品失败: ${error.message}`); next(error); }
};

exports.deleteMeal = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const deletedMeal = await Meal.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deletedMeal) return res.status(404).json({ error: '未找到指定菜品' });
    res.status(204).send();
  } catch (error) { next(error); }
};