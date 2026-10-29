const MealImageIssue = require('../models/mealImageIssueModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');

function populate(q, householdId) {
  return q.populate({ path: 'mealId', match: { householdId } })
    .populate({ path: 'createdBy', match: { householdId }, select: 'username displayName avatarUrl' })
    .populate({ path: 'resolvedBy', match: { householdId }, select: 'username displayName avatarUrl' });
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const query = { householdId: household._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.page !== undefined || req.query.limit !== undefined) {
      const parsePositive = (value, fallback, maximum) => {
        if (value === undefined) return fallback;
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
        const parsed = Number(value);
        return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
      };
      const page = parsePositive(req.query.page, 1, 10000);
      const limit = parsePositive(req.query.limit, 20, 100);
      if (page === null || limit === null) return res.status(400).json({ error: '图片反馈分页参数无效' });
      const [total, items] = await Promise.all([
        MealImageIssue.countDocuments(query),
        populate(MealImageIssue.find(query).sort({ status: 1, createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), household._id)
      ]);
      return res.json({ supportsImageIssuePagination: true, householdId: String(household._id), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), items });
    }
    res.json(await populate(MealImageIssue.find(query).sort({ status: 1, createdAt: -1, _id: -1 }).limit(200), household._id));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const meal = await Meal.findOne({ _id: req.body.mealId, householdId: household._id });
    if (!meal) return res.status(400).json({ error: '菜品不存在' });
    const issue = await MealImageIssue.create({
      householdId: household._id,
      mealId: meal._id,
      issueType: ['wrong_image', 'missing_image', 'low_quality', 'other'].includes(req.body.issueType) ? req.body.issueType : 'wrong_image',
      note: String(req.body.note || '').trim(),
      createdBy: req.user.uid
    });
    res.status(201).json(await populate(MealImageIssue.findById(issue._id), household._id));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const update = {};
    if (req.body.status && ['open', 'fixed', 'ignored'].includes(req.body.status)) {
      update.status = req.body.status;
      update.resolvedBy = req.user.uid;
      update.resolvedAt = new Date();
    }
    if (req.body.note !== undefined) update.note = String(req.body.note || '').trim();
    const issue = await populate(MealImageIssue.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, update, { new: true }), household._id);
    if (!issue) return res.status(404).json({ error: '图片问题不存在' });
    res.json(issue);
  } catch (err) { next(err); }
};
