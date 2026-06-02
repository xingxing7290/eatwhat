const MealImageIssue = require('../models/mealImageIssueModel');
const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');

function populate(q) { return q.populate('mealId').populate('createdBy', 'username displayName avatarUrl').populate('resolvedBy', 'username displayName avatarUrl'); }

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const query = { householdId: household._id };
    if (req.query.status) query.status = req.query.status;
    res.json(await populate(MealImageIssue.find(query).sort({ status: 1, createdAt: -1 }).limit(200)));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const meal = await Meal.findOne({ _id: req.body.mealId, householdId: household._id });
    if (!meal) return res.status(400).json({ error: '菜品不存在' });
    const issue = await MealImageIssue.create({
      householdId: household._id,
      mealId: meal._id,
      issueType: ['wrong_image', 'missing_image', 'low_quality', 'other'].includes(req.body.issueType) ? req.body.issueType : 'wrong_image',
      note: String(req.body.note || '').trim(),
      createdBy: req.user.uid
    });
    res.status(201).json(await populate(MealImageIssue.findById(issue._id)));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const update = {};
    if (req.body.status && ['open', 'fixed', 'ignored'].includes(req.body.status)) {
      update.status = req.body.status;
      update.resolvedBy = req.user.uid;
      update.resolvedAt = new Date();
    }
    if (req.body.note !== undefined) update.note = String(req.body.note || '').trim();
    const issue = await populate(MealImageIssue.findOneAndUpdate({ _id: req.params.id, householdId: household._id }, update, { new: true }));
    if (!issue) return res.status(404).json({ error: '图片问题不存在' });
    res.json(issue);
  } catch (err) { next(err); }
};
