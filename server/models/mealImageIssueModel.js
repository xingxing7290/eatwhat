const mongoose = require('mongoose');

const mealImageIssueSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true, index: true },
  issueType: { type: String, enum: ['wrong_image', 'missing_image', 'low_quality', 'other'], default: 'wrong_image', index: true },
  note: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['open', 'fixed', 'ignored'], default: 'open', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

mealImageIssueSchema.index({ householdId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MealImageIssue', mealImageIssueSchema);
