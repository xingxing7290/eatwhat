const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const WishlistItem = require('../models/wishlistModel');
const MealMemory = require('../models/memoryModel');
const MealImageIssue = require('../models/mealImageIssueModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { ensureUserHousehold } = require('../utils/household');
const { dateKey, startOfWeek, weekDates } = require('../utils/week');
const { _statusFor } = require('./defaultMealController');
const { _balanceHintsForDay, _weekSchedules } = require('./weeklyPlanController');

function mealCount(schedule) {
  return ['breakfast', 'lunch', 'dinner'].reduce((sum, type) => sum + (schedule?.meals?.[type]?.length || 0), 0);
}
function photosFromMemory(memory) {
  return (memory.photos || []).map(photo => ({ photo, memoryId: memory._id, date: memory.date, title: memory.title, mood: memory.mood, meals: memory.mealIds || [] }));
}
function partnerWishlistQuery(memberIds) {
  return { $or: [
    { createdBy: { $in: memberIds } },
    { votes: { $in: memberIds } }
  ] };
}
async function partnerWishlistFor(householdId, uid) {
  const currentUser = new mongoose.Types.ObjectId(String(uid));
  const memberIds = await User.distinct('_id', { householdId, _id: { $ne: currentUser } });
  if (!memberIds.length) return [];
  const items = await WishlistItem.aggregate([
    { $match: { householdId, status: 'open', ...partnerWishlistQuery(memberIds) } },
    { $addFields: { _priorityRank: { $switch: { branches: [
      { case: { $eq: ['$priority', 'high'] }, then: 2 },
      { case: { $eq: ['$priority', 'low'] }, then: 0 }
    ], default: 1 } } } },
    { $sort: { _priorityRank: -1, createdAt: -1, _id: -1 } },
    { $limit: 6 },
    { $project: { _priorityRank: 0 } }
  ]);
  return WishlistItem.populate(items, [
    { path: 'mealId' },
    { path: 'createdBy', select: 'username displayName avatarUrl' },
    { path: 'votes', select: 'username displayName avatarUrl' }
  ]);
}

exports.summary = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const today = dateKey(new Date());
    const weekStart = startOfWeek(today);
    const week = await _weekSchedules(household._id, weekStart);
    const todaySchedule = await Schedule.findOne({ householdId: household._id, date: today }).populate([
      { path: 'meals.breakfast.meal' }, { path: 'meals.lunch.meal' }, { path: 'meals.dinner.meal' },
      { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
    ]);
    const [wishlist, recentMemories, defaultStatus, openImageIssues, mealStats] = await Promise.all([
      partnerWishlistFor(household._id, req.user.uid),
      MealMemory.find({ householdId: household._id, photos: { $exists: true, $ne: [] } }).populate('mealIds').sort({ date: -1, createdAt: -1 }).limit(6),
      _statusFor(household._id),
      MealImageIssue.countDocuments({ householdId: household._id, status: 'open' }),
      Promise.all([
        Meal.countDocuments({ householdId: household._id, archived: { $ne: true } }),
        Meal.countDocuments({ householdId: household._id, favorite: true, archived: { $ne: true } })
      ])
    ]);
    res.json({
      today,
      weekStart,
      todaySchedule: todaySchedule || { date: today, meals: { breakfast: [], lunch: [], dinner: [] } },
      todayHints: _balanceHintsForDay(todaySchedule),
      week: { days: week.map(day => ({ date: day.date, meals: day.meals, hints: _balanceHintsForDay(day) })), plannedMeals: week.reduce((sum, day) => sum + mealCount(day), 0) },
      partnerWishlist: wishlist,
      recentPhotos: recentMemories.flatMap(photosFromMemory).slice(0, 8),
      defaultMeals: defaultStatus,
      imageIssues: { open: openImageIssues },
      meals: { total: mealStats[0], favorites: mealStats[1] }
    });
  } catch (err) { next(err); }
};
