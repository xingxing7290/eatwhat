const mongoose = require('mongoose');

const householdSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  inviteCode: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Household', householdSchema);