/**
 * 餐食日程路由模块
 * 定义与餐食日程相关的 API 路由
 */
const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /schedules?year=YYYY&month=M - 获取特定月份的餐食安排
router.get('/', auth(), scheduleController.validateSchedulesQuery, scheduleController.getSchedules);

// GET /schedules/day/:date - get daily meal schedule
router.get('/day/:date', auth(), scheduleController.validateScheduleDate, scheduleController.getScheduleByDate);

// PUT /schedules/:date/:mealType - update meals for a date and meal type
router.put('/:date/:mealType', auth(), scheduleController.validateScheduleUpdate, scheduleController.updateSchedule);

module.exports = router;
