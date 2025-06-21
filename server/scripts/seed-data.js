/**
 * 测试数据初始化脚本
 * 用于向数据库中添加初始菜品数据
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Meal = require('../models/mealModel');

// 加载环境变量
dotenv.config({ path: '../.env' });

// 测试菜品数据
const mealData = [
  {
    name: '麻辣烫',
    imageUrl: 'https://example.com/malatang.jpg',
    description: '麻辣鲜香，各种食材自由搭配'
  },
  {
    name: '鱼香肉丝',
    imageUrl: 'https://example.com/yuxiangrousi.jpg',
    description: '经典川菜，酸甜微辣'
  },
  {
    name: '宫保鸡丁',
    imageUrl: 'https://example.com/gongbaojiding.jpg',
    description: '香辣可口，花生与鸡肉的绝妙搭配'
  },
  {
    name: '西红柿炒鸡蛋',
    imageUrl: 'https://example.com/xihongshijidan.jpg',
    description: '家常菜，酸甜可口'
  },
  {
    name: '红烧肉',
    imageUrl: 'https://example.com/hongshaorou.jpg',
    description: '肥而不腻，色泽红亮'
  },
  {
    name: '水煮鱼',
    imageUrl: 'https://example.com/shuizhuyu.jpg',
    description: '麻辣鲜香，鱼肉嫩滑'
  }
];

// 连接数据库
const MONGO_URI = process.env.MONGO_URI || 'mongodb://82.156.158.28:27017/whateat';

// 初始化数据函数
const seedData = async () => {
  try {
    // 连接数据库
    await mongoose.connect(MONGO_URI);
    console.log('数据库连接成功');

    // 清空旧数据
    await Meal.deleteMany({});
    console.log('已清除旧菜品数据');

    // 插入新数据
    const createdMeals = await Meal.insertMany(mealData);
    console.log(`成功添加 ${createdMeals.length} 种菜品`);

    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');

    process.exit(0);
  } catch (error) {
    console.error('初始化数据失败:', error);
    process.exit(1);
  }
};

// 执行初始化
seedData(); 