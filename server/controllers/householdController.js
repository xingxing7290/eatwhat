const Household = require('../models/householdModel');
const User = require('../models/userModel');
const { ensureUserHousehold, generateInviteCode, householdPayload } = require('../utils/household');
const { toSafeUser } = require('./authController');
const { looksBrokenText } = require('../utils/text');

async function loadHousehold(uid) {
  const { user, household } = await ensureUserHousehold(uid);
  await household.populate({ path: 'members', select: 'username displayName avatarUrl' });
  return { user, household };
}

exports.me = async (req, res, next) => {
  try {
    const { user, household } = await loadHousehold(req.user.uid);
    res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) return res.status(400).json({ error: '\u5c0f\u5bb6\u540d\u79f0\u4e0d\u80fd\u4e3a\u7a7a' });
    if (looksBrokenText(name)) return res.status(400).json({ error: '\u5c0f\u5bb6\u540d\u79f0\u770b\u8d77\u6765\u662f\u4e71\u7801\uff0c\u8bf7\u91cd\u65b0\u8f93\u5165' });
    household.name = name;
    await household.save();
    await household.populate({ path: 'members', select: 'username displayName avatarUrl' });
    res.json({ household: householdPayload(household) });
  } catch (err) { next(err); }
};

exports.refreshInvite = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    household.inviteCode = await generateInviteCode();
    await household.save();
    await household.populate({ path: 'members', select: 'username displayName avatarUrl' });
    res.json({ household: householdPayload(household) });
  } catch (err) { next(err); }
};

exports.join = async (req, res, next) => {
  try {
    const inviteCode = typeof req.body.inviteCode === 'string' ? req.body.inviteCode.trim().toUpperCase() : '';
    if (!inviteCode) return res.status(400).json({ error: '请输入邀请码' });
    const household = await Household.findOne({ inviteCode });
    if (!household) return res.status(404).json({ error: '邀请码无效' });
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (user.householdId && String(user.householdId) !== String(household._id)) {
      await Household.updateOne({ _id: user.householdId }, { $pull: { members: user._id } });
    }
    user.householdId = household._id;
    await user.save();
    await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
    await household.populate({ path: 'members', select: 'username displayName avatarUrl' });
    res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
  } catch (err) { next(err); }
};