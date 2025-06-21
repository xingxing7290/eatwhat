/**
 * 餐食日程路由模块
 * 定义与餐食日程相关的 API 路由
 */
const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const router = express.Router();

// GET /schedules?year=YYYY&month=M - 获取特定月份的餐食安排
router.get('/', scheduleController.validateSchedulesQuery, scheduleController.getSchedules);

// PUT /schedules/:date/:mealType - 更新特定日期和餐食类型的安排
router.put('/:date/:mealType', scheduleController.validateScheduleUpdate, scheduleController.updateSchedule);

module.exports = router; 