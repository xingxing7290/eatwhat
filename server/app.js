/**
 * 安排吃啥 - 后端应用入口文件
 */
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// 导入路由
const mealRoutes = require('./routes/mealRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const debugRoutes = require('./routes/debugRoutes');

// 加载环境变量
dotenv.config();

// 初始化 Express 应用
const app = express();

// 中间件
// CORS 配置：支持通过 CORS_ORIGIN（逗号分隔）指定允许的来源
const corsOriginsRaw = process.env.CORS_ORIGIN || '';
const corsAllowed = corsOriginsRaw
	.split(',')
	.map(s => s.trim())
	.filter(Boolean);

app.use(cors({
	origin: (origin, callback) => {
		if (!origin) return callback(null, true);
		if (corsAllowed.length === 0 || corsAllowed.includes(origin)) {
			return callback(null, true);
		}
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true
}));

app.use(express.json()); // 解析 JSON 请求体

// 静态文件托管 (用于访问上传的图片)
app.use('/uploads', express.static('uploads'));

// 增强的请求日志记录中间件
app.use((req, res, next) => {
	const start = Date.now();
	
	// 记录请求开始信息
	logger.info(`---- API请求开始 ----`);
	logger.info(`${req.method} ${req.url}`);
	logger.info(`请求头: ${JSON.stringify(req.headers)}`);
	
	// 记录请求体 (如果存在)
	if (req.body && Object.keys(req.body).length > 0) {
		logger.info(`请求体: ${JSON.stringify(req.body)}`);
	}

	// 捕获响应完成事件
	res.on('finish', () => {
		const duration = Date.now() - start;
		const logLevel = res.statusCode >= 400 ? 'error' : 'info';
		
		logger[logLevel](`响应状态码: ${res.statusCode}`);
		logger[logLevel](`处理时间: ${duration}ms`);
		logger.info(`---- API请求结束 ----\n`);
	});

	next();
});

// 注册路由
app.use('/meals', mealRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/debug', debugRoutes);

// 根路由
app.get('/', (req, res) => {
	res.json({ message: '欢迎使用"安排吃啥"API' });
});

// 404 错误处理
app.use((req, res) => {
	res.status(404).json({ error: '未找到请求的资源' });
});

// 全局错误处理
app.use((err, req, res, next) => {
	logger.error(`错误: ${err.message}`);
	res.status(err.status || 500).json({
		error: err.message || '服务器内部错误'
	});
});

// 连接数据库并启动服务器
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whateat';

mongoose.connect(MONGO_URI)
	.then(() => {
		logger.info('成功连接到 MongoDB 数据库');
		app.listen(PORT, () => {
			logger.info(`服务器运行在端口 ${PORT}`);
		});
	})
	.catch(err => {
		logger.error(`数据库连接失败: ${err.message}`);
		process.exit(1);
	});

module.exports = app; 