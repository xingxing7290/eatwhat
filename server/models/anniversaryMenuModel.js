const mongoose = require('mongoose');

const menuMealsSchema = new mongoose.Schema({
  breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
  lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
  dinner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }]
}, { _id: false });

const anniversaryMenuSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  date: { type: String, required: true, index: true },
  description: { type: String, trim: true, default: '' },
  theme: { type: String, trim: true, default: '' },
  photos: { type: [String], default: [] },
  meals: { type: menuMealsSchema, default: () => ({ breakfast: [], lunch: [], dinner: [] }) },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

anniversaryMenuSchema.index({ householdId: 1, date: 1 });

module.exports = mongoose.model('AnniversaryMenu', anniversaryMenuSchema);