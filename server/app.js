/**
 * 安排吃啥 - 后端应用入口文件
 */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

const mealRoutes = require('./routes/mealRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const debugRoutes = require('./routes/debugRoutes');
const authRoutes = require('./routes/authRoutes');
const householdRoutes = require('./routes/householdRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const anniversaryRoutes = require('./routes/anniversaryRoutes');

dotenv.config();
const app = express();

const corsOriginsRaw = process.env.CORS_ORIGIN || '';
const corsAllowed = corsOriginsRaw.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (corsAllowed.length === 0 || corsAllowed.includes(origin)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.use((req, res, next) => {
	const start = Date.now();
	logger.info(`---- API请求开始 ----`);
	logger.info(`${req.method} ${req.url}`);
	logger.info(`请求头: ${JSON.stringify(req.headers)}`);
	if (req.body && Object.keys(req.body).length > 0) logger.info(`请求体: ${JSON.stringify(req.body)}`);
	res.on('finish', () => {
		const duration = Date.now() - start;
		const logLevel = res.statusCode >= 400 ? 'error' : 'info';
		logger[logLevel](`响应状态码: ${res.statusCode}`);
		logger[logLevel](`处理时间: ${duration}ms`);
		logger.info(`---- API请求结束 ----\n`);
	});
	next();
});

app.use('/auth', authRoutes);
app.use('/household', householdRoutes);
app.use('/meals', mealRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/memories', memoryRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/anniversaries', anniversaryRoutes);
app.use('/debug', debugRoutes);

app.get('/health', (req, res) => res.send('healthy'));
app.get('/', (req, res) => res.json({ message: '欢迎使用"安排吃啥"API' }));

app.use((req, res) => res.status(404).json({ error: '未找到请求的资源' }));
app.use((err, req, res, next) => {
	logger.error(`错误: ${err.message}`);
	const status = err.status || (err.name === 'MulterError' ? 400 : 500);
	res.status(status).json({ error: err.message || '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';

mongoose.connect(MONGO_URI)
	.then(() => {
		logger.info('成功连接到 MongoDB 数据库');
		app.listen(PORT, () => logger.info(`服务器运行在端口 ${PORT}`));
	})
	.catch(err => {
		logger.error(`数据库连接失败: ${err.message}`);
		process.exit(1);
	});

module.exports = app;