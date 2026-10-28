const INDEX_NAME = 'uniq_open_household_meal';
const INDEX_KEY = { householdId: 1, mealId: 1 };
const INDEX_OPTIONS = {
  name: INDEX_NAME,
  unique: true,
  partialFilterExpression: { status: 'open', mealId: { $type: 'objectId' } }
};

function isSafeMealWishIndex(index) {
  const key = index?.key || {};
  const filter = index?.partialFilterExpression || {};
  return index?.name === INDEX_NAME && index.unique === true &&
    Object.keys(key).length === 2 && key.householdId === 1 && key.mealId === 1 &&
    Object.keys(filter).length === 2 && filter.status === 'open' &&
    Object.keys(filter.mealId || {}).length === 1 && filter.mealId?.$type === 'objectId';
}

async function hasSafeMealWishIndex(collection) {
  try { return (await collection.indexes()).some(isSafeMealWishIndex); }
  catch (error) {
    if (error?.code === 26 || error?.codeName === 'NamespaceNotFound') return false;
    throw error;
  }
}

function isMealWishDuplicate(error) {
  return error?.code === 11000 && error?.keyPattern?.householdId === 1 && error?.keyPattern?.mealId === 1;
}

module.exports = { INDEX_NAME, INDEX_KEY, INDEX_OPTIONS, isSafeMealWishIndex, hasSafeMealWishIndex, isMealWishDuplicate };
