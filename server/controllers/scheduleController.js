const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { ensureUserHousehold } = require('../utils/household');
const { retainedMealAssignments, scheduleUpdatePipeline } = require('../utils/scheduleAssignments');
const { schedulePopulation } = require('../utils/schedulePopulation');

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
		const meal = item && typeof item === 'object' && 'meal' in item ? item.meal : item;
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
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const { year, month } = req.query;
    const endDate = new Date(year, month, 0);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const schedulesInDb = await Schedule.find({
      householdId: household._id,
      date: { $gte: `${monthPrefix}-01`, $lte: `${monthPrefix}-${String(endDate.getDate()).padStart(2, '0')}` }
    });
    schedulesInDb.forEach(s => normalizeMealItems(s));
    await Schedule.populate(schedulesInDb, schedulePopulation(household._id));
    const scheduleMap = new Map(schedulesInDb.map(s => [s.date, s]));
    const fullMonthSchedules = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = scheduleMap.get(currentDateStr);
      fullMonthSchedules.push(schedule ? {
        ...schedule.toObject(), scheduleExists: true,
        scheduleVersion: schedule.updatedAt ? schedule.updatedAt.toISOString() : null
      } : { date: currentDateStr, meals: { breakfast: [], lunch: [], dinner: [] }, scheduleExists: false, scheduleVersion: null });
    }
    res.status(200).json(fullMonthSchedules);
  } catch (error) { logger.error(`获取餐食安排失败: ${error.message}`); next(error); }
};

exports.getScheduleByDate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const { date } = req.params;
    const schedule = await Schedule.findOne({ householdId: household._id, date });
    if (!schedule) {
      return res.status(200).json({ date, meals: { breakfast: [], lunch: [], dinner: [] }, scheduleExists: false, scheduleVersion: null });
    }
    normalizeMealItems(schedule);
    await schedule.populate(schedulePopulation(household._id));
    res.status(200).json(isMobileClient(req) ? compactSchedule(schedule) : {
      ...schedule.toObject(), scheduleExists: true,
      scheduleVersion: schedule.updatedAt ? schedule.updatedAt.toISOString() : null
    });
  } catch (error) { logger.error(`Failed to get daily schedule: ${error.message}`); next(error); }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { household } = await ensureUserHousehold(req.user.uid, 0, req.expectedHouseholdId);
    const { date, mealType } = req.params;
    const conditional = Object.prototype.hasOwnProperty.call(req.body, 'expectedVersion');
    const expectedVersion = req.body.expectedVersion;
    if (conditional && expectedVersion !== null &&
        (typeof expectedVersion !== 'string' || !Number.isFinite(Date.parse(expectedVersion)))) {
      return res.status(400).json({ error: '餐食安排版本无效，请重新加载' });
    }
    const mealIds = Array.isArray(req.body.mealIds) ? req.body.mealIds.filter(Boolean) : [];
    if (mealIds.length > 0) {
      if (mealIds.some(id => typeof id !== 'string' || !mongoose.isValidObjectId(id))) return res.status(400).json({ error: '一个或多个菜品ID无效' });
      const meals = await Meal.find({ _id: { $in: mealIds }, householdId: household._id });
      if (meals.length !== mealIds.length) return res.status(400).json({ error: '一个或多个菜品ID无效' });
    }
    const updateData = { householdId: household._id };
    updateData[`meals.${mealType}`] = mealIds.map(mealId => ({ meal: mealId, addedBy: req.user.uid || null }));
    const population = schedulePopulation(household._id);
    let schedule;
    if (conditional && expectedVersion === null) {
      try {
        schedule = await Schedule.create({
          householdId: household._id, date,
          meals: { [mealType]: updateData[`meals.${mealType}`] }
        });
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ code: 'SCHEDULE_CONFLICT', error: '餐食安排已被更新，请重新加载' });
        throw error;
      }
      await schedule.populate(population);
    } else {
      const filter = { householdId: household._id, date };
      if (conditional) filter.updatedAt = new Date(expectedVersion);
      const assignment = retainedMealAssignments(mealType, mealIds, req.user.uid);
      const pipeline = scheduleUpdatePipeline(household._id, { [`meals.${mealType}`]: assignment });
      const updateExisting = () => Schedule.findOneAndUpdate(filter, pipeline, { new: true, upsert: false, runValidators: true, timestamps: false }).populate(population);
      schedule = await updateExisting();
      // Pipeline upserts do not populate Mongoose's createdAt. Insert a new
      // document explicitly; if another writer inserted first, retry atomically.
      if (!schedule && !conditional) {
        try {
          schedule = await Schedule.create({ householdId: household._id, date, meals: { [mealType]: updateData[`meals.${mealType}`] } });
          await schedule.populate(population);
        } catch (error) {
          if (error.code !== 11000) throw error;
          schedule = await updateExisting();
        }
      }
      if (!schedule) return res.status(409).json({ code: 'SCHEDULE_CONFLICT', error: '餐食安排已被更新，请重新加载' });
    }
    res.status(200).json(schedule);
  } catch (error) { logger.error(`更新餐食安排失败: ${error.message}`); next(error); }
};
