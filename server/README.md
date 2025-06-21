# 安排吃啥 - 后端服务

这是一个基于 Node.js 和 Express 框架的"安排吃啥"后端项目，帮助用户管理和安排每日餐食。

## 功能特性

- 菜品管理：添加、编辑、删除和查询菜品
- 餐食安排：按日期和餐食类型（早餐、午餐、晚餐）安排菜品
- RESTful API：提供标准化的 API 接口

## 技术栈

- Node.js
- Express
- MongoDB (Mongoose)
- Express Validator
- Winston (日志记录)
- Dotenv (环境配置)

## API 接口

### 菜品管理

1. **获取所有菜品**
   - `GET /meals`
   - 返回所有菜品列表

2. **添加新菜品**
   - `POST /meals`
   - 请求体: `{ "name": "菜品名称", "imageUrl": "图片URL", "description": "描述" }`

3. **编辑菜品**
   - `PUT /meals/:id`
   - 请求体: `{ "name": "新名称", "imageUrl": "新URL", "description": "新描述" }`

4. **删除菜品**
   - `DELETE /meals/:id`

### 餐食安排

1. **获取某日餐食安排**
   - `GET /schedules?date=2024-05-20`

2. **更新餐食安排**
   - `PUT /schedules/:date/:mealType`
   - 例如: `PUT /schedules/2024-05-20/dinner`
   - 请求体: `{ "mealIds": ["菜品ID1", "菜品ID2"] }`

## 安装和运行

1. 克隆项目
```bash
git clone <项目仓库URL>
cd whateat/server
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件并设置:
```
PORT=3000
MONGO_URI=mongodb://82.156.158.28:27017/whateat
LOG_LEVEL=info
```

4. 启动服务器
```bash
npm start
```

## 开发和调试

```bash
# 开发模式（使用nodemon自动重启）
npm run dev
``` 