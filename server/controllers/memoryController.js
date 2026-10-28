const MealMemory = require('../models/memoryModel');
const Meal = require('../models/mealModel');
const User = require('../models/userModel');
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
function stringArray(value) {
  if (value === undefined || value === null || value === '') return [];
  let arr = value;
  try { if (typeof value === 'string') arr = JSON.parse(value); } catch (_) { const error = new Error('列表数据格式无效'); error.status = 400; throw error; }
  if (!Array.isArray(arr) || arr.some(item => typeof item !== 'string')) { const error = new Error('列表数据格式无效'); error.status = 400; throw error; }
  return arr.filter(Boolean);
}
function photoUrls(req) {
  return (req.files || []).map(file => buildImageUrl(req, file.filename));
}
function populateQuery(q, householdId) {
  return q.populate({ path: 'mealIds', match: { householdId } }).populate('createdBy', 'username displayName avatarUrl').populate({ path: 'participants', match: { householdId }, select: 'username displayName avatarUrl' });
}
function validDate(value) { const parsed = parseDateKey(value); return !!parsed && dateKey(parsed) === value; }
function present(item) {
  return { ...item.toObject(), supportsConditionalEdit: true, supportsConditionalDelete: true, editVersion: { revision: item.editRevision || null, updatedAt: item.updatedAt ? item.updatedAt.toISOString() : null } };
}
function parseEditVersion(value) {
  let version = value;
  try { if (typeof value === 'string') version = JSON.parse(value); } catch (_) { return null; }
  if (!version || typeof version !== 'object' || Array.isArray(version)) return null;
  if (!Object.prototype.hasOwnProperty.call(version, 'revision') || !Object.prototype.hasOwnProperty.call(version, 'updatedAt')) return null;
  if (version.revision !== null && (typeof version.revision !== 'string' || !version.revision || version.revision.length > 128)) return null;
  if (version.updatedAt !== null && (typeof version.updatedAt !== 'string' || !Number.isFinite(Date.parse(version.updatedAt)))) return null;
  return version;
}
async function referencesValid(mealIds, participants, householdId) {
  if ([...mealIds, ...participants].some(id => !mongoose.isValidObjectId(id))) return false;
  const [meals, users] = await Promise.all([
    mealIds.length ? Meal.countDocuments({ _id: { $in: mealIds }, householdId }) : 0,
    participants.length ? User.countDocuments({ _id: { $in: participants }, householdId }) : 0
  ]);
  return meals === mealIds.length && users === participants.length;
}
async function discardNewUploads(req) {
  const root = path.resolve(__dirname, '..', 'uploads');
  await Promise.all((Array.isArray(req.files) ? req.files : []).map(async file => {
    if (!file?.path || !file?.filename) return;
    const target = path.resolve(file.path);
    if (path.dirname(target) !== root || path.basename(target) !== file.filename) return;
    try { await fs.promises.unlink(target); } catch (error) { if (error.code !== 'ENOENT') logger.warn(`无法清理未使用的回忆照片: ${error.message}`); }
  }));
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const query = { householdId: household._id };
    if (req.query.date) { if (typeof req.query.date !== 'string' || !validDate(req.query.date)) return res.status(400).json({ error: '日期无效' }); query.date = req.query.date; }
    if (req.query.month) { if (typeof req.query.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month)) return res.status(400).json({ error: '月份无效' }); query.date = { $regex: `^${req.query.month}` }; }
    if (req.query.mealId) { if (typeof req.query.mealId !== 'string' || !mongoose.isValidObjectId(req.query.mealId)) return res.status(400).json({ error: '菜品无效' }); query.mealIds = req.query.mealId; }
    const memories = await populateQuery(MealMemory.find(query).sort({ date: -1, createdAt: -1 }).limit(200), household._id);
    res.json(memories.map(present));
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: '回忆编号无效' });
    const memory = await populateQuery(MealMemory.findOne({ _id: req.params.id, householdId: household._id }), household._id);
    if (!memory) return res.status(404).json({ code: 'MEMORY_NOT_FOUND', error: '未找到回忆记录' });
    res.json(present(memory));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  let writeStarted = false;
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const body = req.body || {};
    const mealIds = stringArray(body.mealIds);
    const participants = stringArray(body.participants);
    if (!await referencesValid(mealIds, participants, household._id)) { await discardNewUploads(req); return res.status(400).json({ error: '包含无效菜品或家庭成员' }); }
    const date = String(body.date || '').trim();
    if (!validDate(date)) { await discardNewUploads(req); return res.status(400).json({ error: '日期无效，请使用 YYYY-MM-DD' }); }
    if (body.mealType && !['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(body.mealType)) { await discardNewUploads(req); return res.status(400).json({ error: '餐次无效' }); }
    const photos = [...stringArray(body.existingPhotos), ...photoUrls(req)];
    writeStarted = true;
    const memory = await MealMemory.create({
      householdId: household._id,
      date,
      mealType: body.mealType || 'other',
      title: String(body.title || '').trim(),
      note: String(body.note || '').trim(),
      mood: String(body.mood || '').trim(),
      rating: Math.max(0, Math.min(Number(body.rating) || 0, 5)),
      actualCookTime: Math.max(Number(body.actualCookTime) || 0, 0),
      nextImprovement: String(body.nextImprovement || '').trim(),
      photos,
      mealIds,
      participants,
      createdBy: req.user.uid
    });
    res.status(201).json(present(await populateQuery(MealMemory.findById(memory._id), household._id)));
  } catch (err) { if (!writeStarted) await discardNewUploads(req); next(err); }
};

