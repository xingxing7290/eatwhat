const WishlistItem = require('../models/wishlistModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');
const mongoose = require('mongoose');
const { hasSafeMealWishIndex, isMealWishDuplicate } = require('../utils/mealWishIndex');

function populateQuery(q, householdId) {
  return q.populate({ path: 'mealId', match: { householdId } }).populate({ path: 'createdBy', match: { householdId }, select: 'username displayName avatarUrl' }).populate({ path: 'votes', match: { householdId }, select: 'username displayName avatarUrl' });
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
function addVersionFilter(filter, version) {
  filter.editRevision = version.revision;
  filter.updatedAt = version.updatedAt === null ? null : new Date(version.updatedAt);
}
function decorateItem(item, uid) {
  const obj = item?.toObject ? item.toObject() : item;
  if (!obj) return obj;
  const storedMeal = typeof item?.populated === 'function' ? item.populated('mealId') : obj._hasStoredMealLink;
  obj.mealLinkStatus = obj.mealId ? 'linked' : storedMeal ? 'unavailable' : 'unlinked';
  obj.supportsMealLinkVisibility = true;
  delete obj._hasStoredMealLink;
  const current = String(uid || '');
  obj.createdByPartner = !!obj.createdBy && String(obj.createdBy._id || obj.createdBy) !== current;
  obj.votedByMe = (obj.votes || []).some(v => String(v._id || v) === current);
  obj.votedByPartner = (obj.votes || []).some(v => String(v._id || v) !== current);
  obj.partnerSignal = obj.createdByPartner || obj.votedByPartner;
  obj.supportsSafeMealLink = true;
  obj.supportsSetVote = true;
  const updatedAt = obj.updatedAt ? new Date(obj.updatedAt) : null;
  obj.supportsConditionalActions = !updatedAt || Number.isFinite(updatedAt.getTime());
  obj.supportsWishEdit = obj.supportsConditionalActions;
  obj.editVersion = obj.supportsConditionalActions ? { revision: obj.editRevision || null, updatedAt: updatedAt ? updatedAt.toISOString() : null } : null;
  return obj;
}
function decorateList(items, uid) { return (items || []).map(item => decorateItem(item, uid)); }

const boardStatuses = ['open', 'planned', 'done', 'unknown'];
const boardPriorities = ['high', 'normal', 'low', 'unset'];
const literalRegex = value => new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
async function listBoard(req, res, household) {
  const { page: pageInput = '1', limit: limitInput = '12', search: searchInput = '', status = 'all', priority = 'all' } = req.query;
  if (typeof pageInput !== 'string' || !/^[1-9]\d*$/.test(pageInput) || typeof limitInput !== 'string' || !/^[1-9]\d*$/.test(limitInput) ||
      typeof searchInput !== 'string' || searchInput.length > 100 || typeof status !== 'string' || !['all', ...boardStatuses].includes(status) ||
      typeof priority !== 'string' || !['all', ...boardPriorities].includes(priority)) return res.status(400).json({ error: '想吃清单筛选或分页参数无效' });
  const page = Number(pageInput); const limit = Number(limitInput); const skip = (page - 1) * limit; const search = searchInput.trim();
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || limit > 30 || !Number.isSafeInteger(skip) || skip > 1000000) return res.status(400).json({ error: '想吃清单分页参数无效' });
  const pipeline = [{ $match: { householdId: household._id } }];
  if (search) pipeline.push({ $lookup: {
    from: Meal.collection.name, let: { linkedId: '$mealId' },
    pipeline: [{ $match: { $expr: { $and: [{ $eq: ['$_id', '$$linkedId'] }, { $eq: ['$householdId', household._id] }] } } }, { $project: { name: 1 } }],
    as: '_searchMeal'
  } });
  pipeline.push({ $set: {
    _boardStatus: { $cond: [{ $in: ['$status', ['open', 'planned', 'done']] }, '$status', 'unknown'] },
    _boardPriority: { $cond: [{ $in: ['$priority', boardPriorities.slice(0, 3)] }, '$priority', 'unset'] },
    _boardRank: { $switch: { branches: [{ case: { $eq: ['$priority', 'high'] }, then: 2 }, { case: { $eq: ['$priority', 'low'] }, then: 0 }], default: 1 } },
    _boardOrder: { $switch: { branches: [{ case: { $eq: ['$status', 'open'] }, then: 0 }, { case: { $eq: ['$status', 'planned'] }, then: 1 }, { case: { $eq: ['$status', 'done'] }, then: 2 }], default: 3 } }
  } });
  const match = {};
  if (status !== 'all') match._boardStatus = status;
  if (priority !== 'all') match._boardPriority = priority;
  if (search) { const regex = literalRegex(search); match.$or = [{ title: regex }, { note: regex }, { category: regex }, { '_searchMeal.name': regex }]; }
  pipeline.push({ $facet: {
    rows: [{ $match: match }, { $sort: { _boardOrder: 1, _boardRank: -1, createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: limit }, { $project: { _boardStatus: 0, _boardPriority: 0, _boardRank: 0, _boardOrder: 0, _searchMeal: 0 } }],
    matched: [{ $match: match }, { $group: { _id: '$_boardStatus', count: { $sum: 1 } } }],
    totals: [{ $group: { _id: '$_boardStatus', count: { $sum: 1 } } }]
  } });
  const [result] = await WishlistItem.aggregate(pipeline);
  const counts = rows => Object.fromEntries(boardStatuses.map(key => [key, rows.find(row => row._id === key)?.count || 0]));
  const matched = counts(result?.matched || []); const totals = counts(result?.totals || []);
  const rows = result?.rows || [];
  for (const row of rows) row._hasStoredMealLink = !!row.mealId;
  await WishlistItem.populate(rows, [
    { path: 'mealId', match: { householdId: household._id } },
    { path: 'createdBy', match: { householdId: household._id }, select: 'username displayName avatarUrl' },
    { path: 'votes', match: { householdId: household._id }, select: 'username displayName avatarUrl' }
  ]);
  return res.json({ supportsWishlistBoard: true, page, limit, search, status, priority, matched, totals, total: Object.values(matched).reduce((sum, count) => sum + count, 0), items: decorateList(rows, req.user.uid) });
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (req.query.view === 'board') return await listBoard(req, res, household);
    const query = { householdId: household._id };
    if (req.query.status) query.status = req.query.status;
    const items = await populateQuery(WishlistItem.find(query).sort({ status: 1, priority: -1, createdAt: -1 }), household._id);
    const decorated = decorateList(items, req.user.uid);
    if (req.query.includeCapabilities === 'true') {
      const supportsAtomicMealWish = await hasSafeMealWishIndex(WishlistItem.collection);
      return res.json({ items: decorated, supportsAtomicMealWish });
    }
    res.json(decorated);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: '想吃编号无效' });
    const item = await populateQuery(WishlistItem.findOne({ _id: req.params.id, householdId: household._id }), household._id);
    if (!item) return res.status(404).json({ code: 'WISH_NOT_FOUND', error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

// The unique partial index must be installed explicitly before this endpoint
// can promise that concurrent requests from different devices are safe.
exports.createMealWish = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const mealId = req.body?.mealId;
    if (typeof mealId !== 'string' || !/^[a-f\d]{24}$/i.test(mealId) || !mongoose.isValidObjectId(mealId)) return res.status(400).json({ error: '菜品编号无效' });
    if (!await hasSafeMealWishIndex(WishlistItem.collection)) {
      return res.status(503).json({ code: 'MEAL_WISH_INDEX_REQUIRED', error: '安全点菜尚未启用，请联系管理员' });
    }
    const meal = await Meal.findOne({ _id: mealId, householdId: household._id });
    if (!meal) return res.status(404).json({ error: '菜品不存在' });
    let item;
    let alreadyExists = false;
    try {
      item = await WishlistItem.create({ householdId: household._id, title: meal.name, mealId: meal._id, category: meal.category || '', priority: 'normal', status: 'open', votes: [req.user.uid], createdBy: req.user.uid });
    } catch (err) {
      if (!isMealWishDuplicate(err)) throw err;
      item = await WishlistItem.findOne({ householdId: household._id, mealId: meal._id, status: 'open' });
      if (!item) return res.status(409).json({ code: 'MEAL_WISH_CHANGED', error: '清单状态刚刚发生变化，请刷新后再试' });
      alreadyExists = true;
    }
    const populated = await populateQuery(WishlistItem.findById(item._id), household._id);
    if (!populated || populated.status !== 'open') return res.status(409).json({ code: 'MEAL_WISH_CHANGED', error: '清单状态刚刚发生变化，请刷新后再试' });
    res.status(alreadyExists ? 200 : 201).json({ item: decorateItem(populated, req.user.uid), alreadyExists });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ error: '想吃内容不能为空' });
    const mealId = req.body.mealId || null;
    if (mealId) {
      const meal = await Meal.findOne({ _id: mealId, householdId: household._id });
      if (!meal) return res.status(400).json({ error: '菜品不存在' });
    }
    const item = await WishlistItem.create({
      householdId: household._id,
      title,
      note: String(req.body.note || '').trim(),
      mealId,
      category: String(req.body.category || '').trim(),
      priority: ['low', 'normal', 'high'].includes(req.body.priority) ? req.body.priority : 'normal',
      status: 'open',
      votes: [req.user.uid],
      createdBy: req.user.uid
    });
    res.status(201).json(decorateItem(await populateQuery(WishlistItem.findById(item._id), household._id), req.user.uid));
  } catch (err) {
    if (isMealWishDuplicate(err)) return res.status(409).json({ code: 'WISH_ALREADY_OPEN', error: '这道菜已在想吃清单中，请刷新查看' });
    next(err);
  }
};

