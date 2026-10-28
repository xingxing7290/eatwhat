// Read-only by default; --apply creates only the index and never changes lists.
const mongoose = require('mongoose');
const { INDEX_KEY, INDEX_NAME, hasSafeShoppingListIndex } = require('../utils/shoppingListIndex');

async function auditAndApply(collection, { database, apply }) {
  const safeIndexExists = await hasSafeShoppingListIndex(collection);
  const duplicateCounts = await collection.aggregate([
    { $group: { _id: { householdId: '$householdId', weekStart: '$weekStart' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'groups' }
  ]).toArray();
  const invalidHouseholds = await collection.countDocuments({ householdId: { $not: { $type: 'objectId' } } });
  const invalidDates = await collection.aggregate([
    { $project: { original: '$weekStart', parsed: { $dateFromString: { dateString: '$weekStart', format: '%Y-%m-%d', onError: null, onNull: null } } } },
    { $match: { $expr: { $or: [{ $eq: ['$parsed', null] }, { $ne: [{ $dayOfWeek: '$parsed' }, 2] }, { $ne: [{ $dateToString: { date: '$parsed', format: '%Y-%m-%d', onNull: null } }, '$original'] }] } } },
    { $count: 'documents' }
  ]).toArray();
  const summary = { database, safeIndexExists, duplicateGroups: duplicateCounts[0]?.groups || 0, invalidHouseholds, invalidWeekStarts: invalidDates[0]?.documents || 0, mode: apply ? 'apply' : 'audit', created: false };
  if (!apply) return summary;
  if (summary.duplicateGroups || summary.invalidHouseholds || summary.invalidWeekStarts) throw new Error('Duplicate lists or invalid household/week keys exist. Review manually after backup; no data or indexes were changed.');
  if (safeIndexExists) return summary;
  await collection.createIndex(INDEX_KEY, { unique: true, name: INDEX_NAME });
  if (!await hasSafeShoppingListIndex(collection)) throw new Error(`Could not verify ${INDEX_NAME} after creation.`);
  return { ...summary, created: true };
}

async function main() {
  const args = process.argv.slice(2);
  const databaseAt = args.indexOf('--database');
  const expectedDatabase = databaseAt >= 0 ? args[databaseAt + 1] : '';
  const apply = args.includes('--apply');
  if (!process.env.MONGO_URI || !expectedDatabase || expectedDatabase.startsWith('--')) throw new Error('Set MONGO_URI and provide --database <expected-name>; add --apply only after reviewing the audit and backup.');
  if (args.some((arg, i) => !['--database', '--apply'].includes(arg) && i !== databaseAt + 1)) throw new Error('Unknown argument');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  if (mongoose.connection.name !== expectedDatabase) throw new Error('Connected database does not match --database; no changes made.');
  console.log(JSON.stringify(await auditAndApply(mongoose.connection.collection('shoppinglists'), { database: expectedDatabase, apply })));
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
module.exports = { auditAndApply };
