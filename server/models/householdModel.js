const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const householdSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  nameRevision: { type: String, default: null },
  inviteCode: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Maintenance code using document.save() must also invalidate stale name edits.
householdSchema.pre('save', function () {
  if (this.isModified('name')) this.nameRevision = randomUUID();
});

module.exports = mongoose.model('Household', householdSchema);
