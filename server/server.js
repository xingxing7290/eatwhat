/**
 * 安排吃啥 - 服务器启动文件
 * 引导应用程序启动
 */
const app = require('./app');
const logger = require('./utils/logger');

// 捕获未处理的异常
process.on('uncaughtException', err => {
  logger.error(`未捕获的异常: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:');
  logger.error(reason);
  // 在开发环境可以选择退出
  // process.exit(1);
});

// 启动服务器 (app.js中已经处理了启动逻辑)
logger.info('服务器启动中...'); 