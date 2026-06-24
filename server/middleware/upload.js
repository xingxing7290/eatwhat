/**
 * Multer 文件上传中间件
 * 配置 multer 用于处理图片上传
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 统一的上传目录（绝对路径，指向 /app/uploads）
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const uploadFileSizeLimitMb = Number(process.env.UPLOAD_FILE_SIZE_LIMIT_MB || 30);
const uploadFileSizeLimit = uploadFileSizeLimitMb * 1024 * 1024;

// 配置存储引擎
const storage = multer.diskStorage({
  // 定义文件存储位置
  destination: function (req, file, cb) {
    try {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
    } catch (e) {
      return cb(e);
    }
    cb(null, UPLOAD_DIR);
  },
  // 定义文件名
  filename: function (req, file, cb) {
    // 使用 时间戳 + 随机数 + 原始文件名后缀 的方式生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只接受特定类型的图片
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']);
  const allowedExtnames = new Set(['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif']);
  const normalizedMime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimetype = allowedMimeTypes.has(normalizedMime);
  const extname = allowedExtnames.has(ext);
  const octetStreamFallback = normalizedMime === 'application/octet-stream' && extname;

  const details = `field=${file.fieldname} original=${file.originalname} mimetype=${file.mimetype} ext=${ext} route=${req.method} ${req.originalUrl}`;

  if ((mimetype || octetStreamFallback) && extname) {
    logger.info(`[upload] accepted ${details}`);
    return cb(null, true);
  }

  logger.error(`[upload] rejected ${details}`);
  const err = new Error('\u9519\u8bef\uff1a\u53ea\u652f\u6301\u4e0a\u4f20 jpeg, jpg, png, gif, webp, heic, heif \u683c\u5f0f\u7684\u56fe\u7247!');
  err.status = 400;
  err.uploadDetails = details;
  cb(err);
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: uploadFileSizeLimit
  },
  fileFilter: fileFilter
});

module.exports = upload; 