exports.vote = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const base = { _id: req.params.id, householdId: household._id };
    let item = await populateQuery(WishlistItem.findOneAndUpdate({ ...base, votes: { $ne: req.user.uid } }, { $addToSet: { votes: req.user.uid } }, { new: true }), household._id);
    if (!item) item = await populateQuery(WishlistItem.findOneAndUpdate({ ...base, votes: req.user.uid }, { $pull: { votes: req.user.uid } }, { new: true }), household._id);
    if (!item) {
      if (await WishlistItem.exists(base)) return res.status(409).json({ code: 'VOTE_CHANGED', error: '投票状态刚刚发生变化，请刷新后查看' });
      return res.status(404).json({ error: '未找到想吃项' });
    }
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

exports.setVote = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (typeof req.body?.voted !== 'boolean') return res.status(400).json({ error: '投票状态无效' });
    const update = req.body.voted ? { $addToSet: { votes: req.user.uid } } : { $pull: { votes: req.user.uid } };
    const item = await populateQuery(WishlistItem.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, update, { new: true }), household._id);
    if (!item) return res.status(404).json({ error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

exports.updateDetails = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const body = req.body || {};
    const version = parseEditVersion(body.expectedEditVersion);
    if (!version) return res.status(400).json({ error: '想吃记录版本无效，请重新加载' });
    const fields = ['title', 'note', 'category', 'priority'];
    if (Object.keys(body).some(key => key !== 'expectedEditVersion' && !fields.includes(key))) return res.status(400).json({ error: '包含不支持修改的字段' });
    const update = {};
    for (const key of fields) {
      if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
      if (typeof body[key] !== 'string') return res.status(400).json({ error: '想吃内容格式无效' });
      update[key] = body[key].trim();
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: '没有可保存的修改' });
    if (Object.prototype.hasOwnProperty.call(update, 'title') && (!update.title || update.title.length > 100)) return res.status(400).json({ error: '想吃内容不能为空且不能超过 100 字' });
    if (Object.prototype.hasOwnProperty.call(update, 'priority') && !['low', 'normal', 'high'].includes(update.priority)) return res.status(400).json({ error: '优先级无效' });
    const filter = { _id: req.params.id, householdId: household._id };
    addVersionFilter(filter, version);
    const item = await populateQuery(WishlistItem.findOneAndUpdate(filter, update, { new: true, runValidators: true }), household._id);
    if (!item) return res.status(409).json({ code: 'WISH_CONFLICT', error: '想吃记录已修改或删除，请刷新核对' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const status = ['open', 'planned', 'done'].includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: '状态无效' });
    const conditional = Object.prototype.hasOwnProperty.call(req.body, 'expectedEditVersion');
    const version = conditional ? parseEditVersion(req.body.expectedEditVersion) : null;
    if (conditional && !version) return res.status(400).json({ error: '想吃记录版本无效，请重新加载' });
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) addVersionFilter(filter, version);
    const item = await populateQuery(WishlistItem.findOneAndUpdate(filter, { status }, { new: true }), household._id);
    if (!item) return conditional ? res.status(409).json({ code: 'WISH_CONFLICT', error: '想吃记录已修改或删除，请刷新核对' }) : res.status(404).json({ error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) {
    if (isMealWishDuplicate(err)) return res.status(409).json({ code: 'WISH_ALREADY_OPEN', error: '这道菜已在想吃清单中，请刷新查看' });
    next(err);
  }
};

