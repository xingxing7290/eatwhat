const AnniversaryMenu = require('../models/anniversaryMenuModel');
const Meal = require('../models/mealModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { ensureUserHousehold } = require('../utils/household');
const { dateKey, parseDateKey } = require('../utils/week');

function buildImageUrl(req, filename) {
  const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
  return publicBase ? `${publicBase.replace(/\/$/, '')}/uploads/${filename}` : `/api/uploads/${filename}`;
}
function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (_) { const error = new Error('列表数据格式无效'); error.status = 400; throw error; }
}
function photoUrls(req) {
  return (req.files || []).map(file => buildImageUrl(req, file.filename));
}
function normalizeMeals(value) {
  const input = parseJson(value, {});
  if (!input || typeof input !== 'object' || Array.isArray(input)) { const error = new Error('菜品列表格式无效'); error.status = 400; throw error; }
  const out = { breakfast: [], lunch: [], dinner: [] };
  for (const key of Object.keys(out)) {
    if (input[key] !== undefined && (!Array.isArray(input[key]) || input[key].some(id => typeof id !== 'string'))) { const error = new Error('菜品列表格式无效'); error.status = 400; throw error; }
    out[key] = (input[key] || []).filter(Boolean);
  }
  return out;
}
function normalizePhotos(value) {
  const photos = parseJson(value, []);
  if (!Array.isArray(photos) || photos.some(photo => typeof photo !== 'string')) { const error = new Error('照片列表格式无效'); error.status = 400; throw error; }
  return photos.filter(Boolean);
}
function allMealIds(meals) {
  return ['breakfast', 'lunch', 'dinner'].flatMap(key => meals[key] || []);
}
function populateQuery(q, householdId) {
  for (const type of ['breakfast', 'lunch', 'dinner']) q = q.populate({ path: `meals.${type}`, match: { householdId } });
  return q.populate('createdBy', 'username displayName avatarUrl');
}
async function assertMealsInHousehold(meals, householdId) {
  const ids = [...new Set(allMealIds(meals).map(String))];
  if (ids.some(id => !mongoose.isValidObjectId(id))) return false;
  if (!ids.length) return true;
  const count = await Meal.countDocuments({ _id: { $in: ids }, householdId });
  return count === ids.length;
}
function validDate(value) { const parsed = parseDateKey(value); return !!parsed && dateKey(parsed) === value; }
function present(item) {
  return { ...item.toObject(), supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: { revision: item.editRevision || null, updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null } };
}
function parseEditVersion(value) {
  const version = parseJson(value, null);
  if (!version || typeof version !== 'object' || Array.isArray(version)) return null;
  if (!Object.prototype.hasOwnProperty.call(version, 'revision') || !Object.prototype.hasOwnProperty.call(version, 'updatedAt')) return null;
  if (version.revision !== null && (typeof version.revision !== 'string' || !version.revision || version.revision.length > 128)) return null;
  if (version.updatedAt !== null && (typeof version.updatedAt !== 'string' || !Number.isFinite(Date.parse(version.updatedAt)))) return null;
  return version;
}
async function discardNewUploads(req) {
  const root = path.resolve(__dirname, '..', 'uploads');
  await Promise.all((Array.isArray(req.files) ? req.files : []).map(async file => {
    if (!file?.path || !file?.filename) return;
    const target = path.resolve(file.path);
    if (path.dirname(target) !== root || path.basename(target) !== file.filename) return;
    try { await fs.promises.unlink(target); } catch (error) { if (error.code !== 'ENOENT') logger.warn(`无法清理未使用的纪念日照片: ${error.message}`); }
  }));
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const items = await populateQuery(AnniversaryMenu.find({ householdId: household._id }).sort({ date: 1, createdAt: -1 }), household._id);
    res.json(items.map(present));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  let writeStarted = false;
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const date = String(body.date || '').trim();
    if (!title || title.length > 100 || !validDate(date)) { await discardNewUploads(req); return res.status(400).json({ error: '请填写有效标题和日期' }); }
    const meals = normalizeMeals(body.meals);
    if (!(await assertMealsInHousehold(meals, household._id))) { await discardNewUploads(req); return res.status(400).json({ error: '包含无效菜品' }); }
    writeStarted = true;
    const item = await AnniversaryMenu.create({
      householdId: household._id,
      title,
      date,
      description: String(body.description || '').trim(),
      theme: String(body.theme || '').trim(),
      photos: photoUrls(req),
      meals,
      createdBy: req.user.uid
    });
    res.status(201).json(present(await populateQuery(AnniversaryMenu.findById(item._id), household._id)));
  } catch (err) { if (!writeStarted) await discardNewUploads(req); next(err); }
};

exports.update = async (req, res, next) => {
  let writeStarted = false;
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const existing = await AnniversaryMenu.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) { await discardNewUploads(req); return res.status(404).json({ error: '未找到纪念日菜单' }); }
    const body = req.body || {};
    const has = key => Object.prototype.hasOwnProperty.call(body, key);
    const conditional = has('expectedEditVersion');
    const version = conditional ? parseEditVersion(body.expectedEditVersion) : null;
    if (conditional && !version) { await discardNewUploads(req); return res.status(400).json({ error: '菜单版本无效，请重新加载' }); }
    const mealInput = has('meals') ? parseJson(body.meals, {}) : null;
    const meals = has('meals') ? normalizeMeals(mealInput) : null;
    if (meals && !(await assertMealsInHousehold(meals, household._id))) { await discardNewUploads(req); return res.status(400).json({ error: '包含无效菜品' }); }
    if (has('title') && (!String(body.title || '').trim() || String(body.title).trim().length > 100)) { await discardNewUploads(req); return res.status(400).json({ error: '标题无效' }); }
    if (has('date') && !validDate(String(body.date || '').trim())) { await discardNewUploads(req); return res.status(400).json({ error: '日期无效' }); }
    const update = {};
    for (const field of ['title', 'date', 'description', 'theme']) if (has(field)) update[field] = String(body[field] || '').trim();
    if (meals) for (const type of ['breakfast', 'lunch', 'dinner']) if (Object.prototype.hasOwnProperty.call(mealInput, type)) update[`meals.${type}`] = meals[type];
    if (has('existingPhotos') || photoUrls(req).length) update.photos = [...(has('existingPhotos') ? normalizePhotos(body.existingPhotos) : existing.photos), ...photoUrls(req)];
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) { filter.editRevision = version.revision; filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt); }
    writeStarted = true;
    const item = await populateQuery(AnniversaryMenu.findOneAndUpdate(
      filter,
      update,
      { new: true, runValidators: true }
    ), household._id);
    if (!item) { await discardNewUploads(req); return res.status(409).json({ code: 'ANNIVERSARY_CONFLICT', error: '菜单已更新或删除，请核对最新内容' }); }
    res.json(present(item));
  } catch (err) { if (!writeStarted) await discardNewUploads(req); next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const conditional = Object.prototype.hasOwnProperty.call(req.query || {}, 'expectedEditVersion');
    const version = conditional ? parseEditVersion(req.query.expectedEditVersion) : null;
    if (conditional && !version) return res.status(400).json({ error: '菜单版本无效，请重新加载' });
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) { filter.editRevision = version.revision; filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt); }
    const deleted = await AnniversaryMenu.findOneAndDelete(filter);
    if (!deleted) return conditional ? res.status(409).json({ code: 'ANNIVERSARY_CONFLICT', error: '菜单已更新或删除，请核对最新内容' }) : res.status(404).json({ error: '未找到纪念日菜单' });
    res.status(204).send();
  } catch (err) { next(err); }
};
