const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  amount: { type: String, trim: true }
}, { _id: false });

const stepSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  imageUrl: { type: String, trim: true, default: '' }
}, { _id: false });

const mealSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', index: true, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: [true, '菜品名称不能为空'], trim: true, maxlength: [100, '菜品名称不能超过100个字符'] },
  category: { type: String, trim: true, index: true, default: '' },
  subcategory: { type: String, trim: true, index: true, default: '' },
  imageUrl: { type: String, trim: true, default: '' },
  photos: { type: [String], default: [] },
  description: { type: String, trim: true, maxlength: [1000, '菜品描述不能超过1000个字符'], default: '' },
  tags: { type: [String], default: [] },
  ingredients: { type: [ingredientSchema], default: [] },
  steps: { type: [stepSchema], default: [] },
  tips: { type: String, trim: true, default: '' },
  servingSize: { type: String, trim: true, default: '' },
  prepTime: { type: Number, default: 0, min: 0 },
  cookTime: { type: Number, default: 0, min: 0 },
  difficulty: { type: String, enum: ['', 'easy', 'medium', 'hard'], default: '' },
  taste: { type: [String], default: [] },
  spiceLevel: { type: Number, default: 0, min: 0, max: 5 },
  source: { type: String, trim: true, default: '' },
  sourcePath: { type: String, trim: true, default: '' },
  isDefault: { type: Boolean, default: false, index: true },
  defaultKey: { type: String, trim: true, default: '', index: true },
  favorite: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

mealSchema.index({ householdId: 1, createdAt: -1 });
mealSchema.index({ householdId: 1, category: 1, subcategory: 1 });
mealSchema.index({ householdId: 1, isDefault: 1, defaultKey: 1 });

module.exports = mongoose.model('Meal', mealSchema);
