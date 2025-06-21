/**
 * 菜品控制器
 * 处理与菜品相关的业务逻辑
 */
const Meal = require('../models/mealModel');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 验证中间件
exports.validateMeal = [
  body('name')
    .notEmpty().withMessage('菜品名称不能为空')
    .isLength({ max: 100 }).withMessage('菜品名称不能超过100个字符'),
  
  // imageUrl 不再是必填项，也无需验证URL格式，因为它将由后端生成
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('菜品描述不能超过500个字符')
];

// 获取所有菜品
exports.getAllMeals = async (req, res, next) => {
  try {
    // 查询所有菜品
    const meals = await Meal.find().sort({ createdAt: -1 });
    
    res.status(200).json(meals);
  } catch (error) {
    logger.error(`获取菜品失败: ${error.message}`);
    next(error);
  }
};

// 创建新菜品
exports.createMeal = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mealData = { ...req.body };

    // 解析可能为 JSON 字符串的字段
    try {
      if (mealData.tags && typeof mealData.tags === 'string') {
        mealData.tags = JSON.parse(mealData.tags);
      }
      if (mealData.ingredients && typeof mealData.ingredients === 'string') {
        mealData.ingredients = JSON.parse(mealData.ingredients);
      }
    } catch (e) {
      logger.error(`解析字段失败: ${e.message}`);
      return res.status(400).json({ error: 'tags 或 ingredients 字段格式不是有效的JSON字符串。' });
    }

    // 如果有文件上传，则生成图片URL
    if (req.file) {
      // 将 Windows 风格的路径分隔符 \ 替换为 /
      const filePath = req.file.path.replace(/\\/g, '/');
      mealData.imageUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    }

    // 创建新菜品
    const newMeal = await Meal.create(mealData);
    
    // 返回成功响应
    res.status(201).json(newMeal);
  } catch (error) {
    logger.error(`创建菜品失败: ${error.message}`);
    next(error);
  }
};

// 更新菜品
exports.updateMeal = async (req, res, next) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };

    // 解析可能为 JSON 字符串的字段
    try {
      if (updateData.tags && typeof updateData.tags === 'string') {
        updateData.tags = JSON.parse(updateData.tags);
      }
      if (updateData.ingredients && typeof updateData.ingredients === 'string') {
        updateData.ingredients = JSON.parse(updateData.ingredients);
      }
    } catch (e) {
      logger.error(`解析字段失败: ${e.message}`);
      return res.status(400).json({ error: 'tags 或 ingredients 字段格式不是有效的JSON字符串。' });
    }

    // 如果有新文件上传，则更新图片URL
    if (req.file) {
      // 将 Windows 风格的路径分隔符 \ 替换为 /
      const filePath = req.file.path.replace(/\\/g, '/');
      updateData.imageUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
      // 注意：这里可以添加逻辑来删除旧图片
    }

    // 查找并更新菜品
    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // 检查菜品是否存在
    if (!updatedMeal) {
      return res.status(404).json({ error: '未找到指定菜品' });
    }
    
    // 返回更新后的菜品
    res.status(200).json(updatedMeal);
  } catch (error) {
    logger.error(`更新菜品失败: ${error.message}`);
    next(error);
  }
};

// 删除菜品
exports.deleteMeal = async (req, res, next) => {
  try {
    // 查找并删除菜品
    const deletedMeal = await Meal.findByIdAndDelete(req.params.id);
    
    // 检查菜品是否存在
    if (!deletedMeal) {
      return res.status(404).json({ error: '未找到指定菜品' });
    }
    
    // 返回204状态码（无内容）
    res.status(204).send();
  } catch (error) {
    logger.error(`删除菜品失败: ${error.message}`);
    next(error);
  }
}; 