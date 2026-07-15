const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('../models/mealModel');
const defaultMeals = require('../data/defaultMeals');

dotenv.config();

function parseArgs(argv) {
  const options = { keys: [], all: false, dryRun: false };
  for (const arg of argv) {
    if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--keys=')) {
      options.keys = arg.slice('--keys='.length).split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return options;
}

function recipeFields(meal) {
  return {
    name: meal.name,
    category: meal.category,
    subcategory: meal.subcategory,
    description: meal.description,
    tags: meal.tags || [],
    ingredients: meal.ingredients || [],
    steps: meal.steps || [],
    tips: meal.tips || '',
    servingSize: meal.servingSize || '',
    prepTime: meal.prepTime || 0,
    cookTime: meal.cookTime || 0,
    difficulty: meal.difficulty || '',
    taste: meal.taste || [],
    healthTags: meal.healthTags || [],
    spiceLevel: meal.spiceLevel || 0,
    source: meal.source || '',
    sourcePath: meal.sourcePath || ''
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const byKey = new Map(defaultMeals.map(meal => [meal.key, meal]));
  const keys = options.all ? [...byKey.keys()] : [...new Set(options.keys)];
  if (!keys.length) {
    throw new Error('必须传入 --keys=key1,key2 或显式使用 --all');
  }
  const missingKeys = keys.filter(key => !byKey.has(key));
  if (missingKeys.length) {
    throw new Error(`不存在的默认菜 key: ${missingKeys.join(', ')}`);
  }

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
  await mongoose.connect(uri);
  const before = await Meal.countDocuments({ isDefault: true, defaultKey: { $in: keys } });
  const results = [];

  for (const key of keys) {
    const meal = byKey.get(key);
    const filter = { isDefault: true, defaultKey: key };
    const matched = await Meal.countDocuments(filter);
    if (options.dryRun) {
      results.push({ key, name: meal.name, matched, modified: 0, dryRun: true });
      continue;
    }
    const result = await Meal.updateMany(filter, { $set: recipeFields(meal) });
    results.push({ key, name: meal.name, matched: result.matchedCount, modified: result.modifiedCount });
  }

  const after = await Meal.countDocuments({ isDefault: true, defaultKey: { $in: keys } });
  const summary = {
    dryRun: options.dryRun,
    keys: keys.length,
    before,
    after,
    matched: results.reduce((sum, item) => sum + item.matched, 0),
    modified: results.reduce((sum, item) => sum + item.modified, 0),
    results
  };
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(error.message || error);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
