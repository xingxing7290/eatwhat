# "安排吃啥" App

一个基于Vue 3的日常餐食规划应用，帮助用户管理和规划每日三餐。

## 功能特点

- 日历视图：按月查看和管理三餐安排
- 菜品管理：添加、编辑、删除和查询菜品
- 餐食安排：为每日早餐/午餐/晚餐选择菜品
- 响应式设计：适配移动端和桌面设备

## 技术栈

- Vue 3 + Composition API
- Vue Router进行路由管理
- Pinia进行状态管理
- Element Plus组件库
- SCSS样式管理
- Vite构建工具

## API对接

系统已完成与后端API的对接，支持以下功能：

1. 菜品管理
   - 获取所有菜品: `GET /meals`
   - 添加菜品: `POST /meals`
   - 更新菜品: `PUT /meals/:id`
   - 删除菜品: `DELETE /meals/:id`

2. 日历餐食管理
   - 获取日期餐食: `GET /schedules?date=yyyy-MM-dd`
   - 更新餐食安排: `PUT /schedules/:date/:mealType`

## 开发设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
client/
  ├── public/          # 静态资源
  ├── src/
  │   ├── assets/      # 图片和样式资源
  │   ├── components/  # 可复用组件
  │   ├── router/      # 路由配置
  │   ├── services/    # API服务
  │   ├── stores/      # Pinia状态管理
  │   └── views/       # 页面视图组件
  ├── App.vue          # 根组件
  └── main.js          # 应用入口
```

## 许可证

MIT 