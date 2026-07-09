const Meal = require('../models/mealModel');
const Schedule = require('../models/scheduleModel');
const MealMemory = require('../models/memoryModel');
const WishlistItem = require('../models/wishlistModel');
const { ensureUserHousehold } = require('../utils/household');
const { monthRange } = require('../utils/week');

const mealTypes = ['breakfast', 'lunch', 'dinner'];

function pad(n) { return String(n).padStart(2, '0'); }

function yearRange(yearValue) {
  const now = new Date();
  const year = /^\d{4}$/.test(String(yearValue || '')) ? Number(yearValue) : now.getFullYear();
  return {
    year: String(year),
    start: `${year}-01-01`,
    end: `${year}-12-31`
  };
}

function selectedRange(req, type) {
  if (type === 'year') return yearRange(req.query.year);
  return monthRange(req.query.month);
}

function mealName(meal) {
  return String(meal?.name || '').trim();
}

function mealId(meal) {
  return String(meal?._id || meal?.id || meal || '');
}

function increaseMeal(counter, meal, source, extra = {}) {
  if (!meal) return;
  const id = mealId(meal);
  const name = mealName(meal);
  if (!id || !name) return;
  const current = counter.get(id) || {
    id,
    name,
    count: 0,
    memoryCount: 0,
    scheduleCount: 0,
    ratingTotal: 0,
    ratingCount: 0,
    imageUrl: meal.imageUrl || meal.coverImage || meal.image || '',
    category: meal.category || '',
    tags: meal.tags || [],
    healthTags: meal.healthTags || []
  };
  current.count += 1;
  if (source === 'memory') {
    current.memoryCount += 1;
    if (extra.rating > 0) {
      current.ratingTotal += extra.rating;
      current.ratingCount += 1;
    }
  }
  if (source === 'schedule') current.scheduleCount += 1;
  counter.set(id, current);
}

function topItems(counter, limit = 8) {
  return Array.from(counter.values())
    .map(item => ({
      ...item,
      averageRating: item.ratingCount ? Number((item.ratingTotal / item.ratingCount).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count || b.averageRating - a.averageRating || a.name.localeCompare(b.name, 'zh-Hans-CN'))
    .slice(0, limit);
}

function countScheduledMeals(schedule) {
  return mealTypes.reduce((sum, type) => sum + (schedule?.meals?.[type]?.length || 0), 0);
}

function scheduledMealEntries(schedules) {
  const entries = [];
  schedules.forEach(schedule => {
    mealTypes.forEach(type => {
      (schedule.meals?.[type] || []).forEach(item => {
        if (item.meal) entries.push({ date: schedule.date, mealType: type, meal: item.meal });
      });
    });
  });
  return entries;
}

function photoWall(memories, limit = 12) {
  return memories.flatMap(memory => (memory.photos || []).map(photo => ({
    photo,
    memoryId: memory._id,
    date: memory.date,
    mealType: memory.mealType,
    title: memory.title,
    mood: memory.mood,
    rating: memory.rating,
    meals: memory.mealIds || []
  }))).slice(0, limit);
}

function moodStats(memories) {
  const counts = new Map();
  memories.forEach(memory => {
    const mood = String(memory.mood || '').trim() || '???';
    counts.set(mood, (counts.get(mood) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function bestMemory(memories) {
  const sorted = memories
    .filter(memory => Number(memory.rating) > 0 || (memory.photos || []).length > 0 || memory.title)
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || String(b.date).localeCompare(String(a.date)));
  const memory = sorted[0];
  if (!memory) return null;
  return {
    id: memory._id,
    date: memory.date,
    mealType: memory.mealType,
    title: memory.title || '????????',
    mood: memory.mood,
    note: memory.note,
    rating: memory.rating,
    photos: memory.photos || [],
    meals: memory.mealIds || []
  };
}

function categoryStats(mealCounter) {
  const counts = new Map();
  mealCounter.forEach(item => {
    const category = String(item.category || '').trim() || '???';
    counts.set(category, (counts.get(category) || 0) + item.count);
  });
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function healthTagStats(mealCounter) {
  const counts = new Map();
  mealCounter.forEach(item => {
    (item.healthTags || []).forEach(tag => {
      const key = String(tag || '').trim();
      if (key) counts.set(key, (counts.get(key) || 0) + item.count);
    });
  });
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function summarySentence({ type, label, memoryCount, plannedCount, topMealsList, photoCount }) {
  const periodText = type === 'year' ? `${label} ?` : `${label.replace('-', ' ? ')} ?`;
  const topMeal = topMealsList[0]?.name;
  if (memoryCount === 0 && plannedCount === 0) {
    return `${periodText}?????????????????????`;
  }
  if (topMeal) {
    return `${periodText}????? ${memoryCount} ????????? ${plannedCount} ??????????${topMeal}??`;
  }
  if (photoCount > 0) {
    return `${periodText}??? ${photoCount} ??????????????????`;
  }
  return `${periodText}???????????????????????????`;
}

async function buildReview(req, type) {
  const { household } = await ensureUserHousehold(req.user.uid);
  const range = selectedRange(req, type);
  const label = range.month || range.year;
  const dateQuery = { $gte: range.start, $lte: range.end };

  const [memories, schedules, wishlistOpen, mealTotal, favoriteTotal] = await Promise.all([
    MealMemory.find({ householdId: household._id, date: dateQuery })
      .populate('mealIds')
      .populate('createdBy', 'username displayName avatarUrl')
      .sort({ date: -1, createdAt: -1 }),
    Schedule.find({ householdId: household._id, date: dateQuery })
      .populate('meals.breakfast.meal')
      .populate('meals.lunch.meal')
      .populate('meals.dinner.meal')
      .sort({ date: 1 }),
    WishlistItem.countDocuments({ householdId: household._id, status: 'open' }),
    Meal.countDocuments({ householdId: household._id }),
    Meal.countDocuments({ householdId: household._id, favorite: true })
  ]);

  const mealCounter = new Map();
  memories.forEach(memory => (memory.mealIds || []).forEach(meal => increaseMeal(mealCounter, meal, 'memory', { rating: Number(memory.rating) || 0 })));
  scheduledMealEntries(schedules).forEach(entry => increaseMeal(mealCounter, entry.meal, 'schedule'));

  const topMealsList = topItems(mealCounter);
  const photos = photoWall(memories);
  const plannedCount = schedules.reduce((sum, schedule) => sum + countScheduledMeals(schedule), 0);
  const reviewedDates = new Set([...memories.map(item => item.date), ...schedules.map(item => item.date)]);

  return {
    type,
    label,
    range: { start: range.start, end: range.end },
    summary: {
      memoryCount: memories.length,
      plannedMealCount: plannedCount,
      reviewedDayCount: reviewedDates.size,
      photoCount: memories.reduce((sum, memory) => sum + (memory.photos || []).length, 0),
      wishlistOpen,
      mealTotal,
      favoriteTotal,
      sentence: summarySentence({ type, label, memoryCount: memories.length, plannedCount, topMealsList, photoCount: photos.length })
    },
    topMeals: topMealsList,
    moodStats: moodStats(memories),
    categoryStats: categoryStats(mealCounter),
    healthTagStats: healthTagStats(mealCounter),
    bestMemory: bestMemory(memories),
    photos,
    recentMemories: memories.slice(0, 8)
  };
}

exports.monthly = async (req, res, next) => {
  try {
    res.json(await buildReview(req, 'month'));
  } catch (err) { next(err); }
};

exports.yearly = async (req, res, next) => {
  try {
    res.json(await buildReview(req, 'year'));
  } catch (err) { next(err); }
};
