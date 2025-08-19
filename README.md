# 安排吃啥 (eatwhat)

一个帮助用户安排每日饮食的Web应用，包含前端Vue.js应用和后端Node.js API服务。

## 项目特性

- 🍽️ 餐食管理和分类
- 📅 日程安排和计划
- 🖼️ 图片上传和管理
- 📱 响应式设计，支持移动端
- 🔐 用户认证和权限管理
- 📊 数据统计和分析

## 技术栈

### 前端
- Vue 3 + Composition API
- Element Plus UI组件库
- Vite构建工具
- Pinia状态管理
- Vue Router路由管理

### 后端
- Node.js + Express
- MongoDB数据库
- Mongoose ODM
- Multer文件上传
- Winston日志系统

## Docker部署

本项目已完全容器化，支持一键部署。

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少5GB可用磁盘空间

### 快速开始

1. **克隆项目**
```bash
git clone <your-repository-url>
cd eatwhat
```

2. **启动服务**
```bash
# 使用docker-compose启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

3. **访问应用**
- 前端应用: http://localhost:8081
- 后端API: http://localhost:3000
- Nginx代理: http://localhost:8080
- MongoDB: localhost:27017

## 从 Git 仓库拉取后的快速部署（推荐做法）

> 适用于你或他人在任意服务器上拉取仓库后，最少步骤完成部署。

1) 前置条件（必须）
```bash
# 确认已安装 Docker 与 Compose
docker --version
docker-compose --version
```

2) 克隆代码
```bash
git clone <your-repository-url>
cd eatwhat
```

3) 配置环境
- 复制根环境模板并按需修改端口/CORS/Mongo等：
```bash
cp env.template .env
# 可修改的重点（示例值按需更改）
# FRONTEND_PORT=8081
# BACKEND_PORT=3000
# NGINX_PORT=8080
# MONGODB_PORT=27017
# MONGO_URI=mongodb://admin:password123@mongodb:27017/whateat?authSource=admin
# CORS_ORIGIN=http://<你的前端访问地址>:<端口>
```
- 前端 API 基础地址（二选一）
  - 推荐：相对路径走前端容器内 Nginx 反代（无需关注IP）：
    ```bash
    echo 'VITE_API_BASE_URL=/api' > client/.env.local
    ```
  - 或指定后端IP直连（跨设备访问）：
    ```bash
    echo 'VITE_API_BASE_URL=http://<后端IP或域名>:${BACKEND_PORT:-3000}' > client/.env.local
    ```

4) 启动（标准方式）
```bash
docker-compose up -d
```

5) 访问与验证
- 前端: http://<你的服务器IP>:${FRONTEND_PORT:-8081}
- 后端: http://<你的服务器IP>:${BACKEND_PORT:-3000}
- 代理:  http://<你的服务器IP>:${NGINX_PORT:-8080}
- 健康与连通性：
```bash
./test-deployment.sh
```

### 若构建网络较差或速度慢（本地预构建兜底）
> 避免容器内拉依赖失败，先在宿主机本地构建，再用本地编排启动。

```bash
# 本地构建前端（会生成 client/dist/）
cd client && ../build-frontend-local.sh && cd ..

# 本地构建后端（安装 node_modules/）
cd server && ../build-backend-local.sh && cd ..

# 使用本地预构建编排启动
docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

### 常见适配与配置
- 变更前端 API 地址：修改 `client/.env.local` 的 `VITE_API_BASE_URL`，重新构建前端并重启容器
- 跨设备访问：确保 `.env` 中 `CORS_ORIGIN` 包含前端访问的来源（如 `http://客户端IP:8081`）
- 端口占用：调整 `.env` 中的 `FRONTEND_PORT/BACKEND_PORT/NGINX_PORT/MONGODB_PORT`

### 详细部署流程

#### 1. 环境准备

确保系统已安装Docker和Docker Compose：

```bash
# 检查Docker版本
docker --version
docker-compose --version

# 如果没有安装，请参考官方文档安装
# https://docs.docker.com/get-docker/
# https://docs.docker.com/compose/install/
```

#### 2. 项目配置

项目包含以下Docker配置文件：

- `docker-compose.yml` - 主配置文件
- `client/Dockerfile` - 前端构建配置
- `server/Dockerfile` - 后端构建配置
- `nginx.conf` - Nginx反向代理配置
- `.dockerignore` - Docker构建忽略文件

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 仅启动特定服务
docker-compose up -d mongodb    # 仅启动数据库
docker-compose up -d backend    # 仅启动后端
docker-compose up -d frontend   # 仅启动前端
```

#### 4. 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service-name]

# 重启服务
docker-compose restart [service-name]

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

#### 5. 数据持久化

项目使用Docker卷来持久化数据：

- `mongodb_data` - MongoDB数据存储
- `./server/uploads` - 上传文件存储

### 生产环境部署

#### 1. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置
MONGO_INITDB_ROOT_USERNAME=your_admin_username
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
MONGO_INITDB_DATABASE=whateat

# 应用配置
NODE_ENV=production
PORT=3000

# 安全配置
JWT_SECRET=your_jwt_secret_key
```

