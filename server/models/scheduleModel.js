const mongoose = require('mongoose');

const scheduleMealItemSchema = new mongoose.Schema({
  meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', index: true, default: null },
  date: {
    type: String,
    required: [true, '日期不能为空'],
    validate: {
      validator: function(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v); },
      message: props => `${props.value} 不是有效的日期格式，请使用 YYYY-MM-DD 格式`
    }
  },
  meals: {
    breakfast: [{ type: scheduleMealItemSchema }],
    lunch: [{ type: scheduleMealItemSchema }],
    dinner: [{ type: scheduleMealItemSchema }]
  }
}, { timestamps: true });

scheduleSchema.index({ householdId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);