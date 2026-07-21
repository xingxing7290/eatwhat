const mongoose = require('mongoose');

const guestOrderItemSchema = new mongoose.Schema({
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  defaultKey: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 1
  },
  note: {
    type: String,
    trim: true,
    maxlength: 120,
    default: ''
  }
}, { _id: false });

const guestOrderSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GuestOrderSession',
    required: true,
    index: true
  },
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: true,
    index: true
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  accessToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    select: false
  },
  items: {
    type: [guestOrderItemSchema],
    validate: {
      validator: items => Array.isArray(items) && items.length > 0 && items.length <= 50,
      message: '每份订单需选择 1 至 50 道菜'
    }
  },
  note: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  },
  revision: {
    type: Number,
    min: 1,
    default: 1
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

guestOrderSchema.index({ sessionId: 1, createdAt: 1 });
guestOrderSchema.index({ householdId: 1, createdAt: -1 });

module.exports = mongoose.model('GuestOrder', guestOrderSchema);
