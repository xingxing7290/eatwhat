/**
 * 餐食日程数据模型
 * 定义日期和餐食安排的数据结构
 */
const mongoose = require('mongoose');

// 餐食日程模式定义
const scheduleSchema = new mongoose.Schema({
  // 日期 (ISO 8601 格式: "YYYY-MM-DD")
  date: {
    type: String,
    required: [true, '日期不能为空'],
    validate: {
      validator: function(v) {
        // 验证 ISO 日期格式 "YYYY-MM-DD"
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: props => `${props.value} 不是有效的日期格式，请使用 YYYY-MM-DD 格式`
    },
    // 为日期字段创建唯一索引
    unique: true
  },

  // 餐食安排
  meals: {
    // 早餐
    breakfast: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    }],

    // 午餐
    lunch: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    }],

    // 晚餐 
    dinner: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    }]
  }
});

// 创建带索引的模型
const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 