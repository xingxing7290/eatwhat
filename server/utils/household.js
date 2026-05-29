const crypto = require('crypto');
const Household = require('../models/householdModel');
const User = require('../models/userModel');

async function generateInviteCode() {
  for (let i = 0; i < 20; i++) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const exists = await Household.exists({ inviteCode: code });
    if (!exists) return code;
  }
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

async function createHousehold(name, createdBy = null) {
  return Household.create({
    name: (name || '我们的温馨小家').trim(),
    inviteCode: await generateInviteCode(),
    members: createdBy ? [createdBy] : [],
    createdBy
  });
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
  return household;
}

async function ensureUserHousehold(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }

  if (!user.householdId) {
    const household = await getOrCreateDefaultHousehold();
    user.householdId = household._id;
    await user.save();
    await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
    return { user, household };
  }

  const household = await Household.findById(user.householdId);
  if (!household) {
    const fallback = await getOrCreateDefaultHousehold();
    user.householdId = fallback._id;
    await user.save();
    await Household.updateOne({ _id: fallback._id }, { $addToSet: { members: user._id } });
    return { user, household: fallback };
  }

  await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
  return { user, household };
}

function householdPayload(household) {
  if (!household) return null;
  return {
    id: household._id,
    name: household.name,
    inviteCode: household.inviteCode,
    members: household.members || []
  };
}

module.exports = {
  generateInviteCode,
  createHousehold,
  getOrCreateDefaultHousehold,
  ensureUserHousehold,
  householdPayload
};