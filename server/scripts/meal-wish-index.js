// Inspect by default. Creating the index requires an explicit database name
// and --apply; this script never modifies or deletes wishlist records.
const mongoose = require('mongoose');
const { INDEX_NAME, INDEX_KEY, INDEX_OPTIONS, hasSafeMealWishIndex } = require('../utils/mealWishIndex');

async function auditAndApply(collection, { database, apply }) {
  const safeIndexExists = await hasSafeMealWishIndex(collection);
  const duplicates = await collection.aggregate([
    { $match: { status: 'open', mealId: { $type: 'objectId' } } },
    { $group: { _id: { householdId: '$householdId', mealId: '$mealId' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'groups' }
  ]).toArray();
  const duplicateGroups = duplicates[0]?.groups || 0;
  const invalidMealRefs = await collection.countDocuments({ status: 'open', mealId: { $exists: true, $ne: null, $not: { $type: 'objectId' } } });
  const invalidHouseholds = await collection.countDocuments({ status: 'open', mealId: { $type: 'objectId' }, householdId: { $not: { $type: 'objectId' } } });
  const summary = { database, safeIndexExists, duplicateGroups, invalidMealRefs, invalidHouseholds, mode: apply ? 'apply' : 'audit', created: false };
  if (!apply) return summary;
  if (duplicateGroups) throw new Error('Duplicate open meal wishes exist. Resolve them manually after backup; no data or indexes were changed.');
  if (invalidMealRefs || invalidHouseholds) throw new Error('Invalid open meal or household references exist. Review them manually after backup; no data or indexes were changed.');
  if (safeIndexExists) return summary;
  await collection.createIndex(INDEX_KEY, INDEX_OPTIONS);
  if (!await hasSafeMealWishIndex(collection)) throw new Error(`Could not verify ${INDEX_NAME} after creation.`);
  return { ...summary, created: true };
}

async function main() {
  const args = process.argv.slice(2);
  const databaseAt = args.indexOf('--database');
  const expectedDatabase = databaseAt >= 0 ? args[databaseAt + 1] : '';
  const apply = args.includes('--apply');
  if (!process.env.MONGO_URI || !expectedDatabase || expectedDatabase.startsWith('--')) {
    throw new Error('Set MONGO_URI and provide --database <expected-name>; add --apply only after reviewing the audit and backup.');
  }
  if (args.some((arg, i) => !['--database', '--apply'].includes(arg) && i !== databaseAt + 1)) throw new Error('Unknown argument');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  if (mongoose.connection.name !== expectedDatabase) throw new Error('Connected database does not match --database; no changes made.');
  const result = await auditAndApply(mongoose.connection.collection('wishlistitems'), { database: expectedDatabase, apply });
  console.log(JSON.stringify(result));
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
module.exports = { auditAndApply };
