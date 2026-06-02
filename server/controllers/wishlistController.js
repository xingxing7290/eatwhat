const WishlistItem = require('../models/wishlistModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');

function populateQuery(q) {
  return q.populate('mealId').populate('createdBy', 'username displayName avatarUrl').populate('votes', 'username displayName avatarUrl');
}
function decorateItem(item, uid) {
  const obj = item?.toObject ? item.toObject() : item;
  if (!obj) return obj;
  const current = String(uid || '');
  obj.createdByPartner = !!obj.createdBy && String(obj.createdBy._id || obj.createdBy) !== current;
  obj.votedByMe = (obj.votes || []).some(v => String(v._id || v) === current);
  obj.votedByPartner = (obj.votes || []).some(v => String(v._id || v) !== current);
  obj.partnerSignal = obj.createdByPartner || obj.votedByPartner;
  return obj;
}
function decorateList(items, uid) { return (items || []).map(item => decorateItem(item, uid)); }

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const query = { householdId: household._id };
    if (req.query.status) query.status = req.query.status;
    const items = await populateQuery(WishlistItem.find(query).sort({ status: 1, priority: -1, createdAt: -1 }));
    res.json(decorateList(items, req.user.uid));
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
    res.status(201).json(decorateItem(await populateQuery(WishlistItem.findById(item._id)), req.user.uid));
  } catch (err) { next(err); }
};

exports.vote = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const item = await WishlistItem.findOne({ _id: req.params.id, householdId: household._id });
    if (!item) return res.status(404).json({ error: '未找到想吃项' });
    const uid = String(req.user.uid);
    const exists = item.votes.some(v => String(v) === uid);
    item.votes = exists ? item.votes.filter(v => String(v) !== uid) : [...item.votes, req.user.uid];
    await item.save();
    res.json(decorateItem(await populateQuery(WishlistItem.findById(item._id)), req.user.uid));
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const status = ['open', 'planned', 'done'].includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ error: '状态无效' });
    const item = await populateQuery(WishlistItem.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, { status }, { new: true }));
    if (!item) return res.status(404).json({ error: '未找到想吃项' });
    res.json(decorateItem(item, req.user.uid));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const deleted = await WishlistItem.findOneAndDelete({ _id: req.params.id, householdId: household._id });
    if (!deleted) return res.status(404).json({ error: '未找到想吃项' });
    res.status(204).send();
  } catch (err) { next(err); }
};