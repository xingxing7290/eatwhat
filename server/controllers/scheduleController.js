/**
 * 餐食日程控制器
 * 处理与餐食安排相关的业务逻辑
 */
const Schedule = require('../models/scheduleModel');
const Meal = require('../models/mealModel');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

function normalizeMealItems(scheduleDoc) {
	if (!scheduleDoc || !scheduleDoc.meals) return;
	for (const mealType of ['breakfast', 'lunch', 'dinner']) {
		const arr = scheduleDoc.meals[mealType];
		if (!Array.isArray(arr)) continue;
		scheduleDoc.meals[mealType] = arr
			.map(item => {
				if (!item) return null;

				// New shape already
				if (typeof item === 'object' && item.meal !== undefined) return item;

				// Some legacy data may be a populated meal doc or an ObjectId/string
				return { meal: item, addedBy: null };
			})
			.filter(Boolean);
	}
}

function fillMissingAddedBy(scheduleDoc, uid) {
	if (!uid || !scheduleDoc || !scheduleDoc.meals) return false;
	const uidObj = mongoose.Types.ObjectId.isValid(uid) ? new mongoose.Types.ObjectId(uid) : null;
	if (!uidObj) return false;
	let changed = false;
	for (const mealType of ['breakfast', 'lunch', 'dinner']) {
		const arr = scheduleDoc.meals[mealType];
		if (!Array.isArray(arr)) continue;
		for (const item of arr) {
			if (!item || typeof item !== 'object') continue;
			if (!item.addedBy) {
				item.addedBy = uidObj;
				changed = true;
			}
		}
	}
	return changed;
}

function toObjectIdOrNull(v) {
	if (!v) return null;
	if (v instanceof mongoose.Types.ObjectId) return v;
	if (typeof v === 'string' && mongoose.Types.ObjectId.isValid(v)) return new mongoose.Types.ObjectId(v);
	return null;
}

// 按月查询的验证中间件
exports.validateSchedulesQuery = [
  query('year')
    .notEmpty().withMessage('年份参数不能为空')
    .isInt({ min: 2000, max: 2100 }).withMessage('年份无效'),
  query('month')
    .notEmpty().withMessage('月份参数不能为空')
    .isInt({ min: 1, max: 12 }).withMessage('月份无效 (1-12)')
];

// 按日期和餐类更新的验证中间件
exports.validateScheduleUpdate = [
  param('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('日期格式无效，请使用YYYY-MM-DD格式'),
  
  param('mealType')
    .isIn(['breakfast', 'lunch', 'dinner']).withMessage('餐食类型无效，有效值为: breakfast, lunch, dinner'),
  
  body('mealIds')
    .isArray().withMessage('mealIds必须是一个数组')
    .custom(async (mealIds) => {
      // 验证所有餐食ID是否有效
      if (mealIds.length === 0) return true;
      
      const meals = await Meal.find({ _id: { $in: mealIds } });
      if (meals.length !== mealIds.length) {
        throw new Error('一个或多个菜品ID无效');
      }
      return true;
    })
];

// 获取某月餐食安排 (原 getSchedule)
exports.getSchedules = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year, month } = req.query;
    const uid = req.user && req.user.uid;

    // 计算查询月份的开始和结束日期
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // day=0 会获取上个月的最后一天

    // 查询数据库中在一个月范围内的所有日程
    const schedulesInDb = await Schedule.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    });

    // 兼容旧数据：先把旧结构归一化成 { meal, addedBy }，再做 populate
    schedulesInDb.forEach(s => normalizeMealItems(s));
    schedulesInDb.forEach(s => fillMissingAddedBy(s, uid));

    await Schedule.populate(schedulesInDb, [
      { path: 'meals.breakfast.meal' },
      { path: 'meals.lunch.meal' },
      { path: 'meals.dinner.meal' },
      { path: 'meals.breakfast.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.lunch.addedBy', select: 'username displayName avatarUrl' },
      { path: 'meals.dinner.addedBy', select: 'username displayName avatarUrl' }
    ]);

    // 创建一个Map，方便通过日期快速查找已存在的日程
    const scheduleMap = new Map(schedulesInDb.map(s => [s.date, s]));

    const fullMonthSchedules = [];
    const daysInMonth = endDate.getDate();

    // 遍历该月的每一天
    for (let day = 1; day <= daysInMonth; day++) {
      // 格式化日期为 "YYYY-MM-DD"
      const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (scheduleMap.has(currentDateStr)) {
        // 如果数据库中存在这一天的日程，则使用它
        fullMonthSchedules.push(scheduleMap.get(currentDateStr));
      } else {
        // 如果不存在，则创建一个默认的空日程对象
        fullMonthSchedules.push({
          date: currentDateStr,
          meals: {
            breakfast: [],
            lunch: [],
            dinner: []
          }
        });
      }
    }
    
    res.status(200).json(fullMonthSchedules);
  } catch (error) {
    logger.error(`获取餐食安排失败: ${error.message}`);
    next(error);
  }
};

// 更新餐食安排
exports.updateSchedule = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, mealType } = req.params;
    const { mealIds } = req.body;

    const uid = req.user && req.user.uid;
    const mealItems = Array.isArray(mealIds)
      ? mealIds.map(mealId => ({ meal: mealId, addedBy: uid || null }))
      : [];
    
    // 使用 upsert 选项，如果不存在则创建
    const updateData = {};
    updateData[`meals.${mealType}`] = mealItems;
    
    // 查找并更新（或创建）餐食安排
    const schedule = await Schedule.findOneAndUpdate(
      { date },
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
  } catch (error) {
    logger.error(`更新餐食安排失败: ${error.message}`);
    next(error);
  }
}; 