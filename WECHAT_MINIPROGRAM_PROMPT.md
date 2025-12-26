# 微信小程序 前端开发提示词（对接现有 EatWhat 后端）

> 目标：开发一套微信小程序（微信客户端内运行），实现与现有 Web 前端一致的业务能力：认证、用户设置（昵称/头像）、菜品管理、排餐日历（显示添加者头像）。后端沿用本仓库现有 Node.js/Express API。
>
> 本文是给“前端实现/生成代码”的**提示词/规格说明**：包含功能、页面与分包、逻辑与状态、API 规范、上传与鉴权、缓存与小程序特性。

---

## 1. 功能清单（必须实现）

### 1.1 账号体系
- **注册**：用户名 + 密码。
- **登录**：用户名 + 密码；保存 JWT `token`。
- **自动登录**：启动时若本地有 token，调用 `/auth/me` 校验。
- **退出登录**：清空 token 与用户信息。

> 本项目不是微信开放平台的 `wx.login`/code 换 session 流程；使用的是后端 JWT 登录。

### 1.2 用户设置
- 展示当前用户：`username` / `displayName` / `avatarUrl`。
- 修改昵称：PUT `/auth/profile`。
- 上传头像：POST `/auth/avatar`，`multipart/form-data`，字段名 `avatar`。

### 1.3 菜品
- 菜品列表（可搜索/筛选）。
- 菜品详情。
- 创建/编辑/删除（含图片上传，字段名 `image`）。

### 1.4 排餐日历（月视图）
- 获取当月 schedules：GET `/schedules?year=&month=`。
- 渲染每日早餐/午餐/晚餐菜品。
- 每个菜品显示添加者头像（`addedBy.avatarUrl`）或首字母占位。
- 为某日某餐选择菜品（多选保存）。
- 清空某日某餐（`mealIds: []`）。

---

## 2. 小程序页面与分包（建议）

### 2.1 页面路由（建议）
- 主包 pages：
  - `pages/login/index`
  - `pages/register/index`
  - `pages/calendar/index`（首页）
  - `pages/me/index`（我的/设置入口）
- 分包 subpackages：
  - `subpackages/meals/pages/list/index`
  - `subpackages/meals/pages/detail/index`
  - `subpackages/meals/pages/edit/index`
  - `subpackages/schedule/pages/select/index`（某天某餐选菜）
  - `subpackages/user/pages/settings/index`

### 2.2 关键交互
- 日历页：切换月份 -> 拉 schedules -> 确保菜品全量已加载（避免 id->name 映射失败）。
- 选菜页：多选 -> 保存 -> 返回日历并刷新该日。

---

## 3. 数据结构（与后端字段对齐）

### 3.1 User
```json
{
  "id": "<ObjectId>",
  "username": "alice",
  "role": "user",
  "displayName": "Alice",
  "avatarUrl": "http(s)://.../uploads/..."
}
```

### 3.2 Meal
```json
{
  "_id": "<ObjectId>",
  "name": "宫保鸡丁",
  "category": "家常菜",
  "subcategory": "鸡肉",
  "imageUrl": "/api/uploads/image-xxx.png",
  "description": "...",
  "tags": ["快手"],
  "ingredients": [{"name":"鸡胸肉","amount":"200g"}],
  "steps": ["..."],
  "source": "CookLikeHOC",
  "sourcePath": "...",
  "createdAt": "2025-..."
}
```

### 3.3 Schedule
```json
{
  "date": "YYYY-MM-DD",
  "meals": {
    "breakfast": [ {"meal": <Meal 或 mealId>, "addedBy": <User 或 null>} ],
    "lunch": [ ... ],
    "dinner": [ ... ]
  }
}
```

渲染规则：
- 若 `item.meal` 是对象并含 `name`：直接展示。
- 若 `item.meal` 是 id：在本地 `mealsAll` 里按 `_id` 映射取 name。

---

## 4. API 规范（必须严格按现有后端）

### 4.1 BaseURL/图片 URL
- 小程序需要支持配置 `API_BASE_URL`（例如 `https://your-domain.com/api` 或 `http://<ip>:8080/api`）。
- 处理图片 URL：
  - 若返回为绝对 URL：直接用。
  - 若返回为 `/api/uploads/...` 或 `/uploads/...`：拼接 `API_ORIGIN`（域名 + 端口）。

> 注意：微信小程序对 `http` 非 https 有限制；真机调试时需在微信开发者工具里勾选“不校验合法域名”，线上必须配置 https 合法域名。

