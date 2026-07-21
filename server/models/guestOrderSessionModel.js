const mongoose = require('mongoose');

const guestOrderSessionSchema = new mongoose.Schema({
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Household',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '来家里吃饭'
  },
  eventAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'locked', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  shareToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
    select: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  closedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

guestOrderSessionSchema.index({ householdId: 1, status: 1, createdAt: -1 });
guestOrderSessionSchema.index({ householdId: 1, createdAt: -1 });

module.exports = mongoose.model('GuestOrderSession', guestOrderSessionSchema);
