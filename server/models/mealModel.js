/**
 * 菜品数据模型
 * 定义菜品的数据结构和验证规则
 */
const mongoose = require('mongoose');

// 菜品模式定义
const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '菜品名称不能为空'],
    trim: true,
    maxlength: [100, '菜品名称不能超过100个字符']
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    index: true
  },
  imageUrl: {
    type: String,
    trim: true
    // 移除了过于严格的URL验证，因为现在URL由后端生成，是可信的
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '菜品描述不能超过500个字符']
  },
  tags: {
    type: [String],
    default: []
  },
  ingredients: {
    type: [{
      name: String,
      amount: String
    }],
    default: []
  },
  steps: {
    type: [String],
    default: []
  },
  source: {
    type: String,
    trim: true
  },
  sourcePath: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建菜品模型
const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;