const Meal = require('../models/mealModel');
const MealMemory = require('../models/memoryModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { ensureUserHousehold } = require('../utils/household');
const { ensureMealImage } = require('../utils/defaultMeals');
const { buildUploadUrl: buildImageUrl } = require('../utils/uploadUrl');

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
async function discardNewUploads(req) {
  const uploadRoot = path.resolve(__dirname, '..', 'uploads');
  const files = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
  await Promise.all(files.map(async file => {
    if (!file?.path || !file?.filename) return;
    const target = path.resolve(file.path);
    if (path.dirname(target) !== uploadRoot || path.basename(target) !== file.filename) return;
    try { await fs.promises.unlink(target); }
    catch (error) { if (error.code !== 'ENOENT') logger.warn(`无法清理未使用的上传文件: ${error.message}`); }
  }));
}
function editVersion(meal) {
  return { revision: meal.editRevision || null, updatedAt: meal.updatedAt ? new Date(meal.updatedAt).toISOString() : null };
}
function presentArchive(meal) {
  const obj = meal?.toObject ? meal.toObject() : meal;
  try { return { ...obj, supportsConditionalArchive: true, archiveVersion: editVersion(obj) }; }
  catch (_) { return { ...obj, supportsConditionalArchive: false, archiveVersion: null }; }
}
function parseEditVersion(value) {
  const version = parseMaybeJson(value, null);
  if (!version || typeof version !== 'object' || Array.isArray(version)) return null;
  if (!Object.prototype.hasOwnProperty.call(version, 'revision') || !Object.prototype.hasOwnProperty.call(version, 'updatedAt')) return null;
  if (version.revision !== null && (typeof version.revision !== 'string' || !version.revision || version.revision.length > 128)) return null;
  if (version.updatedAt !== null && (typeof version.updatedAt !== 'string' || !Number.isFinite(Date.parse(version.updatedAt)))) return null;
  return version;
}
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function isMobileClient(req) {
  return req.headers['x-mobile-client'] === 'eatwhat-flutter';
}
function compactMeal(meal) {
  return {
    _id: meal._id,
    id: meal._id,
    name: meal.name || '',
    imageUrl: meal.imageUrl || '',
    category: meal.category || '',
    tags: (meal.tags || []).slice(0, 3),
    healthTags: (meal.healthTags || []).slice(0, 3),
    ingredients: (meal.ingredients || []).slice(0, 3).map(item => ({ name: item.name || '', amount: item.amount || '' })),
    cookTime: meal.cookTime || 0,
    difficulty: meal.difficulty || '',
    rating: meal.rating || 0,
    favorite: Boolean(meal.favorite)
  };
}

exports.validateMeal = [
  body('name').notEmpty().withMessage('菜品名称不能为空').isLength({ max: 100 }).withMessage('菜品名称不能超过100个字符'),
  body('description').optional().isLength({ max: 1000 }).withMessage('菜品描述不能超过1000个字符')
];

exports.getAllMeals = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const { search, tag, category, subcategory, difficulty, favorite, page, limit, archived } = req.query;
    if (archived !== undefined && archived !== 'true' && archived !== 'false') return res.status(400).json({ error: '归档筛选参数无效' });
    const query = { householdId: household._id, archived: archived === 'true' ? true : { $ne: true } };
    if (search && String(search).trim()) {
      const rx = { $regex: escapeRegExp(String(search).trim()), $options: 'i' };
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
    if (!hasPagination) {
      const rows = await Meal.find(query).sort({ favorite: -1, createdAt: -1, _id: -1 });
      return res.status(200).json(isMobileClient(req) ? rows : rows.map(presentArchive));
    }
    const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const mobile = isMobileClient(req);
    const safeLimit = Math.min(Number.isFinite(limitNumRaw) && limitNumRaw > 0 ? limitNumRaw : 20, mobile ? 12 : 200);
    const total = await Meal.countDocuments(query);
    let mealQuery = Meal.find(query).sort({ favorite: -1, createdAt: -1, _id: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit);
    if (mobile) mealQuery = mealQuery.select('name imageUrl category tags healthTags ingredients cookTime difficulty rating favorite');
    const meals = await mealQuery.lean();
    res.status(200).json({ data: mobile ? meals.map(compactMeal) : meals.map(presentArchive), total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) || 1 });
  } catch (error) { logger.error(`获取菜品失败: ${error.message}`); next(error); }
};

exports.getMealCategories = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const rows = await Meal.aggregate([
      { $match: { householdId: household._id, archived: { $ne: true } } },
      { $group: { _id: { category: { $ifNull: ['$category', ''] }, subcategory: { $ifNull: ['$subcategory', ''] } }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id.category', subcategory: '$_id.subcategory', count: 1 } },
      { $sort: { category: 1, subcategory: 1 } }
    ]);
    res.status(200).json(rows);
  } catch (error) { next(error); }
};

exports.getMealTags = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const tags = await Meal.distinct('tags', { householdId: household._id, archived: { $ne: true } });
    res.status(200).json((tags || []).filter(t => t && String(t).trim()).map(t => String(t).trim()).sort((a, b) => a.localeCompare(b, 'zh')));
  } catch (error) { next(error); }
};

