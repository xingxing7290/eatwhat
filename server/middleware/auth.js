const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

module.exports = function auth(required = true) {
	return (req, res, next) => {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ')
			? authHeader.slice(7)
			: null;
		if (!token) return required ? res.status(401).json({ error: '未认证' }) : next();
		try {
			const payload = jwt.verify(token, JWT_SECRET);
			req.user = payload;
			return next();
		} catch (e) {
			return res.status(401).json({ error: '无效令牌' });
		}
	};
}; 