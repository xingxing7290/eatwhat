const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

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
  },
  editRevision: { type: String, default: null },
  creationFingerprint: { type: String, default: null, select: false }
}, { timestamps: true });

guestOrderSessionSchema.pre('save', function () { this.editRevision = randomUUID(); });
for (const operation of ['findOneAndUpdate', 'updateOne', 'updateMany']) {
  guestOrderSessionSchema.pre(operation, function () {
    const update = this.getUpdate();
    if (Array.isArray(update)) update.push({ $set: { editRevision: randomUUID() } });
    else this.set({ editRevision: randomUUID() });
  });
}

guestOrderSessionSchema.index({ householdId: 1, status: 1, createdAt: -1 });
guestOrderSessionSchema.index({ householdId: 1, createdAt: -1 });

module.exports = mongoose.model('GuestOrderSession', guestOrderSessionSchema);
