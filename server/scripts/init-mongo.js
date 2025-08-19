// MongoDB初始化脚本
db = db.getSiblingDB('whateat');

// 创建用户
db.createUser({
  user: 'whateat_user',
  pwd: 'whateat_password',
  roles: [
    {
      role: 'readWrite',
      db: 'whateat'
    }
  ]
});

// 创建集合
db.createCollection('meals');
db.createCollection('schedules');

// 创建索引
db.meals.createIndex({ "name": 1 });
db.meals.createIndex({ "category": 1 });
db.schedules.createIndex({ "date": 1 });
db.schedules.createIndex({ "mealId": 1 });

print('MongoDB数据库初始化完成'); 