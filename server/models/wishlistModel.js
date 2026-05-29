const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  note: { type: String, trim: true, default: '' },
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', default: null },
  category: { type: String, trim: true, default: '' },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  status: { type: String, enum: ['open', 'planned', 'done'], default: 'open', index: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

wishlistSchema.index({ householdId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('WishlistItem', wishlistSchema);