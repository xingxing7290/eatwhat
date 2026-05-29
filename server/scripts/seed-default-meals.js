const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Household = require('../models/householdModel');
const { seedDefaultMealsForHouseholds } = require('../utils/defaultMeals');

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
  await mongoose.connect(uri);
  const households = await Household.find({});
  const results = await seedDefaultMealsForHouseholds(households);
  console.log(JSON.stringify({ households: results.length, results }, null, 2));
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