exports.attachMeal = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const mealId = req.body.mealId || null;
    if (!mealId) return res.status(400).json({ error: '\u83dc\u54c1\u4e0d\u80fd\u4e3a\u7a7a' });
    const meal = await Meal.findOne({ _id: mealId, householdId: household._id });
    if (!meal) return res.status(400).json({ error: '\u83dc\u54c1\u4e0d\u5b58\u5728' });
    const onlyIfUnlinked = req.body.onlyIfUnlinked === true;
    const filter = { _id: req.params.id, householdId: household._id };
    if (onlyIfUnlinked) filter.mealId = null;
    const item = await populateQuery(WishlistItem.findOneAndUpdate(
      filter,
      onlyIfUnlinked ? { mealId } : { mealId, status: 'open' },
      { new: true }
    ), household._id);
    if (!item) {
      if (onlyIfUnlinked && await WishlistItem.exists({ _id: req.params.id, householdId: household._id })) {
        return res.status(409).json({ code: 'WISH_ALREADY_LINKED', error: '这条想吃已关联菜谱，请刷新后查看' });
      }
      return res.status(404).json({ error: '\u672a\u627e\u5230\u60f3\u5403\u9879' });
    }
    res.json(decorateItem(item, req.user.uid));
  } catch (err) {
    if (isMealWishDuplicate(err)) return res.status(409).json({ code: 'WISH_ALREADY_OPEN', error: '这道菜已在想吃清单中，请刷新查看' });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const conditional = Object.prototype.hasOwnProperty.call(req.query || {}, 'expectedEditVersion');
    const version = conditional ? parseEditVersion(req.query.expectedEditVersion) : null;
    if (conditional && !version) return res.status(400).json({ error: '想吃记录版本无效，请重新加载' });
    const filter = { _id: req.params.id, householdId: household._id };
    if (conditional) addVersionFilter(filter, version);
    const deleted = await WishlistItem.findOneAndDelete(filter);
    if (!deleted) return conditional ? res.status(409).json({ code: 'WISH_CONFLICT', error: '想吃记录已修改或删除，请刷新核对' }) : res.status(404).json({ error: '未找到想吃项' });
    res.status(204).send();
  } catch (err) { next(err); }
};
