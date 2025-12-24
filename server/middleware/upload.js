/**
 * Multer 文件上传中间件
 * 配置 multer 用于处理图片上传
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 统一的上传目录（绝对路径，指向 /app/uploads）
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

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
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('错误：只支持上传 jpeg, jpg, png, gif 格式的图片!'));
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    // 文件大小限制为 5MB
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: fileFilter
});

module.exports = upload; 