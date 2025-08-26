const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const TOKEN_EXPIRES_IN = '7d';

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
		return res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
	} catch (err) { next(err); }
};

exports.me = async (req, res) => {
	return res.json({ user: req.user });
}; 