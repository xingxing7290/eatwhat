const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const WishlistItem = require('../models/wishlistModel');
const MealMemory = require('../models/memoryModel');
const { ensureUserHousehold } = require('../utils/household');
const { startOfWeek, weekDates, dateKey } = require('../utils/week');

const mealTypes = ['breakfast', 'lunch', 'dinner'];
const mealTypeLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

function mealDoc(item) {
  if (!item) return null;
  if (item.meal && typeof item.meal === 'object') return item.meal;
  if (item.name) return item;
  return null;
}
function mealIdOf(meal) { return String(meal?._id || meal?.id || meal || ''); }
function flattenScheduleMeals(schedule) {
  return mealTypes.flatMap(type => (schedule?.meals?.[type] || []).map(item => mealDoc(item)).filter(Boolean));
}
function balanceHintsForDay(schedule) {
  const meals = flattenScheduleMeals(schedule);
  if (!meals.length) return [];
  const text = meals.map(meal => `${meal.name || ''} ${meal.category || ''} ${(meal.tags || []).join(' ')} ${(meal.healthTags || []).join(' ')}`).join(' ');
  const hints = [];
  if (!/(菜|蔬|青|菠菜|白菜|生菜|油麦|西兰花|清淡|蔬菜多)/.test(text)) hints.push('今天蔬菜偏少');
  const heavyCount = meals.filter(meal => Number(meal.spiceLevel || 0) >= 4 || (meal.healthTags || []).includes('重口') || /麻辣|烧烤|火锅|下饭/.test(`${meal.tags || []} ${meal.category || ''}`)).length;
  if (heavyCount >= 2) hints.push('今天口味偏重');
  if (meals.some(meal => (meal.healthTags || []).includes('快手') || Number(meal.cookTime || 0) <= 15)) hints.push('包含快手菜');
  return hints;
}
async function weekSchedules(householdId, weekStart) {
  const dates = weekDates(weekStart);
  const schedules = await Schedule.find({ householdId, date: { $in: dates } }).populate([
    { path: 'meals.breakfast.meal' }, { path: 'meals.lunch.meal' }, { path: 'meals.dinner.meal' },
    { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
    { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
    { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
  ]);
  const map = new Map(schedules.map(item => [item.date, item]));
  return dates.map(date => map.get(date) || { date, meals: { breakfast: [], lunch: [], dinner: [] } });
}
function normalizePlan(days) {
  return (Array.isArray(days) ? days : []).map(day => ({
    date: String(day.date || '').trim(),
    meals: Object.fromEntries(mealTypes.map(type => [type, Array.isArray(day.meals?.[type]) ? day.meals[type].filter(Boolean).map(String) : []]))
  })).filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date));
}
function pickMeal(pool, used, predicate = () => true) {
  const found = pool.find(meal => !used.has(mealIdOf(meal)) && predicate(meal));
  if (found) used.add(mealIdOf(found));
  return found || null;
}
function scoreMeal(meal, wishlistIds, recentIds) {
  let score = 0;
  if (wishlistIds.has(mealIdOf(meal))) score += 80;
  if (meal.favorite) score += 30;
  score += Number(meal.rating || 0) * 8;
  if ((meal.healthTags || []).includes('快手')) score += 6;
  if (recentIds.has(mealIdOf(meal))) score -= 60;
  return score;
}
async function buildGeneratedPlan(householdId) {
  const [meals, wishlist, recentMemories] = await Promise.all([
    Meal.find({ householdId }).sort({ favorite: -1, rating: -1, createdAt: -1 }).limit(300),
    WishlistItem.find({ householdId, status: 'open', mealId: { $ne: null } }).sort({ priority: -1, createdAt: -1 }).limit(80),
    MealMemory.find({ householdId }).sort({ date: -1, createdAt: -1 }).limit(20)
  ]);
  const wishlistIds = new Set(wishlist.map(item => mealIdOf(item.mealId)));
  const recentIds = new Set(recentMemories.flatMap(item => (item.mealIds || []).map(mealIdOf)));
  const pool = meals.sort((a, b) => scoreMeal(b, wishlistIds, recentIds) - scoreMeal(a, wishlistIds, recentIds));
  const used = new Set();
  const dates = weekDates(startOfWeek());
  const breakfastPred = meal => /早餐|主食|面食|饼|包|粥|粉|面|蛋|快手/.test(`${meal.category || ''} ${meal.subcategory || ''} ${(meal.tags || []).join(' ')} ${(meal.healthTags || []).join(' ')}`);
  const dinnerPred = meal => meal.favorite || Number(meal.rating || 0) >= 4 || wishlistIds.has(mealIdOf(meal));
  return dates.map((date, index) => {
    const breakfast = pickMeal(pool, used, breakfastPred) || pickMeal(pool, used) || pool[index % Math.max(pool.length, 1)];
    const lunch = pickMeal(pool, used, meal => mealIdOf(meal) !== mealIdOf(breakfast)) || breakfast;
    const dinner = pickMeal(pool, used, dinnerPred) || pickMeal(pool, used, meal => mealIdOf(meal) !== mealIdOf(lunch)) || lunch;
    return {
      date,
      meals: {
        breakfast: breakfast ? [mealIdOf(breakfast)] : [],
        lunch: lunch ? [mealIdOf(lunch)] : [],
        dinner: dinner ? [mealIdOf(dinner)] : []
      }
    };
  });
}

exports.list = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.query.weekStart);
    const days = await weekSchedules(household._id, weekStart);
    res.json({ weekStart, days: days.map(day => ({ date: day.date, meals: day.meals, hints: balanceHintsForDay(day) })) });
  } catch (err) { next(err); }
};

