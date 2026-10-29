const MealMemory = require('../models/memoryModel');
const { ensureUserHousehold } = require('../utils/household');
const { monthRange } = require('../utils/week');
const mongoose = require('mongoose');
const { createHash } = require('crypto');

exports.month = async (req, res, next) => {
  try {
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    if (req.query.month !== undefined && (typeof req.query.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month))) return res.status(400).json({ error: '相册月份无效' });
    const range = monthRange(req.query.month);
    if (req.query.view === 'locate') {
      const { memoryId, photoIndex, fingerprint } = req.query;
      if (typeof req.query.month !== 'string' || typeof memoryId !== 'string' || !/^[a-f\d]{24}$/i.test(memoryId) || typeof photoIndex !== 'string' || !/^(0|[1-9]\d*)$/.test(photoIndex) || !Number.isSafeInteger(Number(photoIndex)) || typeof fingerprint !== 'string' || !/^[a-f\d]{64}$/i.test(fingerprint)) return res.status(400).json({ error: '照片定位参数无效' });
      const [found] = await MealMemory.aggregate([
        { $match: { householdId: household._id, date: { $gte: range.start, $lte: range.end }, photos: { $exists: true, $ne: [] } } },
        { $unwind: { path: '$photos', includeArrayIndex: 'photoIndex' } },
        { $match: { photos: { $type: 'string', $ne: '' } } },
        { $setWindowFields: { sortBy: { date: -1, createdAt: -1, _id: -1, photoIndex: 1 }, output: { position: { $sum: 1, window: { documents: ['unbounded', 'current'] } } } } },
        { $match: { _id: new mongoose.Types.ObjectId(memoryId), photoIndex: Number(photoIndex) } },
        { $project: { _id: 0, photo: '$photos', position: 1 } }, { $limit: 1 }
      ]);
      if (!found || createHash('sha256').update(found.photo).digest('hex') !== fingerprint.toLowerCase()) return res.status(404).json({ code: 'PHOTO_NOT_FOUND', error: '照片已移动、修改或不属于当前家庭' });
      return res.json({ supportsPhotoLocate: true, month: range.month, memoryId: memoryId.toLowerCase(), photoIndex: Number(photoIndex), fingerprint: fingerprint.toLowerCase(), photo: found.photo, position: found.position, page: Math.ceil(found.position / 24), limit: 24 });
    }
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
        { path: 'createdBy', match: { householdId: household._id }, select: 'username displayName avatarUrl' }
      ]);
      const total = result?.count?.[0]?.total || 0;
      return res.json({ month: range.month, photos: rows.map(({ mealIds, ...item }) => ({ ...item, meals: mealIds || [] })), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
    }
    const memories = await MealMemory.find({ householdId: household._id, date: { $gte: range.start, $lte: range.end }, photos: { $exists: true, $ne: [] } })
      .populate({ path: 'mealIds', match: { householdId: household._id } })
      .populate({ path: 'createdBy', match: { householdId: household._id }, select: 'username displayName avatarUrl' })
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
