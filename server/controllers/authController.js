const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Household = require('../models/householdModel');
const { createHousehold, ensureUserHousehold, householdPayload } = require('../utils/household');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

function buildAvatarUrl(req, filename) {
	const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
	if (publicBase) return `${publicBase.replace(/\/$/, '')}/uploads/${filename}`;
	try {
		const xfProto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString();
		const xfHostRaw = (req.headers['x-forwarded-host'] || req.headers['host'] || '').toString();
		const xfPort = (req.headers['x-forwarded-port'] || '').toString();
		let host = xfHostRaw;
		let portFromHost = '';
		if (host.includes(':')) {
			const [h, p] = host.split(':');
			host = h;
			portFromHost = p;
		}
		const port = xfPort || portFromHost;
		const isStandardPort = (xfProto === 'https' && port === '443') || (xfProto === 'http' && port === '80');
		const portSuffix = port && !isStandardPort ? `:${port}` : '';
		if (host) return `${xfProto}://${host}${portSuffix}/uploads/${filename}`;
	} catch (_) {}
	return `/api/uploads/${filename}`;
}

function toSafeUser(userDoc, household = null) {
	if (!userDoc) return null;
	return {
		id: userDoc._id,
		username: userDoc.username,
		role: userDoc.role,
		displayName: userDoc.displayName || '',
		avatarUrl: userDoc.avatarUrl || '',
		householdId: userDoc.householdId || null,
		household: householdPayload(household)
	};
}

exports.register = async (req, res, next) => {
	try {
		const { username, password, displayName, inviteCode, householdName } = req.body;
		const safeUsername = typeof username === 'string' ? username.trim() : '';
		const safeDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
		if (!safeUsername || !password) return res.status(400).json({ error: '用户名和密码必填' });
		const existed = await User.findOne({ username: safeUsername });
		if (existed) return res.status(409).json({ error: '用户名已存在' });

		let household = null;
		if (inviteCode && String(inviteCode).trim()) {
			household = await Household.findOne({ inviteCode: String(inviteCode).trim().toUpperCase() });
			if (!household) return res.status(404).json({ error: '邀请码无效' });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ username: safeUsername, displayName: safeDisplayName, passwordHash, householdId: household ? household._id : null });

		if (!household) {
			const name = householdName && String(householdName).trim() ? String(householdName).trim() : `${safeDisplayName || safeUsername}的小家`;
			household = await createHousehold(name, user._id);
			user.householdId = household._id;
			await user.save();
		} else {
			await Household.updateOne({ _id: household._id }, { $addToSet: { members: user._id } });
		}

		return res.status(201).json({ user: toSafeUser(user, household), household: householdPayload(household) });
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
		const { household } = await ensureUserHousehold(user._id);
		const token = jwt.sign({ uid: user._id, username: user.username, role: user.role, householdId: user.householdId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
		if (req.headers['x-mobile-client'] === 'eatwhat-flutter') {
			return res.json({
				token,
				user: {
					id: user._id,
					username: user.username,
					displayName: user.displayName || '',
					role: user.role,
					householdId: user.householdId || null
				},
				household: household ? {
					id: household._id,
					name: household.name,
					inviteCode: household.inviteCode
				} : null
			});
		}
		return res.json({ token, user: toSafeUser(user, household), household: householdPayload(household) });
	} catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		const { user, household } = await ensureUserHousehold(uid);
		await household.populate({ path: 'members', select: 'username displayName avatarUrl' });
		return res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
	} catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		const { displayName } = req.body;
		const safeDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
		const user = await User.findByIdAndUpdate(uid, { $set: { displayName: safeDisplayName } }, { new: true });
		if (!user) return res.status(404).json({ error: '用户不存在' });
		const { household } = await ensureUserHousehold(uid);
		return res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
	} catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		if (!req.file) return res.status(400).json({ error: '请上传头像图片' });
		const avatarUrl = buildAvatarUrl(req, req.file.filename);
		const user = await User.findByIdAndUpdate(uid, { $set: { avatarUrl } }, { new: true });
		if (!user) return res.status(404).json({ error: '用户不存在' });
		const { household } = await ensureUserHousehold(uid);
		return res.json({ user: toSafeUser(user, household), household: householdPayload(household) });
	} catch (err) { next(err); }
};

exports.toSafeUser = toSafeUser;