### 4.2 Auth
- **POST** `/auth/register` body：`{ username, password }`
- **POST** `/auth/login` body：`{ username, password }` -> `{ token, user }`
- **GET** `/auth/me` header：`Authorization: Bearer <token>` -> `{ user }`
- **PUT** `/auth/profile` body：`{ displayName }` -> `{ user }`
- **POST** `/auth/avatar` multipart 字段名：`avatar` -> `{ user }`

### 4.3 Meals
- **GET** `/meals`
  - 返回可能是 `Meal[]` 或 `{ data, total, page, limit, totalPages }`（需兼容）
- **GET** `/meals/categories`
- **GET** `/meals/tags`
- **GET** `/meals/:id`
- **POST** `/meals` multipart 字段名：`image`
- **PUT** `/meals/:id` multipart
- **DELETE** `/meals/:id`

### 4.4 Schedules
- **GET** `/schedules?year=YYYY&month=M`
- **PUT** `/schedules/:date/:mealType` body：`{ mealIds: [id...] }`
  - `mealType` 取值：`breakfast|lunch|dinner`

---

## 5. 小程序端架构与状态管理（建议）

### 5.1 技术选型
推荐其一：
- 原生小程序（WXML/WXSS/JS）+ 自建请求层 + 简单 store
- 或 Taro / uni-app（若你已有团队偏好）

本文按“原生小程序”给出实现约束：
- 网络：`wx.request` / `wx.uploadFile`
- 缓存：`wx.setStorageSync` / `wx.getStorageSync`

### 5.2 全局状态（建议实现 app-level store）
- `authStore`：
  - `token`（持久化）
  - `currentUser`
  - `isAuthenticated`
- `mealStore`：
  - `mealsAll`
  - `allLoaded`（是否已全量加载）
  - 兼容分页返回解析
- `scheduleStore`：
  - `currentMonth`
  - `monthSchedules`
  - `byDate` map

### 5.3 “未知菜品”规避
日历页加载顺序必须保证：
1) 拉 schedules（当月）
2) 如果 `allLoaded` 为 false，则拉 `GET /meals` 全量
3) 再渲染（id->name 映射）

---

## 6. 鉴权与请求封装（必须实现统一封装）

### 6.1 request 封装
实现 `request({ url, method, data, header })`：
- 自动拼接 baseURL
- 自动注入 `Authorization`
- 统一错误处理

### 6.2 401 处理
- 若接口返回 `401`：
  - 清空 token
  - 跳转登录页（`wx.reLaunch`）

### 6.3 后端错误体解析
后端常见：
- `{ error: "..." }`
- `{ errors: [{ msg: "..." }] }`

弹窗策略：
- 优先展示 `error`
- 再展示 `errors[0].msg`
- 否则展示“服务器错误/网络错误”

---

## 7. 上传实现（小程序）

### 7.1 头像上传
- 选图：`wx.chooseMedia` 或 `wx.chooseImage`
- 上传：`wx.uploadFile`
  - url：`${baseURL}/auth/avatar`
  - name：**`avatar`**
  - header：`Authorization: Bearer <token>`
  - success：解析返回 JSON，刷新 `currentUser`

### 7.2 菜品图片上传
- `wx.uploadFile`
  - url：`${baseURL}/meals` 或 `${baseURL}/meals/:id`
  - name：**`image`**
  - formData：其他文本字段

> 注意：`wx.uploadFile` 的响应 `res.data` 是字符串，需要 `JSON.parse`。

---

## 8. UI 细节要求（对齐 Web）

### 8.1 日历展示
- 每天一个格子，格子内按早餐/午餐/晚餐分组。
- 每条菜品行：
  - 左侧小圆形头像（16~18px）
  - 右侧菜名（单行省略）

### 8.2 占位头像规则
- 有 `addedBy.avatarUrl`：显示头像。
- 否则：显示 `displayName/username` 首字母。
- 若都没有：显示默认灰色圆点。

---

## 9. 缓存与性能（小程序特性）

- token、currentUser：必须持久化到 storage。
- mealsAll：可以缓存（带版本/时间戳），但首次进入日历页需确保可用。
- schedules：按月份缓存（key：`schedules:YYYY-MM`），切换月份优先读缓存再刷新。

---

## 10. 验收清单（必须全部通过）
- 登录/注册正常；token 持久化正常。
- 设置页：修改昵称与上传头像可用；头像更新后日历立刻反映。
- 日历：
  - 当月每天都能渲染
  - 三餐新增/编辑/清空可用
  - 菜品名称正确（无大面积“未知菜品”）
  - 显示添加者头像/首字母
- 菜品：列表/详情/创建/编辑/删除可用；图片上传可用。
