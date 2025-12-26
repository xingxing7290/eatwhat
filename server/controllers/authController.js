const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

function buildAvatarUrl(req, filename) {
	const publicBase = process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim();
	if (publicBase) {
		const base = publicBase.replace(/\/$/, '');
		return `${base}/uploads/${filename}`;
	}

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

		let port = xfPort || portFromHost;
		const isStandardPort = (xfProto === 'https' && port === '443') || (xfProto === 'http' && port === '80');
		const portSuffix = port && !isStandardPort ? `:${port}` : '';
		if (host) {
			return `${xfProto}://${host}${portSuffix}/uploads/${filename}`;
		}
	} catch (_) {
		// ignore
	}

	return `/api/uploads/${filename}`;
}

function toSafeUser(userDoc) {
	if (!userDoc) return null;
	return {
		id: userDoc._id,
		username: userDoc.username,
		role: userDoc.role,
		displayName: userDoc.displayName || '',
		avatarUrl: userDoc.avatarUrl || ''
	};
}

exports.register = async (req, res, next) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
		const existed = await User.findOne({ username });
		if (existed) return res.status(409).json({ error: '用户名已存在' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ username, passwordHash });
		return res.status(201).json({ id: user._id, username: user.username });
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
		const token = jwt.sign({ uid: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
		return res.json({ token, user: toSafeUser(user) });
	} catch (err) { next(err); }
};

exports.me = async (req, res) => {
	const uid = req.user && req.user.uid;
	if (!uid) return res.status(401).json({ error: '未认证' });
	const user = await User.findById(uid);
	if (!user) return res.status(404).json({ error: '用户不存在' });
	return res.json({ user: toSafeUser(user) });
};

exports.updateProfile = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		const { displayName } = req.body;
		const safeDisplayName = typeof displayName === 'string' ? displayName.trim() : '';
		const user = await User.findByIdAndUpdate(
			uid,
			{ $set: { displayName: safeDisplayName } },
			{ new: true }
		);
		if (!user) return res.status(404).json({ error: '用户不存在' });
		return res.json({ user: toSafeUser(user) });
	} catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
	try {
		const uid = req.user && req.user.uid;
		if (!uid) return res.status(401).json({ error: '未认证' });
		if (!req.file) return res.status(400).json({ error: '请上传头像图片' });
		const avatarUrl = buildAvatarUrl(req, req.file.filename);
		const user = await User.findByIdAndUpdate(
			uid,
			{ $set: { avatarUrl } },
			{ new: true }
		);
		if (!user) return res.status(404).json({ error: '用户不存在' });
		return res.json({ user: toSafeUser(user) });
	} catch (err) { next(err); }
};
 