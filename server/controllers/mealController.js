/**
 * 菜品控制器
 * 处理与菜品相关的业务逻辑
 */
const Meal = require('../models/mealModel');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 构建图片URL（优先使用环境变量指定的公共基址）
function buildImageUrl(req, filename) {
  const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
  if (publicBase) {
    const base = publicBase.replace(/\/$/, '');
    return `${base}/uploads/${filename}`;
  }

  // 尝试从反向代理头推断（例如前端Nginx在8081端口）
  try {
    const xfProto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString();
    const xfHostRaw = (req.headers['x-forwarded-host'] || req.headers['host'] || '').toString();
    const xfPort = (req.headers['x-forwarded-port'] || '').toString();

    let host = xfHostRaw;
    let portFromHost = '';

    if (host.includes(':')) {
      const [h, p] = host.split(':');
      host = h;
      portFromHost = p;
    }

    let port = xfPort || portFromHost;

    // 标准端口不附加
    const isStandardPort = (xfProto === 'https' && port === '443') || (xfProto === 'http' && port === '80');
    const portSuffix = port && !isStandardPort ? `:${port}` : '';

    if (host) {
      return `${xfProto}://${host}${portSuffix}/uploads/${filename}`;
    }
  } catch (_) {
    // 忽略错误，回退到相对路径
  }

  // 回退：相对路径，适用于同域反向代理
  return `/api/uploads/${filename}`;
}

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
    const {
      search,
      tag,
      category,
      subcategory,
      page,
      limit
    } = req.query;

    const query = {};

    if (search && String(search).trim()) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (tag && String(tag).trim()) {
      query.tags = String(tag).trim();
    }

    if (category && String(category).trim()) {
      query.category = String(category).trim();
    }

    if (subcategory && String(subcategory).trim()) {
      query.subcategory = String(subcategory).trim();
    }

    const pageNum = Number.parseInt(page, 10);
    const limitNumRaw = Number.parseInt(limit, 10);
    const hasPagination = Number.isFinite(pageNum) || Number.isFinite(limitNumRaw);

    // 保持兼容：如果没有分页参数，返回原来的数组
    if (!hasPagination) {
      const meals = await Meal.find(query).sort({ createdAt: -1 });
      return res.status(200).json(meals);
    }

    const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimitRaw = Number.isFinite(limitNumRaw) && limitNumRaw > 0 ? limitNumRaw : 20;
    const safeLimit = Math.min(safeLimitRaw, 200);

    const total = await Meal.countDocuments(query);
    const meals = await Meal.find(query)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const totalPages = safeLimit ? Math.ceil(total / safeLimit) : 1;

    return res.status(200).json({
      data: meals,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages
    });
  } catch (error) {
    logger.error(`获取菜品失败: ${error.message}`);
    next(error);
  }
};
exports.getMealCategories = async (req, res, next) => {
  try {
    const rows = await Meal.aggregate([
      {
        $group: {
          _id: {
            category: { $ifNull: ['$category', ''] },
            subcategory: { $ifNull: ['$subcategory', ''] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id.category',
          subcategory: '$_id.subcategory',
          count: 1
        }
      },
      { $sort: { category: 1, subcategory: 1 } }
    ]);

    res.status(200).json(rows);
  } catch (error) {
    logger.error(`获取菜品分类失败: ${error.message}`);
    next(error);
  }
};

exports.getMealTags = async (req, res, next) => {
  try {
    const tags = await Meal.distinct('tags');
    const out = (Array.isArray(tags) ? tags : [])
      .filter(t => t && String(t).trim())
      .map(t => String(t).trim())
      .sort((a, b) => a.localeCompare(b, 'zh'));
    res.status(200).json(out);
  } catch (error) {
    logger.error(`获取菜品标签失败: ${error.message}`);
    next(error);
  }
};

// 新增：获取单个菜品
exports.getMealById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: '无效的菜品ID' });
    }
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ error: '未找到指定菜品' });
    }
    res.status(200).json(meal);
  } catch (error) {
    logger.error(`获取菜品详情失败: ${error.message}`);
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
      const filename = req.file.filename;
      mealData.imageUrl = buildImageUrl(req, filename);
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
      const filename = req.file.filename;
      updateData.imageUrl = buildImageUrl(req, filename);
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