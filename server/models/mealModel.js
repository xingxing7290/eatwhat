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
  // 新增 tags 字段
  tags: {
    type: [String],
    default: []
  },
  // 新增 ingredients 字段
  ingredients: {
    type: [{
      name: String,
      amount: String
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建菜品模型
const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal; 