# 快速开始指南

## 🚀 5分钟快速部署

### 前提条件
- 已安装 Docker 和 Docker Compose
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 步骤 1: 克隆项目
```bash
git clone <your-repository-url>
cd eatwhat
```

### 步骤 2: 一键启动
```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 启动所有服务
./deploy.sh start
```

### 步骤 3: 验证部署
```bash
# 运行测试脚本
./test-deployment.sh
```

### 步骤 4: 访问应用
- 🌐 前端应用: http://localhost:8081
- 🔌 后端API: http://localhost:3000
- 📡 Nginx代理: http://localhost:8080

## 📋 常用命令

### 服务管理
```bash
# 启动服务
./deploy.sh start

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs [service-name]
```

### Docker Compose 命令
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh
```

### 数据备份
```bash
# 备份数据
./deploy.sh backup

# 清理资源
./deploy.sh clean
```

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :8081
netstat -tulpn | grep :3000

# 修改端口映射（编辑 docker-compose.yml）
ports:
  - "8081:80"  # 改为其他端口
```

#### 2. 服务启动失败
```bash
# 查看详细日志
docker-compose logs [service-name]

# 重新构建
docker-compose build --no-cache [service-name]
```

#### 3. 数据库连接失败
```bash
# 检查MongoDB状态
docker-compose logs mongodb

# 重启数据库
docker-compose restart mongodb
```

### 日志位置
- 前端日志: `docker-compose logs frontend`
- 后端日志: `docker-compose logs backend`
- 数据库日志: `docker-compose logs mongodb`
- Nginx日志: `docker-compose logs nginx`

## 🎯 生产环境部署

### 1. 环境配置
```bash
# 复制环境变量模板
cp env.template .env

# 编辑配置文件
nano .env
```

### 2. 启动生产环境
```bash
# 使用生产配置启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3. SSL证书配置
```bash
# 创建SSL目录
mkdir -p ssl

# 放置证书文件
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem
```

## 📊 监控和维护

### 健康检查
```bash
# 检查服务健康状态
curl http://localhost/health
curl http://localhost:3000/
```

### 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
docker system df
```

### 定期维护
```bash
# 清理未使用的镜像和容器
docker system prune -a

# 更新镜像
docker-compose pull
docker-compose up -d
```

## 🔒 安全建议

### 1. 修改默认密码
- 更改 MongoDB 默认密码
- 使用强密码策略
- 定期更换密码

### 2. 网络安全
- 限制数据库端口访问
- 配置防火墙规则
- 使用 HTTPS

### 3. 定期更新
- 更新 Docker 镜像
- 更新依赖包
- 及时修复安全漏洞

## 📚 更多资源

- 📖 [完整文档](README.md)
- 🏗️ [项目结构](PROJECT_STRUCTURE.md)
- 🐛 [问题反馈](https://github.com/your-repo/issues)
- 💬 [讨论区](https://github.com/your-repo/discussions)

## 🆘 获取帮助

如果遇到问题：

1. 查看 [故障排除](#故障排除) 部分
2. 检查服务日志
3. 运行测试脚本
4. 提交 Issue 到项目仓库

---

**祝您使用愉快！** 🎉 