exports.getMealStats = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const [total, favorites, memories, categories] = await Promise.all([
      Meal.countDocuments({ householdId: household._id, archived: { $ne: true } }),
      Meal.countDocuments({ householdId: household._id, favorite: true, archived: { $ne: true } }),
      MealMemory.countDocuments({ householdId: household._id }),
      Meal.aggregate([{ $match: { householdId: household._id, archived: { $ne: true } } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);
    res.json({ total, favorites, memories, categories });
  } catch (error) { next(error); }
};

exports.getMealById = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: '无效的菜品ID' });
    const meal = await Meal.findOne({ _id: req.params.id, householdId: household._id });
    if (!meal) return res.status(404).json({ code: 'MEAL_NOT_FOUND', error: '未找到指定菜品' });
    res.status(200).json({ ...presentArchive(meal), supportsConditionalEdit: true, editVersion: editVersion(meal) });
  } catch (error) { next(error); }
};

exports.archiveCapabilities = (_req, res) => res.json({ supportsMealArchive: true });
exports.setArchived = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: '无效的菜品ID' });
    if (typeof req.body?.archived !== 'boolean') return res.status(400).json({ error: '归档状态无效' });
    const version = parseEditVersion(req.body.expectedEditVersion);
    if (!version) return res.status(400).json({ error: '菜品版本无效，请重新加载' });
    const filter = { _id: req.params.id, householdId: household._id, archived: req.body.archived ? { $ne: true } : true, editRevision: version.revision, updatedAt: version.updatedAt === null ? null : new Date(version.updatedAt) };
    const meal = await Meal.findOneAndUpdate(filter, { archived: req.body.archived }, { new: true, runValidators: true });
    if (!meal) return res.status(409).json({ code: 'MEAL_ARCHIVE_CONFLICT', error: '菜品已变化或不属于当前家庭，请刷新核对' });
    res.json(presentArchive(meal));
  } catch (error) { next(error); }
};

function mealPayloadFromRequest(req, existingMeal = null) {
  const body = req.body || {};
  const hasField = field => Object.prototype.hasOwnProperty.call(body, field);
  const keepString = field => (hasField(field) ? String(body[field] || '').trim() : String(existingMeal?.[field] || '').trim());
  const keepNumber = field => (hasField(field) ? numberOrZero(body[field]) : Number(existingMeal?.[field] || 0));
  const keepStringArray = field => (hasField(field) ? normalizeStringArray(body[field]) : [...(existingMeal?.[field] || [])]);
  const keepIngredients = () => (hasField('ingredients') ? normalizeIngredients(body.ingredients) : [...(existingMeal?.ingredients || [])]);
  const keepSteps = () => (hasField('steps') ? normalizeSteps(body.steps) : [...(existingMeal?.steps || [])]);
  const rawDifficulty = hasField('difficulty') ? body.difficulty : existingMeal?.difficulty;
  const payload = {
    name: keepString('name'),
    description: keepString('description'),
    category: keepString('category'),
    subcategory: keepString('subcategory'),
    tags: keepStringArray('tags'),
    ingredients: keepIngredients(),
    steps: keepSteps(),
    tips: keepString('tips'),
    servingSize: keepString('servingSize'),
    prepTime: keepNumber('prepTime'),
    cookTime: keepNumber('cookTime'),
    difficulty: ['easy', 'medium', 'hard'].includes(rawDifficulty) ? rawDifficulty : '',
    taste: keepStringArray('taste'),
    healthTags: keepStringArray('healthTags'),
    spiceLevel: Math.min(keepNumber('spiceLevel'), 5),
    source: keepString('source'),
    sourcePath: keepString('sourcePath'),
    favorite: hasField('favorite') ? (body.favorite === true || body.favorite === 'true') : Boolean(existingMeal?.favorite),
    rating: Math.min(keepNumber('rating'), 5)
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
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
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
    if (!errors.isEmpty()) { await discardNewUploads(req); return res.status(400).json({ errors: errors.array() }); }
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const conditional = Object.prototype.hasOwnProperty.call(req.body, 'expectedEditVersion');
    const version = conditional ? parseEditVersion(req.body.expectedEditVersion) : null;
    if (conditional && !version) { await discardNewUploads(req); return res.status(400).json({ error: '菜谱版本无效，请重新加载' }); }
    const existing = await Meal.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) { await discardNewUploads(req); return res.status(404).json({ error: '未找到指定菜品' }); }
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) {
      filter.editRevision = version.revision;
      filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt);
    }
    let updatedMeal = await Meal.findOneAndUpdate(filter, mealPayloadFromRequest(req, existing), { new: true, runValidators: true });
    if (!updatedMeal) { await discardNewUploads(req); return res.status(409).json({ code: 'MEAL_CONFLICT', error: '菜谱已被更新，请核对最新内容' }); }
    if (!updatedMeal.imageUrl) {
      const fallbackUrl = ensureMealImage(updatedMeal);
      const fallbackPhotos = Array.from(new Set([fallbackUrl, ...(updatedMeal.photos || [])].filter(Boolean)));
      const withFallback = await Meal.findOneAndUpdate(
        { _id: updatedMeal._id, householdId: household._id, editRevision: updatedMeal.editRevision, updatedAt: updatedMeal.updatedAt },
        { $set: { imageUrl: fallbackUrl, photos: fallbackPhotos } },
        { new: true, runValidators: true }
      );
      updatedMeal = withFallback || await Meal.findOne({ _id: updatedMeal._id, householdId: household._id }) || updatedMeal;
    }
    res.status(200).json(updatedMeal);
  } catch (error) { logger.error(`更新菜品失败: ${error.message}`); next(error); }
};

exports.deleteMeal = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const deletedMeal = await Meal.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deletedMeal) return res.status(404).json({ error: '未找到指定菜品' });
    res.status(204).send();
  } catch (error) { next(error); }
};
