const Household = require('../models/householdModel');
const User = require('../models/userModel');
const { ensureUserHousehold, assertExpectedHousehold, generateInviteCode, householdPayload, withCurrentMembers } = require('../utils/household');
const { toSafeUser } = require('./authController');
const { looksBrokenText } = require('../utils/text');
const { randomUUID } = require('crypto');

async function loadHousehold(uid, expected) {
  const { user, household } = await ensureUserHousehold(uid, 0, expected);
  return { user, household: await withCurrentMembers(household, uid) };
}

exports.me = async (req, res, next) => {
  try {
    const { user, household } = await loadHousehold(req.user.uid, req.expectedHouseholdId);
    res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 40 || looksBrokenText(name)) return res.status(400).json({ code: 'HOUSEHOLD_NAME_INVALID', error: '小家名称不能为空、不能超过 40 字，且不能是乱码' });
    const conditional = Object.prototype.hasOwnProperty.call(req.body || {}, 'expectedNameVersion');
    const version = req.body?.expectedNameVersion;
    if (conditional && (!version || typeof version !== 'object' || Array.isArray(version) || Object.keys(version).length !== 1 || !Object.prototype.hasOwnProperty.call(version, 'revision') || !(version.revision === null || (typeof version.revision === 'string' && version.revision.length > 0 && version.revision.length <= 128)))) return res.status(400).json({ code: 'HOUSEHOLD_NAME_INVALID_VERSION', error: '小家名称版本无效，请重新核对' });
    const filter = { _id: household._id, ...(conditional ? { nameRevision: version.revision } : {}) };
    const updated = await Household.findOneAndUpdate(filter, { $set: { name, nameRevision: randomUUID() } }, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ code: 'HOUSEHOLD_NAME_CONFLICT', error: '小家名称已变化，请核对最新名称' });
    res.json({ household: householdPayload(await withCurrentMembers(updated, req.user.uid)) });
  } catch (err) { next(err); }
};

exports.refreshInvite = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    household.inviteCode = await generateInviteCode();
    await household.save();
    res.json({ household: householdPayload(await withCurrentMembers(household, req.user.uid)) });
  } catch (err) { next(err); }
};

exports.join = async (req, res, next) => {
  try {
    const inviteCode = typeof req.body?.inviteCode === 'string' ? req.body.inviteCode.trim().toUpperCase() : '';
    if (!inviteCode) return res.status(400).json({ error: '请输入邀请码' });
    const household = await Household.findOne({ inviteCode });
    if (!household) return res.status(404).json({ error: '邀请码无效' });
    const user = await User.findById(req.user.uid);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    assertExpectedHousehold(user, req.expectedHouseholdId);
    // Only one concurrent switch may consume the same current membership.
    const sourceId = user.householdId || null;
    const updated = await User.findOneAndUpdate({ _id: user._id, householdId: sourceId }, { $set: { householdId: household._id } }, { new: true });
    if (!updated) return res.status(409).json({ code: 'HOUSEHOLD_SWITCH_CONFLICT', error: '所属小家已变化，请重新核对' });
    if (sourceId && String(sourceId) !== String(household._id)) {
      await Household.updateOne({ _id: sourceId }, { $pull: { members: user._id } });
    }
    await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
    const [currentUser, currentHousehold] = await Promise.all([User.findById(user._id), Household.findById(household._id)]);
    if (!currentUser || !currentHousehold || String(currentUser.householdId) !== String(household._id)) return res.status(409).json({ code: 'HOUSEHOLD_SWITCH_CONFLICT', error: '所属小家已变化，请重新核对' });
    const responseHousehold = await withCurrentMembers(currentHousehold, currentUser._id);
    res.json({ user: toSafeUser(currentUser, responseHousehold), household: householdPayload(responseHousehold) });
  } catch (err) { next(err); }
};
