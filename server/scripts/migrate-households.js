const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const Meal = require('../models/mealModel');
const Schedule = require('../models/scheduleModel');
const MealMemory = require('../models/memoryModel');
const WishlistItem = require('../models/wishlistModel');
const AnniversaryMenu = require('../models/anniversaryMenuModel');
const { generateInviteCode } = require('../utils/household');

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
  await mongoose.connect(uri);

  let household = await Household.findOne({ name: '默认小家' });
  if (!household) {
    const firstUser = await User.findOne().sort({ createdAt: 1 });
    household = await Household.create({
      name: '默认小家',
      inviteCode: await generateInviteCode(),
      createdBy: firstUser ? firstUser._id : null,
      members: firstUser ? [firstUser._id] : []
    });
  }

  const users = await User.find({ $or: [{ householdId: null }, { householdId: { $exists: false } }] });
  for (const user of users) {
    user.householdId = household._id;
    await user.save();
  }
  const allUsers = await User.find({ householdId: household._id }).select('_id');
  await Household.updateOne({ _id: household._id }, { $addToSet: { members: { $each: allUsers.map(u => u._id) } } });

  const mealResult = await Meal.updateMany(
    { $or: [{ householdId: null }, { householdId: { $exists: false } }] },
    { $set: { householdId: household._id } }
  );
  const scheduleResult = await Schedule.updateMany(
    { $or: [{ householdId: null }, { householdId: { $exists: false } }] },
    { $set: { householdId: household._id } }
  );
  await MealMemory.updateMany({ householdId: { $exists: false } }, { $set: { householdId: household._id } });
  await WishlistItem.updateMany({ householdId: { $exists: false } }, { $set: { householdId: household._id } });
  await AnniversaryMenu.updateMany({ householdId: { $exists: false } }, { $set: { householdId: household._id } });

  try {
    const indexes = await Schedule.collection.indexes();
    if (indexes.some(idx => idx.name === 'date_1' && idx.unique)) {
      await Schedule.collection.dropIndex('date_1');
      console.log('Dropped legacy unique index date_1');
    }
  } catch (err) {
    console.log(`Index cleanup skipped: ${err.message}`);
  }

  await Promise.all([
    Household.syncIndexes(),
    User.syncIndexes(),
    Meal.syncIndexes(),
    Schedule.syncIndexes(),
    MealMemory.syncIndexes(),
    WishlistItem.syncIndexes(),
    AnniversaryMenu.syncIndexes()
  ]);

  console.log(JSON.stringify({
    householdId: household._id,
    inviteCode: household.inviteCode,
    usersMigrated: users.length,
    mealsMatched: mealResult.matchedCount,
    schedulesMatched: scheduleResult.matchedCount
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});