#### 2. 生产环境启动

```bash
# 使用生产环境配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 或者直接修改docker-compose.yml中的环境变量
```

#### 3. 反向代理配置

生产环境建议使用Nginx作为反向代理：

```bash
# 启动Nginx代理服务
docker-compose up -d nginx

# 访问 http://localhost:8080
```

### 故障排除

#### 常见问题

1. **端口冲突**
```bash
# 检查端口占用
netstat -tulpn | grep :8081
netstat -tulpn | grep :3000
netstat -tulpn | grep :27017

# 修改docker-compose.yml中的端口映射
```

2. **数据库连接失败**
```bash
# 检查MongoDB服务状态
docker-compose logs mongodb

# 检查网络连接
docker network ls
docker network inspect eatwhat_eatwhat-network
```

3. **前端构建失败**
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建前端
docker-compose build --no-cache frontend
```

4. **文件权限问题**
```bash
# 修复uploads目录权限
sudo chown -R 1000:1000 server/uploads
```

#### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mongodb

# 实时跟踪日志
docker-compose logs -f [service-name]
```

### 性能优化

#### 1. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

#### 2. 缓存优化

- 前端静态资源使用Nginx缓存
- MongoDB查询优化
- 图片压缩和CDN加速

#### 3. 监控和健康检查

所有服务都配置了健康检查：

```bash
# 检查服务健康状态
docker-compose ps

# 手动健康检查
curl http://localhost/health
curl http://localhost:3000/
```

### 备份和恢复

#### 1. 数据库备份

```bash
# 备份MongoDB数据
docker exec eatwhat-mongodb mongodump --out /data/backup

# 复制备份文件到主机
docker cp eatwhat-mongodb:/data/backup ./backup
```

#### 2. 文件备份

```bash
# 备份上传文件
tar -czf uploads_backup.tar.gz server/uploads/
```

#### 3. 数据恢复

```bash
# 恢复MongoDB数据
docker exec -i eatwhat-mongodb mongorestore --archive < backup.archive

# 恢复上传文件
tar -xzf uploads_backup.tar.gz
```

### 更新和升级

#### 1. 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动服务
docker-compose down
docker-compose up -d --build
```

#### 2. 依赖更新

```bash
# 更新前端依赖
docker-compose exec frontend npm update

# 更新后端依赖
docker-compose exec backend npm update
```

### 安全建议

1. **修改默认密码**
   - 更改MongoDB默认密码
   - 使用强密码策略

2. **网络安全**
   - 限制数据库端口访问
   - 使用防火墙规则

3. **定期更新**
   - 定期更新Docker镜像
   - 及时修复安全漏洞

### 支持和服务

如果遇到问题，请：

1. 查看项目日志
2. 检查Docker服务状态
3. 参考故障排除部分
4. 提交Issue到项目仓库

## 配置与适配

为在不同设备/网络环境中部署，提供以下可配置项：

- 前端环境变量（Vite）：
  - `VITE_API_BASE_URL`：API 基础地址，优先级高于默认值。
    - 推荐：`/api`（配合前端容器内 Nginx 将 `/api` 反向代理到后端）
    - 或者：`http://<你的后端IP或域名>:3000`

- 后端环境变量（.env）：
  - `PORT`：后端监听端口（默认 3000）
  - `MONGO_URI`：MongoDB 连接串，如：`mongodb://admin:password123@mongodb:27017/whateat?authSource=admin`
  - `CORS_ORIGIN`：允许的跨域来源，多个以逗号分隔

- Docker Compose 可变量化（建议本地复制 `.env`）：
  - `FRONTEND_PORT=8081`
  - `BACKEND_PORT=3000`
  - `MONGODB_PORT=27017`

### 示例：前端指定完整API地址

1) 在 `client` 目录创建 `.env.local`：

```
VITE_API_BASE_URL=http://192.168.1.100:3000
```

2) 重新构建前端镜像或本地构建

```
cd client
npm run build
```

3) 重新启动容器

```
docker-compose down && docker-compose up -d
```

### 示例：通过Nginx相对路径访问

- 保持 `VITE_API_BASE_URL=/api`
- `client/nginx.conf` 已将 `/api` 和 `/uploads` 代理到 `backend:3000`

## 开发环境

### 本地开发

```