exports.generate = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const weekStart = startOfWeek(req.body?.weekStart || req.query.weekStart);
    const planDays = await buildGeneratedPlan(household._id);
    const meals = await Meal.find({ householdId: household._id, _id: { $in: planDays.flatMap(day => mealTypes.flatMap(type => day.meals[type])) } });
    const mealMap = new Map(meals.map(meal => [mealIdOf(meal), meal]));
    const days = weekDates(weekStart).map((date, idx) => ({ ...planDays[idx], date }));
    const preview = days.map(day => ({
      date: day.date,
      meals: Object.fromEntries(mealTypes.map(type => [type, day.meals[type].map(id => mealMap.get(id)).filter(Boolean)])),
      hints: balanceHintsForDay({ meals: Object.fromEntries(mealTypes.map(type => [type, day.meals[type].map(id => ({ meal: mealMap.get(id) })).filter(item => item.meal)])) })
    }));
    res.json({ weekStart, days, preview, note: '规则生成草稿，应用后才会写入日历。' });
  } catch (err) { next(err); }
};

exports.apply = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const days = normalizePlan(req.body.days);
    const ids = [...new Set(days.flatMap(day => mealTypes.flatMap(type => day.meals[type])))];
    if (ids.length) {
      const count = await Meal.countDocuments({ householdId: household._id, _id: { $in: ids } });
      if (count !== ids.length) return res.status(400).json({ error: '计划中包含无效菜品' });
    }
    for (const day of days) {
      const update = { householdId: household._id };
      mealTypes.forEach(type => { update[`meals.${type}`] = day.meals[type].map(id => ({ meal: id, addedBy: req.user.uid })); });
      await Schedule.findOneAndUpdate({ householdId: household._id, date: day.date }, { $set: update }, { upsert: true, new: true, runValidators: true });
    }
    const weekStart = startOfWeek(days[0]?.date || dateKey(new Date()));
    res.json({ weekStart, applied: days.length, days: await weekSchedules(household._id, weekStart) });
  } catch (err) { next(err); }
};

exports._weekSchedules = weekSchedules;
exports._balanceHintsForDay = balanceHintsForDay;
