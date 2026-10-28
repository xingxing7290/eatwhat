const INDEX_KEY = { householdId: 1, weekStart: 1 };
const INDEX_NAME = 'householdId_1_weekStart_1';

async function hasSafeShoppingListIndex(collection) {
  let indexes;
  try { indexes = await collection.indexes(); }
  catch (error) { if (error.code !== 26 && error.codeName !== 'NamespaceNotFound') throw error; indexes = []; }
  return indexes.some(index => index.unique === true && !index.sparse && !index.partialFilterExpression && !index.collation &&
    Object.keys(index.key || {}).length === 2 && index.key.householdId === 1 && index.key.weekStart === 1);
}

module.exports = { INDEX_KEY, INDEX_NAME, hasSafeShoppingListIndex };
