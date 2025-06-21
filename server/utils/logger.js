/**
 * 日志记录工具模块
 * 使用 winston 库实现日志记录功能
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// 确保日志目录存在
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 控制台输出 (着色)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      )
    }),
    
    // API 请求日志文件
    new winston.transports.File({ 
      filename: path.join('logs', 'api-requests.log'),
      level: 'info'
    }),
    
    // 错误日志文件
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'),
      level: 'error'
    }),
    
    // 组合日志文件
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log')
    })
  ]
});

module.exports = logger; 