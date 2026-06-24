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
const dashboardRoutes = require('./routes/dashboardRoutes');
const weeklyPlanRoutes = require('./routes/weeklyPlanRoutes');
const shoppingListRoutes = require('./routes/shoppingListRoutes');
const photoAlbumRoutes = require('./routes/photoAlbumRoutes');
const defaultMealRoutes = require('./routes/defaultMealRoutes');
const mealImageIssueRoutes = require('./routes/mealImageIssueRoutes');
const anniversaryTemplateRoutes = require('./routes/anniversaryTemplateRoutes');

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
app.use('/dashboard', dashboardRoutes);
app.use('/weekly-plans', weeklyPlanRoutes);
app.use('/shopping-list', shoppingListRoutes);
app.use('/photo-album', photoAlbumRoutes);
app.use('/default-meals', defaultMealRoutes);
app.use('/meal-image-issues', mealImageIssueRoutes);
app.use('/anniversary-templates', anniversaryTemplateRoutes);
app.use('/debug', debugRoutes);

app.get('/health', (req, res) => res.send('healthy'));
app.get('/', (req, res) => res.json({ message: '欢迎使用"安排吃啥"API' }));

app.use((req, res) => res.status(404).json({ error: '未找到请求的资源' }));
app.use((err, req, res, next) => {
	let status = err.status || (err.name === 'MulterError' ? 400 : 500);
	let message = err.message || '\u670d\u52a1\u5668\u5185\u90e8\u9519\u8bef';
	if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
		status = 413;
		message = '\u56fe\u7247\u6587\u4ef6\u592a\u5927\uff0c\u8bf7\u9009\u62e9\u8f83\u5c0f\u56fe\u7247\u6216\u91cd\u65b0\u62cd\u7167\u4e0a\u4f20\uff08\u5355\u5f20\u4e0d\u8d85\u8fc7 15MB\uff09';
	}
	logger.error(`\u9519\u8bef: ${message}`);
	logger.error(`\u9519\u8bef\u8be6\u60c5: status=${status} name=${err.name || ''} code=${err.code || ''} field=${err.field || ''} route=${req.method} ${req.originalUrl}`);
	if (err.uploadDetails) logger.error(`\u4e0a\u4f20\u8be6\u60c5: ${err.uploadDetails}`);
	res.status(status).json({ error: message });
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