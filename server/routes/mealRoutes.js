/**
 * 菜品路由模块
 * 定义与菜品相关的 API 路由
 */
const express = require('express');
const mealController = require('../controllers/mealController');
const upload = require('../middleware/upload');
const router = express.Router();

// GET /meals - 获取所有菜品
router.get('/', mealController.getAllMeals);

// POST /meals - 创建新菜品 (带图片上传)
router.post('/', upload.single('image'), mealController.validateMeal, mealController.createMeal);

// PUT /meals/:id - 更新菜品 (带图片上传)
router.put('/:id', upload.single('image'), mealController.validateMeal, mealController.updateMeal);

// DELETE /meals/:id - 删除菜品
router.delete('/:id', mealController.deleteMeal);

module.exports = router; 