require('dotenv').config();
const mongoose = require('mongoose');
const Household = require('../models/householdModel');
const User = require('../models/userModel');
const { looksBrokenText, cleanDisplayName } = require('../utils/text');

function coupleHouseholdName(users) {
  const names = users
    .map((user) => cleanDisplayName(user.displayName, user.username))
    .filter(Boolean);
  if (names.length >= 2) return `${names[0]}\u548c${names[1]}\u7684\u5c0f\u5bb6`;
  if (names.length === 1) return `${names[0]}\u7684\u5c0f\u5bb6`;
  return '\u6211\u4eec\u7684\u6e29\u99a8\u5c0f\u5bb6';
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);
  const changes = [];

  const households = await Household.find({}).populate('members', 'username displayName').sort({ createdAt: 1 });
  for (const household of households) {
    if (!looksBrokenText(household.name)) continue;
    const oldName = household.name;
    household.name = coupleHouseholdName(household.members || []);
    await household.save();
    changes.push({ type: 'household', id: String(household._id), oldName, newName: household.name });
  }

  const users = await User.find({}).sort({ createdAt: 1 });
  for (const user of users) {
    if (!looksBrokenText(user.displayName)) continue;
    const oldDisplayName = user.displayName;
    user.displayName = user.username;
    await user.save();
    changes.push({ type: 'user', id: String(user._id), username: user.username, oldDisplayName, newDisplayName: user.displayName });
  }

  console.log(JSON.stringify({ changed: changes.length, changes }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
