const Meal = require('../models/mealModel');
const { ensureUserHousehold } = require('../utils/household');
const { defaultMeals, seedDefaultMealsForHousehold, imageUrlFor, ensureDefaultMealImages } = require('../utils/defaultMeals');

async function statusFor(householdId) {
  const defaultKeys = defaultMeals.map(item => item.key);
  const importedKeys = await Meal.distinct('defaultKey', { householdId, defaultKey: { $in: defaultKeys } });
  const importedSet = new Set(importedKeys.map(String));
  return { total: defaultMeals.length, imported: importedSet.size, missing: defaultMeals.length - importedSet.size, missingKeys: defaultKeys.filter(key => !importedSet.has(key)) };
}

exports.status = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    res.json(await statusFor(household._id));
  } catch (err) { next(err); }
};

exports.importMissing = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const before = await statusFor(household._id);
    const result = await seedDefaultMealsForHousehold(household._id, req.user.uid);
    const after = await statusFor(household._id);
    res.json({ before, after, result });
  } catch (err) { next(err); }
};

exports.restoreImages = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    ensureDefaultMealImages();
    let updated = 0;
    for (const item of defaultMeals) {
      const imageUrl = imageUrlFor(item);
      const result = await Meal.updateMany(
        { householdId: household._id, defaultKey: item.key },
        { $set: { imageUrl, photos: [imageUrl], isDefault: true } }
      );
      updated += result.modifiedCount || 0;
    }
    res.json({ updated, status: await statusFor(household._id) });
  } catch (err) { next(err); }
};

exports._statusFor = statusFor;
