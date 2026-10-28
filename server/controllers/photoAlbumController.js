const MealMemory = require('../models/memoryModel');
const { ensureUserHousehold } = require('../utils/household');
const { monthRange } = require('../utils/week');

exports.month = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid);
    if (req.query.month !== undefined && (typeof req.query.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month))) return res.status(400).json({ error: '相册月份无效' });
    const range = monthRange(req.query.month);
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    if (paginated) {
      const pageText = String(req.query.page ?? '1');
      const limitText = String(req.query.limit ?? '24');
      if (!/^[1-9]\d*$/.test(pageText) || !/^[1-9]\d*$/.test(limitText)) return res.status(400).json({ error: '相册分页参数无效' });
      const page = Number(pageText);
      const limit = Number(limitText);
      if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || limit > 60 || !Number.isSafeInteger((page - 1) * limit)) return res.status(400).json({ error: '相册分页参数无效' });
      const [result] = await MealMemory.aggregate([
        { $match: { householdId: household._id, date: { $gte: range.start, $lte: range.end }, photos: { $exists: true, $ne: [] } } },
        { $sort: { date: -1, createdAt: -1, _id: -1 } },
        { $unwind: { path: '$photos', includeArrayIndex: 'photoIndex' } },
        { $match: { photos: { $type: 'string', $ne: '' } } },
        { $facet: { data: [
          { $skip: (page - 1) * limit }, { $limit: limit },
          { $project: { _id: 0, memoryId: '$_id', photo: '$photos', photoIndex: 1, date: 1, mealType: 1, title: 1, mood: 1, note: 1, rating: 1, mealIds: 1, createdBy: 1 } }
        ], count: [{ $count: 'total' }] } }
      ]);
      const rows = result?.data || [];
      await MealMemory.populate(rows, [
        { path: 'mealIds', match: { householdId: household._id }, select: 'name' },
        { path: 'createdBy', select: 'username displayName avatarUrl' }
      ]);
      const total = result?.count?.[0]?.total || 0;
      return res.json({ month: range.month, photos: rows.map(({ mealIds, ...item }) => ({ ...item, meals: mealIds || [] })), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
    }
    const memories = await MealMemory.find({ householdId: household._id, date: { $gte: range.start, $lte: range.end }, photos: { $exists: true, $ne: [] } })
      .populate({ path: 'mealIds', match: { householdId: household._id } })
      .populate('createdBy', 'username displayName avatarUrl')
      .sort({ date: -1, createdAt: -1, _id: -1 });
    const photos = memories.flatMap(memory => (memory.photos || []).map((photo, photoIndex) => ({
      photo,
      photoIndex,
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
