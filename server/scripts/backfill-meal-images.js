const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('../models/mealModel');
const { ensureMealImage, hasUsableImage } = require('../utils/defaultMeals');

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
  await mongoose.connect(uri);
  const meals = await Meal.find({});
  let scanned = 0;
  let updated = 0;
  let alreadyOk = 0;
  const fixed = [];

  for (const meal of meals) {
    scanned += 1;
    if (hasUsableImage(meal)) {
      alreadyOk += 1;
      continue;
    }
    const imageUrl = ensureMealImage(meal);
    if (!imageUrl) continue;
    meal.imageUrl = imageUrl;
    meal.photos = Array.from(new Set([imageUrl, ...(meal.photos || [])].filter(Boolean)));
    await meal.save();
    updated += 1;
    fixed.push({ id: meal._id, name: meal.name, imageUrl });
  }

  console.log(JSON.stringify({ scanned, alreadyOk, updated, fixed: fixed.slice(0, 30) }, null, 2));
  await mongoose.disconnect();
}

main().catch(async err => {
  console.error(err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
