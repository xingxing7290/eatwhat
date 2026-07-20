const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('../models/mealModel');
const defaultMeals = require('../data/defaultMeals');
const catalogImages = require('../data/mealCatalogImages.json');

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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const mealKeys = new Set(defaultMeals.map(meal => String(meal.key)));
  const imageByKey = new Map(catalogImages.map(item => [String(item.key), item]));
  const keys = options.all ? [...imageByKey.keys()] : [...new Set(options.keys)];

  if (!keys.length) {
    throw new Error('必须传入 --keys=key1,key2 或显式使用 --all');
  }

  const missingKeys = keys.filter(key => !mealKeys.has(key) || !imageByKey.get(key)?.imageUrl);
  if (missingKeys.length) {
    throw new Error(`不存在菜品或审核后图片映射: ${missingKeys.join(', ')}`);
  }

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';
  await mongoose.connect(uri);
  const results = [];

  for (const key of keys) {
    const imageUrl = imageByKey.get(key).imageUrl;
    const filter = { isDefault: true, defaultKey: key };
    const matched = await Meal.countDocuments(filter);

    if (options.dryRun) {
      results.push({ key, imageUrl, matched, modified: 0, dryRun: true });
      continue;
    }

    const result = await Meal.updateMany(filter, [
      {
        $set: {
          imageUrl,
          photos: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$photos', []] } }, 0] },
              {
                $map: {
                  input: { $ifNull: ['$photos', []] },
                  as: 'photo',
                  in: { $cond: [{ $eq: ['$$photo', '$imageUrl'] }, imageUrl, '$$photo'] }
                }
              },
              [imageUrl]
            ]
          }
        }
      }
    ]);
    results.push({ key, imageUrl, matched: result.matchedCount, modified: result.modifiedCount });
  }

  console.log(JSON.stringify({
    dryRun: options.dryRun,
    keys: keys.length,
    matched: results.reduce((sum, item) => sum + item.matched, 0),
    modified: results.reduce((sum, item) => sum + item.modified, 0),
    results
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(error.message || error);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