exports.update = async (req, res, next) => {
  let writeStarted = false;
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const existing = await MealMemory.findOne({ _id: req.params.id, householdId: household._id });
    if (!existing) { await discardNewUploads(req); return res.status(404).json({ error: '未找到回忆记录' }); }
    const body = req.body || {};
    const has = key => Object.prototype.hasOwnProperty.call(body, key);
    const conditional = has('expectedEditVersion');
    const version = conditional ? parseEditVersion(body.expectedEditVersion) : null;
    if (conditional && !version) { await discardNewUploads(req); return res.status(400).json({ error: '回忆版本无效，请重新加载' }); }
    const mealIds = has('mealIds') ? stringArray(body.mealIds) : [];
    const participants = has('participants') ? stringArray(body.participants) : [];
    if (!await referencesValid(mealIds, participants, household._id)) { await discardNewUploads(req); return res.status(400).json({ error: '包含无效菜品或家庭成员' }); }
    if (has('date') && !validDate(String(body.date || '').trim())) { await discardNewUploads(req); return res.status(400).json({ error: '日期无效，请使用 YYYY-MM-DD' }); }
    if (has('mealType') && !['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(body.mealType)) { await discardNewUploads(req); return res.status(400).json({ error: '餐次无效' }); }
    const update = {};
    if (has('date')) update.date = String(body.date).trim();
    if (has('mealType')) update.mealType = body.mealType;
    for (const field of ['title', 'note', 'mood', 'nextImprovement']) if (has(field)) update[field] = String(body[field] || '').trim();
    if (has('rating')) update.rating = Math.max(0, Math.min(Number(body.rating) || 0, 5));
    if (has('actualCookTime')) update.actualCookTime = Math.max(Number(body.actualCookTime) || 0, 0);
    if (has('mealIds')) update.mealIds = mealIds;
    if (has('participants')) update.participants = participants;
    if (has('existingPhotos') || photoUrls(req).length) update.photos = [...(has('existingPhotos') ? stringArray(body.existingPhotos) : existing.photos), ...photoUrls(req)];
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) { filter.editRevision = version.revision; filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt); }
    writeStarted = true;
    const memory = await populateQuery(MealMemory.findOneAndUpdate(filter, update, { new: true, runValidators: true }), household._id);
    if (!memory) { await discardNewUploads(req); return res.status(409).json({ code: 'MEMORY_CONFLICT', error: '回忆已更新或删除，请核对最新内容' }); }
    res.json(present(memory));
  } catch (err) { if (!writeStarted) await discardNewUploads(req); next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const conditional = Object.prototype.hasOwnProperty.call(req.query || {}, 'expectedEditVersion');
    const version = conditional ? parseEditVersion(req.query.expectedEditVersion) : null;
    if (conditional && !version) return res.status(400).json({ error: '回忆版本无效，请重新加载' });
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) { filter.editRevision = version.revision; filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt); }
    const deleted = await MealMemory.findOneAndDelete(filter);
    if (!deleted) return conditional ? res.status(409).json({ code: 'MEMORY_CONFLICT', error: '回忆已更新或删除，请核对最新内容' }) : res.status(404).json({ error: '未找到回忆记录' });
    res.status(204).send();
  } catch (err) { next(err); }
};
