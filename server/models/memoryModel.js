const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  date: { type: String, required: true, index: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'], default: 'other' },
  title: { type: String, trim: true, default: '' },
  note: { type: String, trim: true, default: '' },
  mood: { type: String, trim: true, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  actualCookTime: { type: Number, default: 0, min: 0 },
  nextImprovement: { type: String, trim: true, default: '' },
  photos: { type: [String], default: [] },
  mealIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

memorySchema.index({ householdId: 1, date: -1 });
memorySchema.index({ householdId: 1, mealIds: 1 });

module.exports = mongoose.model('MealMemory', memorySchema);