const WishlistItem = require('../models/wishlistModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');
const mongoose = require('mongoose');
const { hasSafeMealWishIndex, isMealWishDuplicate } = require('../utils/mealWishIndex');

function populateQuery(q, householdId) {
  return q.populate({ path: 'mealId', match: { householdId } }).populate({ path: 'createdBy', match: { householdId }, select: 'username displayName avatarUrl' }).populate({ path: 'votes', match: { householdId }, select: 'username displayName avatarUrl' });
}
function decorateItem(item, uid) {
  const obj = item?.toObject ? item.toObject() : item;
  if (!obj) return obj;
  const current = String(uid || '');
  obj.createdByPartner = !!obj.createdBy && String(obj.createdBy._id || obj.createdBy) !== current;
  obj.votedByMe = (obj.votes || []).some(v => String(v._id || v) === current);
  obj.votedByPartner = (obj.votes || []).some(v => String(v._id || v) !== current);
  obj.partnerSignal = obj.createdByPartner || obj.votedByPartner;
  obj.supportsSafeMealLink = true;
  obj.supportsSetVote = true;
  return obj;
}
function decorateList(items, uid) { return (items || []).map(item => decorateItem(item, uid)); }

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
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

// The unique partial index must be installed explicitly before this endpoint
// can promise that concurrent requests from different devices are safe.
exports.createMealWish = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
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
    const { household } = await ensureUserHousehold(req.user.uid);
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
    const { household } = await ensureUserHousehold(req.user.uid);
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
    const { household } = await ensureUserHousehold(req.user.uid);
    if (typeof req.body?.voted !== 'boolean') return res.status(400).json({ error: '投票状态无效' });
    const update = req.body.voted ? { $addToSet: { votes: req.user.uid } } : { $pull: { votes: req.user.uid } };
    const item = await populateQuery(WishlistItem.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, update, { new: true }), household._id);
    if (!item) return res.status(404).json({ error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const status = ['open', 'planned', 'done'].includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: '状态无效' });
    const item = await populateQuery(WishlistItem.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, { status }, { new: true }), household._id);
    if (!item) return res.status(404).json({ error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) {
    if (isMealWishDuplicate(err)) return res.status(409).json({ code: 'WISH_ALREADY_OPEN', error: '这道菜已在想吃清单中，请刷新查看' });
    next(err);
  }
};

exports.attachMeal = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
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
    const { household } = await ensureUserHousehold(req.user.uid);
    const deleted = await WishlistItem.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deleted) return res.status(404).json({ error: '未找到想吃项' });
    res.status(204).send();
  } catch (err) { next(err); }
};
