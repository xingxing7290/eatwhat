const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Household = require('../models/householdModel');
const { createHousehold, ensureUserHousehold, householdPayload, withCurrentMembers } = require('../utils/household');
const { cleanDisplayName, cleanHouseholdName, looksBrokenText } = require('../utils/text');
const { buildUploadUrl } = require('../utils/uploadUrl');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

function toSafeUser(userDoc, household = null) {
	if (!userDoc) return null;
	return {
		id: userDoc._id,
		username: userDoc.username,
		role: userDoc.role,
		displayName: cleanDisplayName(userDoc.displayName, userDoc.username),
		avatarUrl: userDoc.avatarUrl || '',
		householdId: userDoc.householdId || null,
		household: householdPayload(household)
	};
}

exports.register = async (req, res, next) => {
	try {
		const { username, password, displayName, inviteCode, householdName } = req.body;
		const safeUsername = typeof username === 'string' ? username.trim() : '';
		const safeDisplayName = cleanDisplayName(displayName, safeUsername);
		if (!safeUsername || !password) return res.status(400).json({ error: '\u7528\u6237\u540d\u548c\u5bc6\u7801\u5fc5\u586b' });
		const existed = await User.findOne({ username: safeUsername });
		if (existed) return res.status(409).json({ error: '\u7528\u6237\u540d\u5df2\u5b58\u5728' });

		let household = null;
		if (inviteCode && String(inviteCode).trim()) {
			household = await Household.findOne({ inviteCode: String(inviteCode).trim().toUpperCase() });
			if (!household) return res.status(404).json({ error: '\u9080\u8bf7\u7801\u65e0\u6548' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		let user = await User.create({ username: safeUsername, displayName: safeDisplayName, passwordHash, householdId: household ? household._id : null });

		if (!household) {
			const fallbackName = `${safeDisplayName || safeUsername}\u7684\u5c0f\u5bb6`;
			const name = cleanHouseholdName(householdName, fallbackName);
			household = await createHousehold(name, user._id);
			const claimed = await User.findOneAndUpdate({ _id: user._id, householdId: null }, { $set: { householdId: household._id } }, { new: true });
			if (!claimed) return res.status(409).json({ code: 'ACCOUNT_SETUP_CONFLICT', error: '账号已创建，但家庭状态发生变化，请登录核对' });
			user = claimed;
		} else {
			await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
		}

		const currentHousehold = await withCurrentMembers(household, user._id);
		return res.status(201).json({ user: toSafeUser(user, currentHousehold), household: householdPayload(currentHousehold) });
	} catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
		const user = await User.findOne({ username });
		if (!user) return res.status(401).json({ error: '用户名或密码错误' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: '用户名或密码错误' });
		const { user: currentUser, household } = await ensureUserHousehold(user._id);
		const currentHousehold = await withCurrentMembers(household, currentUser._id);
		const token = jwt.sign({ uid: currentUser._id, username: currentUser.username, role: currentUser.role, householdId: currentUser.householdId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
		if (req.headers['x-mobile-client'] === 'eatwhat-flutter') {
			return res.json({
				token,
				user: {
					id: currentUser._id,
					username: currentUser.username,
					displayName: cleanDisplayName(currentUser.displayName, currentUser.username),
					role: currentUser.role,
					householdId: currentUser.householdId || null
				},
				household: currentHousehold ? {
					id: currentHousehold._id,
					name: cleanHouseholdName(currentHousehold.name),
					inviteCode: currentHousehold.inviteCode
				} : null
			});
		}
		return res.json({ token, user: toSafeUser(currentUser, currentHousehold), household: householdPayload(currentHousehold) });
	} catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		const { user, household } = await ensureUserHousehold(uid, 0, req.expectedHouseholdId);
		const currentHousehold = await withCurrentMembers(household, uid);
		return res.json({ user: toSafeUser(user, currentHousehold), household: householdPayload(currentHousehold) });
	} catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '\u672a\u8ba4\u8bc1' });
		const { displayName } = req.body;
		const safeDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
		if (looksBrokenText(safeDisplayName)) return res.status(400).json({ error: '\u6635\u79f0\u770b\u8d77\u6765\u662f\u4e71\u7801\uff0c\u8bf7\u91cd\u65b0\u8f93\u5165' });
		const user = await User.findByIdAndUpdate(uid, { $set: { displayName: safeDisplayName } }, { new: true });
		if (!user) return res.status(404).json({ error: '\u7528\u6237\u4e0d\u5b58\u5728' });
		const { user: currentUser, household } = await ensureUserHousehold(uid, 0, req.expectedHouseholdId);
		const currentHousehold = await withCurrentMembers(household, uid);
		return res.json({ user: toSafeUser(currentUser, currentHousehold), household: householdPayload(currentHousehold) });
	} catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		if (!req.file) return res.status(400).json({ error: '请上传头像图片' });
		const avatarUrl = buildUploadUrl(req, req.file.filename);
		const user = await User.findByIdAndUpdate(uid, { $set: { avatarUrl } }, { new: true });
		if (!user) return res.status(404).json({ error: '用户不存在' });
		const { user: currentUser, household } = await ensureUserHousehold(uid, 0, req.expectedHouseholdId);
		const currentHousehold = await withCurrentMembers(household, uid);
		return res.json({ user: toSafeUser(currentUser, currentHousehold), household: householdPayload(currentHousehold) });
	} catch (err) { next(err); }
};

exports.toSafeUser = toSafeUser;
