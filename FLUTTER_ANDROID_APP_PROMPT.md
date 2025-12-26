# Flutter Android App 前端开发提示词（对接现有 EatWhat 后端）

> 目标：用 Flutter 开发 Android App，功能与现有 Web 前端一致；后端沿用本仓库现有 Node.js/Express API。
>
> 本文是给“前端实现/生成代码”的**提示词/规格说明**：包含功能设计、信息架构、逻辑与状态、接口设计、错误处理、上传、兼容性与工程建议。

---

## 1. 业务范围与功能清单（必须全部实现）

### 1.1 账号与登录
- **注册**：用户名 + 密码。
- **登录**：用户名 + 密码，成功后获得 JWT `token` 与当前用户信息。
- **登录态**：
  - App 全局注入 `Authorization: Bearer <token>`。
  - token 过期或无效时，强制跳转登录页并清空本地登录态。

### 1.2 用户设置（设置页）
- **查看当前用户**：展示 `username`、`displayName`、`avatarUrl`。
- **修改昵称**：更新 `displayName`。
- **上传头像**：支持从相册/拍照选择图片，上传后立即刷新 UI。

### 1.3 菜品（Meal）
- **列表**：支持按关键字/分类/子分类/标签筛选（可选 UI，但接口要预留）；默认按创建时间倒序。
- **详情**：展示菜名、图片、分类、标签、食材、步骤、描述、来源等。
- **创建/编辑/删除**：需要支持图片上传（字段名 `image`）。

### 1.4 排餐日历（核心）
- **月视图日历**：展示当月每天的早餐/午餐/晚餐。
- **每个餐次显示菜品列表**：每个菜品行显示：
  - **添加者头像**（若有 `avatarUrl`）或**昵称首字母占位**。
  - **菜品名称**。
- **添加/编辑某天某餐**：进入“菜品选择”页面，多选保存。
- **删除某天某餐**：清空该餐（`mealIds: []`）。

> 注意：后端为了兼容历史数据，`GET /schedules` 里可能会对缺失 `addedBy` 的旧记录在返回时补当前用户（用于展示）。

---

## 2. 信息架构与页面路由（建议）

### 2.1 页面结构（建议 Tab + 二级页面）
- **Tab 1：日历**
  - `CalendarPage`：月历 + 三餐展示
  - `MealSelectionPage`：为某日某餐选择菜品（多选 + 搜索/筛选）
- **Tab 2：菜品**
  - `MealListPage`
  - `MealDetailPage`
  - `MealEditPage`（创建/编辑）
- **Tab 3：我的**
  - `UserSettingsPage`
  - （可选）`AboutPage`
- **独立页面**
  - `LoginPage`
  - `RegisterPage`

### 2.2 关键交互与状态
- 日历页进入/切换月份：
  - 先拉当月 schedules
  - 再确保菜品全量已加载（避免出现“未知菜品”）
- 菜品选择页保存：成功后回到日历，局部刷新该日期。

---

## 3. 数据模型（与后端字段对齐）

### 3.1 User（后端返回的安全用户信息）
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
字段来自 `server/models/mealModel.js`：
```json
{
  "_id": "<ObjectId>",
  "name": "宫保鸡丁",
  "category": "家常菜",
  "subcategory": "鸡肉",
  "imageUrl": "/api/uploads/image-xxx.png" ,
  "description": "...",
  "tags": ["快手"],
  "ingredients": [{"name":"鸡胸肉","amount":"200g"}],
  "steps": ["..."],
  "source": "CookLikeHOC",
  "sourcePath": "...",
  "createdAt": "2025-..."
}
```

### 3.3 Schedule（月度返回数组，每天一条）
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

> 前端渲染规则：
- 如果 `item.meal` 已是对象且有 `name`，直接展示。
- 若 `item.meal` 为 id（字符串/ObjectId），用本地 `mealStore` 全量列表映射得到 `name`。

---

## 4. API 对接规范（必须严格按现有后端实现）

### 4.1 BaseURL 与图片 URL 处理
- 开发环境可能是：
  - 直连后端：`http://localhost:3000`
  - 或通过 Nginx 反代：`http://localhost:8080/api`（Web 的配置）
- **Flutter 建议**：配置 `apiBase`（例如 `http://<server-ip>:3000` 或 `http://<server-ip>:8080`）。
- **图片 URL 兼容**：后端可能返回：
  - 绝对 URL：`http://host/uploads/xxx`
  - 相对 URL：`/api/uploads/xxx`
  - `/uploads/xxx`

实现 `resolveUrl(String url)`：
- 若 `url` 以 `http://` 或 `https://` 开头：直接使用。
- 若以 `/` 开头：拼接 `apiOrigin`（不含路径），例如 `http://host:8080` + `/api/uploads/...`。

### 4.2 认证 Auth
#### 4.2.1 注册
- **POST** `/auth/register`
- Body（JSON）：
```json
{ "username": "alice", "password": "123456" }
```
- 成功：`201`，返回 `{ id, username }`

#### 4.2.2 登录
- **POST** `/auth/login`
- Body（JSON）：
```json
{ "username": "alice", "password": "123456" }
```
- 成功：`200`
```json
{ "token": "<jwt>", "user": { ...User } }
```

#### 4.2.3 获取当前用户
- **GET** `/auth/me`
- Header：`Authorization: Bearer <token>`
- 成功：
```json
{ "user": { ...User } }
```

