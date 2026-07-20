const MealMemory = require('../models/memoryModel');
const { ensureUserHousehold } = require('../utils/household');
const { monthRange } = require('../utils/week');

exports.month = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    const range = monthRange(req.query.month);
    const memories = await MealMemory.find({ householdId: household._id, date: { $gte: range.start, $lte: range.end }, photos: { $exists: true, $ne: [] } })
      .populate('mealIds')
      .populate('createdBy', 'username displayName avatarUrl')
      .sort({ date: -1, createdAt: -1 });
    const photos = memories.flatMap(memory => (memory.photos || []).map(photo => ({
      photo,
      memoryId: memory._id,
      date: memory.date,
      mealType: memory.mealType,
      title: memory.title,
      mood: memory.mood,
      note: memory.note,
      rating: memory.rating,
      meals: memory.mealIds || [],
      createdBy: memory.createdBy
    })));
    res.json({ month: range.month, photos });
  } catch (err) { next(err); }
};
