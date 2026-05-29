const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, index: true, trim: true },
	displayName: { type: String, default: '', trim: true },
	avatarUrl: { type: String, default: '', trim: true },
	passwordHash: { type: String, required: true },
	role: { type: String, enum: ['admin', 'user'], default: 'user' },
	householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', index: true, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);