#### 4.2.4 更新资料（昵称）
- **PUT** `/auth/profile`
- Header：`Authorization: Bearer <token>`
- Body：
```json
{ "displayName": "Alice" }
```
- 成功：
```json
{ "user": { ...User } }
```

#### 4.2.5 上传头像
- **POST** `/auth/avatar`
- Header：`Authorization: Bearer <token>`
- Content-Type：`multipart/form-data`
- 文件字段名：**`avatar`**
- 成功：
```json
{ "user": { ...User } }
```

### 4.3 菜品 Meals
#### 4.3.1 获取菜品列表
- **GET** `/meals`
- Query（可选）：`search` `tag` `category` `subcategory` `page` `limit`
- 返回兼容两种形态：
  1) **不带分页参数**：直接返回 `Meal[]`
  2) **带分页参数**：返回
```json
{ "data": [Meal], "total": 123, "page": 1, "limit": 20, "totalPages": 7 }
```

> Flutter 端建议：
- 做一个解析器 `parseMealList(response)` 兼容两种返回。
- 日历页需要“全量菜品”用于 id->name 映射：调用 `GET /meals`（不带任何 query）。

#### 4.3.2 获取分类/标签
- **GET** `/meals/categories`
- **GET** `/meals/tags`

#### 4.3.3 获取菜品详情
- **GET** `/meals/:id`

#### 4.3.4 创建菜品（含图片）
- **POST** `/meals`
- Content-Type：`multipart/form-data`
- 文件字段名：**`image`**
- 其他字段：`name` `category` `subcategory` `description` `tags[]` `ingredients` `steps` 等（按现有 web 逻辑对齐）

#### 4.3.5 更新菜品
- **PUT** `/meals/:id`
- 同创建

#### 4.3.6 删除菜品
- **DELETE** `/meals/:id`

### 4.4 排餐 Schedules
#### 4.4.1 获取某月排餐
- **GET** `/schedules?year=YYYY&month=M`
- Header：`Authorization: Bearer <token>`
- 返回：当月每天一个元素的数组（无数据的日期返回空 meals 数组结构）。

#### 4.4.2 更新某天某餐（新增/编辑/清空）
- **PUT** `/schedules/:date/:mealType`
- `:mealType` 取值：`breakfast | lunch | dinner`
- Header：`Authorization: Bearer <token>`
- Body（JSON）：
```json
{ "mealIds": ["<mealId>", "<mealId>"] }
```
- 清空该餐：`{ "mealIds": [] }`
- 成功：返回更新后的单日 schedule（包含 populate 过的 `meal` 与 `addedBy`）。

---

## 5. 前端逻辑与状态管理（Flutter 实现建议）

### 5.1 状态管理选型
建议使用其一（任选，但要统一）：
- **Riverpod + StateNotifier/Notifier**（推荐）
- 或 **Bloc/Cubit**

### 5.2 模块化 Store/Repository（建议分层）
- `AuthRepository`：login/register/me/updateProfile/uploadAvatar
- `MealRepository`：getMeals/getMeal/getTags/getCategories/create/update/delete
- `ScheduleRepository`：getSchedulesByMonth/updateSchedule

对应 State：
- `AuthState`：`token`, `currentUser`, `isAuthenticated`
- `MealState`：
  - `mealsAll`（全量）
  - `mealsPaged`（可选）
  - `allLoaded`（是否全量已加载）
- `ScheduleState`：`monthSchedules`, `byDateMap`, `loading`

### 5.3 “未知菜品”必须规避
- 日历渲染前，必须保证：
  - `allLoaded == true` 的全量菜品列表已拉取
- 若仍遇到 id 找不到：显示 `未知菜品` 并在调试日志里输出 missing id（便于排查被删除菜品）。

### 5.4 添加者头像展示规则
- 若 `addedBy.avatarUrl` 存在：显示圆形头像（16~18dp，与 Web 一致的小圆点）。
- 否则：显示 `addedBy.displayName/username` 的首字母占位；仍无则显示空占位圆。

---

## 6. 网络层实现（Flutter）

### 6.1 HTTP 客户端
推荐：`dio`
- Request interceptor：
  - 从 secure storage 读取 token
  - 注入 `Authorization`
- Response interceptor：
  - `401` -> 清 token -> 跳转登录

### 6.2 上传
- 头像上传：`FormData` + `MultipartFile.fromFile`，字段名必须是 `avatar`
- 菜品图片：字段名必须是 `image`

---

## 7. 错误处理与用户提示规范

### 7.1 后端错误格式
后端常见返回：
- `{ error: "..." }`
- 或 `{ errors: [{ msg: "..." }] }`

App 需统一解析：
- 优先 `error`
- 再取 `errors[0].msg`
- 否则显示“服务器错误”

### 7.2 必须覆盖的错误场景
- 401 未认证：强制回登录
- 网络超时：提示可重试
- 上传失败：保留本地预览与重试按钮

---

## 8. 本地配置与环境变量（App）

建议支持：
- `API_BASE_URL`
- `API_ORIGIN`（用于拼接相对图片）

开发建议：
- debug 包支持切换环境（dev/staging/prod）

---

## 9. 验收清单（必须全部通过）
- 登录/注册可用，token 持久化可用。
- 设置页可修改昵称与上传头像；头像在日历页与“我的”页面立即更新。
- 日历：
  - 当月每天都能渲染
  - 三餐新增/编辑/清空可用
  - 每道菜品显示正确名称
  - 显示添加者头像或首字母
- 菜品：列表/详情/创建/编辑/删除可用；图片上传可用。
