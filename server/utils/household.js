const crypto = require('crypto');
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const { seedDefaultMealsForHousehold } = require('./defaultMeals');
const { cleanHouseholdName } = require('./text');

async function generateInviteCode() {
  for (let i = 0; i < 20; i++) {
    const code = crypto.randomBytes(10).toString('hex').toUpperCase();
    const exists = await Household.exists({ inviteCode: code });
    if (!exists) return code;
  }
  throw new Error('无法生成唯一邀请码，请重试');
}

async function createHousehold(name, createdBy = null) {
  const household = await Household.create({
    name: (name || '我们的温馨小家').trim(),
    inviteCode: await generateInviteCode(),
    members: createdBy ? [createdBy] : [],
    createdBy
  });
  await seedDefaultMealsForHousehold(household._id, createdBy);
  return household;
}

async function getOrCreateDefaultHousehold() {
  let household = await Household.findOne({ name: '默认小家' });
  if (!household) {
    household = await Household.create({
      name: '默认小家',
      inviteCode: await generateInviteCode(),
      members: [],
      createdBy: null
    });
  }
  await seedDefaultMealsForHousehold(household._id, household.createdBy || null);
  return household;
}

async function ensureUserHousehold(userId, attempt = 0) {
  let user = await User.findById(userId);
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }

  let household = user.householdId ? await Household.findById(user.householdId) : null;
  if (!household) {
    const fallback = await getOrCreateDefaultHousehold();
    const updated = await User.findOneAndUpdate({ _id: user._id, householdId: user.householdId || null }, { $set: { householdId: fallback._id } }, { new: true });
    if (!updated) {
      if (attempt < 3) return ensureUserHousehold(userId, attempt + 1);
      const error = new Error('所属小家正在变化，请重试');
      error.status = 409;
      throw error;
    }
    user = updated;
    household = fallback;
  }

  await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
  return { user, household };
}

function householdPayload(household) {
  if (!household) return null;
  return {
    id: household._id,
    name: cleanHouseholdName(household.name),
    inviteCode: household.inviteCode,
    members: household.members || []
  };
}

// The user record is authoritative. The denormalized members array can be
// stale after interrupted or concurrent switches and must not leak ex-members.
async function withCurrentMembers(household, requesterId) {
  const members = await User.find({ householdId: household._id }).select('username displayName avatarUrl').sort({ _id: 1 }).lean();
  if (requesterId && !members.some(member => String(member._id) === String(requesterId))) {
    const error = new Error('所属小家已变化，请重新核对');
    error.status = 409;
    throw error;
  }
  return { ...household.toObject(), members };
}

module.exports = {
  generateInviteCode,
  createHousehold,
  getOrCreateDefaultHousehold,
  ensureUserHousehold,
  householdPayload,
  withCurrentMembers
};
