const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: String, trim: true, default: '' },
  category: { type: String, enum: ['vegetable', 'meat_egg', 'staple', 'seasoning', 'other'], default: 'other', index: true },
  checked: { type: Boolean, default: false },
  manual: { type: Boolean, default: false },
  sourceMealIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Meal' }],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: true, timestamps: true });

const shoppingListSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
  weekStart: { type: String, required: true, index: true },
  generatedFrom: { type: String, trim: true, default: '' },
  items: { type: [shoppingListItemSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

shoppingListSchema.index({ householdId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
