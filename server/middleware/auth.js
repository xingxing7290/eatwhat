const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

module.exports = function auth(required = true) {
	return async (req, res, next) => {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ')
			? authHeader.slice(7)
			: null;
		if (!token) return required ? res.status(401).json({ error: '未认证' }) : next();
		try { req.user = jwt.verify(token, JWT_SECRET); } catch (e) {
			return res.status(401).json({ error: '无效令牌' });
		}
		const expected = req.headers['x-eatwhat-household'];
		if (expected === undefined) return next(); // Legacy clients remain compatible.
		if (typeof expected !== 'string' || !/^[0-9a-f]{24}$/i.test(expected)) return res.status(400).json({ code: 'INVALID_HOUSEHOLD_SCOPE', error: '家庭标识无效，请重新登录' });
		try {
			const user = await User.findById(req.user.uid).select('householdId').lean();
			if (!user || String(user.householdId || '').toLowerCase() !== expected.toLowerCase()) return res.status(409).json({ code: 'HOUSEHOLD_SCOPE_CHANGED', error: '当前账号所属小家已变化，请保留草稿并重新登录' });
			req.expectedHouseholdId = expected.toLowerCase();
			return next();
		} catch (error) { return next(error); }
	};
};
