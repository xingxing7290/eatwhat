/**
 * 调试路由模块
 * 提供查看日志等调试功能的接口
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const logger = require('../utils/logger');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// GET /debug/env - 查看关键环境变量
router.get('/env', (req, res) => {
  try {
    const data = {
      NODE_ENV: process.env.NODE_ENV || null,
      PORT: process.env.PORT || null,
      PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || null,
      CORS_ORIGIN: process.env.CORS_ORIGIN || null,
    };
    res.json(data);
  } catch (error) {
    logger.error(`获取环境变量失败: ${error.message}`);
    res.status(500).json({ error: '获取环境变量失败' });
  }
});

// 新增：GET /debug/uploads - 查看上传目录下的文件
router.get('/uploads', (req, res) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.status(200).json({ exists: false, dir: UPLOAD_DIR, files: [] });
    }
    const files = fs.readdirSync(UPLOAD_DIR).sort((a, b) => a.localeCompare(b));
    res.json({ exists: true, dir: UPLOAD_DIR, count: files.length, files });
  } catch (error) {
    logger.error(`读取上传目录失败: ${error.message}`);
    res.status(500).json({ error: '读取上传目录失败', message: error.message, dir: UPLOAD_DIR });
  }
});

// GET /debug/logs - 获取最新日志
router.get('/logs', (req, res) => {
  try {
    // 获取查询参数
    const logType = req.query.type || 'api-requests'; // 默认查看API请求日志
    const lines = parseInt(req.query.lines || 100);   // 默认显示100行
    
    // 日志文件路径
    const logFile = path.join(process.cwd(), 'logs', `${logType}.log`);
    
    // 检查文件是否存在
    if (!fs.existsSync(logFile)) {
      return res.status(404).json({ error: `日志文件 ${logType}.log 不存在` });
    }
    
    // 读取文件
    const logContent = fs.readFileSync(logFile, 'utf8');
    
    // 按行分割并获取最近的n行
    const logLines = logContent.split('\n').filter(line => line.trim() !== '');
    const recentLogs = logLines.slice(Math.max(0, logLines.length - lines));
    
    res.json({
      logType,
      totalLines: logLines.length,
      showing: recentLogs.length,
      logs: recentLogs
    });
  } catch (error) {
    logger.error(`获取日志失败: ${error.message}`);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// GET /debug/logs/clear - 清除日志文件
router.get('/logs/clear', (req, res) => {
  try {
    const logType = req.query.type || 'api-requests';
    const logFile = path.join(process.cwd(), 'logs', `${logType}.log`);
    
    if (fs.existsSync(logFile)) {
      // 清空文件内容
      fs.writeFileSync(logFile, '', 'utf8');
      logger.info(`已清空 ${logType}.log 日志文件`);
      res.json({ message: `已清空 ${logType}.log 日志文件` });
    } else {
      res.status(404).json({ error: `日志文件 ${logType}.log 不存在` });
    }
  } catch (error) {
    logger.error(`清除日志失败: ${error.message}`);
    res.status(500).json({ error: '清除日志失败' });
  }
});

module.exports = router; 