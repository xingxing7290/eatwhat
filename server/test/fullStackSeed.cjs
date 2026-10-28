// Test-only fixtures; refuses every MongoDB endpoint except the isolated network alias.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const GuestOrderSession = require('../models/guestOrderSessionModel');
const uri = process.env.MONGO_URI;
if (uri !== 'mongodb://eatwhat-e2e-mongo:27017/eatwhat_e2e') throw new Error('Refusing non-isolated database');

async function main() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const houseA = await Household.create({ name: 'E2E 家庭甲', inviteCode: 'E2E-AAAA' });
    const houseB = await Household.create({ name: 'E2E 家庭乙', inviteCode: 'E2E-BBBB' });
    const passwordHash = await bcrypt.hash('e2e-only-password', 4);
    const userA = await User.create({ username: 'e2e-user-a', displayName: '测试甲', passwordHash, householdId: houseA._id });
    const userB = await User.create({ username: 'e2e-user-b', displayName: '测试乙', passwordHash, householdId: houseB._id });
    await GuestOrderSession.create({ householdId: houseA._id, createdBy: userA._id, title: '隔离联调宴请', shareToken: 'e2e-only-guest-token', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await Meal.insertMany(Array.from({ length: 12 }, (_, index) => ({
      householdId: houseA._id, createdBy: userA._id,
      name: `联调菜谱 ${String(index + 1).padStart(2, '0')}`,
      category: index < 6 ? '家常' : '汤菜',
      ingredients: [{ name: '联调食材', amount: '1份' }]
    })));
    await Meal.create({ householdId: houseB._id, createdBy: userB._id, name: '乙家庭专属菜', ingredients: [{ name: '乙家庭食材', amount: '1份' }] });
    console.log('Seeded isolated e2e households and recipes');
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
