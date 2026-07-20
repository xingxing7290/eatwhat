const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { ensureUserHousehold } = require('../utils/household');

function normalizeMealItems(scheduleDoc) {
	if (!scheduleDoc || !scheduleDoc.meals) return;
	for (const mealType of ['breakfast', 'lunch', 'dinner']) {
		const arr = scheduleDoc.meals[mealType];
		if (!Array.isArray(arr)) continue;
		scheduleDoc.meals[mealType] = arr.map(item => {
			if (!item) return null;
			if (typeof item === 'object' && item.meal !== undefined) return item;
			return { meal: item, addedBy: null };
		}).filter(Boolean);
	}
}

function isMobileClient(req) {
	return req.headers['x-mobile-client'] === 'eatwhat-flutter';
}
function compactSchedule(schedule) {
	const compactItems = items => (items || []).map(item => {
		const meal = item && item.meal ? item.meal : item;
		return {
			meal: meal && meal._id ? { _id: meal._id, id: meal._id, name: meal.name || '' } : meal
		};
	});
	return {
		date: schedule.date,
		meals: {
			breakfast: compactItems(schedule.meals?.breakfast),
			lunch: compactItems(schedule.meals?.lunch),
			dinner: compactItems(schedule.meals?.dinner)
		}
	};
}

function fillMissingAddedBy(scheduleDoc, uid) {
	if (!uid || !scheduleDoc || !scheduleDoc.meals) return false;
	const uidObj = mongoose.Types.ObjectId.isValid(uid) ? new mongoose.Types.ObjectId(uid) : null;
	if (!uidObj) return false;
	for (const mealType of ['breakfast', 'lunch', 'dinner']) {
		const arr = scheduleDoc.meals[mealType];
		if (!Array.isArray(arr)) continue;
		for (const item of arr) {
			if (item && typeof item === 'object' && !item.addedBy) item.addedBy = uidObj;
		}
	}
}

exports.validateSchedulesQuery = [
  query('year').notEmpty().withMessage('年份参数不能为空').isInt({ min: 2000, max: 2100 }).withMessage('年份无效'),
  query('month').notEmpty().withMessage('月份参数不能为空').isInt({ min: 1, max: 12 }).withMessage('月份无效 (1-12)')
];

exports.validateScheduleDate = [
  param('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date format, use YYYY-MM-DD')
];

exports.validateScheduleUpdate = [
  param('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('日期格式无效，请使用YYYY-MM-DD格式'),
  param('mealType').isIn(['breakfast', 'lunch', 'dinner']).withMessage('餐食类型无效，有效值为: breakfast, lunch, dinner'),
  body('mealIds').isArray().withMessage('mealIds必须是一个数组')
];

exports.getSchedules = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid);
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const schedulesInDb = await Schedule.find({
      householdId: household._id,
      date: { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] }
    });
    schedulesInDb.forEach(s => normalizeMealItems(s));
    schedulesInDb.forEach(s => fillMissingAddedBy(s, req.user.uid));
    await Schedule.populate(schedulesInDb, [
      { path: 'meals.breakfast.meal' },
      { path: 'meals.lunch.meal' },
      { path: 'meals.dinner.meal' },
      { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
    ]);
    const scheduleMap = new Map(schedulesInDb.map(s => [s.date, s]));
    const fullMonthSchedules = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      fullMonthSchedules.push(scheduleMap.get(currentDateStr) || { date: currentDateStr, meals: { breakfast: [], lunch: [], dinner: [] } });
    }
    res.status(200).json(fullMonthSchedules);
  } catch (error) { logger.error(`获取餐食安排失败: ${error.message}`); next(error); }
};

exports.getScheduleByDate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid);
    const { date } = req.params;
    const schedule = await Schedule.findOne({ householdId: household._id, date });
    if (!schedule) {
      return res.status(200).json({ date, meals: { breakfast: [], lunch: [], dinner: [] } });
    }
    normalizeMealItems(schedule);
    fillMissingAddedBy(schedule, req.user.uid);
    await schedule.populate([
      { path: 'meals.breakfast.meal' },
      { path: 'meals.lunch.meal' },
      { path: 'meals.dinner.meal' },
      { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
    ]);
    res.status(200).json(isMobileClient(req) ? compactSchedule(schedule) : schedule);
  } catch (error) { logger.error(`Failed to get daily schedule: ${error.message}`); next(error); }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid);
    const { date, mealType } = req.params;
    const mealIds = Array.isArray(req.body.mealIds) ? req.body.mealIds.filter(Boolean) : [];
    if (mealIds.length > 0) {
      const meals = await Meal.find({ _id: { $in: mealIds }, householdId: household._id });
      if (meals.length !== mealIds.length) return res.status(400).json({ error: '一个或多个菜品ID无效' });
    }
    const updateData = { householdId: household._id };
    updateData[`meals.${mealType}`] = mealIds.map(mealId => ({ meal: mealId, addedBy: req.user.uid || null }));
    const schedule = await Schedule.findOneAndUpdate(
      { householdId: household._id, date },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).populate([
      { path: 'meals.breakfast.meal' },
      { path: 'meals.lunch.meal' },
      { path: 'meals.dinner.meal' },
      { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
    ]);
    res.status(200).json(schedule);
  } catch (error) { logger.error(`更新餐食安排失败: ${error.message}`); next(error); }
};