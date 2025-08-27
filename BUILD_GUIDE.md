# 安排吃啥 - 编译部署指南

## 🚀 一键编译部署

### 快速开始

```bash
# 一键编译并部署
./build-and-deploy.sh

# 强制重新构建（修复代码问题）
./build-and-deploy.sh --force

# 跳过构建，只重新部署
./build-and-deploy.sh --skip-build
```

### 脚本功能

- ✅ **自动环境检查**：检查Docker和Docker Compose环境
- ✅ **代码问题修复**：自动修复常见的Vue组件语法错误
- ✅ **前端构建**：使用Docker容器构建前端应用
- ✅ **服务部署**：自动重启所有Docker服务
- ✅ **健康检查**：验证所有服务运行状态
- ✅ **连通性测试**：测试前端和后端API访问

## 🎨 统一色彩主题

### 主色调
- **主色**: `#667eea` (蓝紫色)
- **辅色**: `#764ba2` (深紫色)
- **强调色**: `#f093fb` (粉紫色)

### 功能色
- **成功**: `#4cd964` (绿色)
- **警告**: `#ff9500` (橙色)
- **错误**: `#ff3b30` (红色)

### 渐变效果
- **主渐变**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **次渐变**: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- **强调渐变**: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`

## 📱 移动端优化

### 响应式设计
- 移动端汉堡菜单导航
- 触摸友好的44px最小触摸目标
- 自适应布局和字体大小
- 移动端专用的交互优化

### 三种显示方式
1. **网格布局**：传统卡片式显示
2. **列表布局**：紧凑的横向列表
3. **表格布局**：专业的数据表格

## 🔧 手动构建步骤

如果自动脚本出现问题，可以手动执行以下步骤：

### 1. 构建前端
```bash
cd client
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm install
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build
cd ..
```

### 2. 部署服务
```bash
docker-compose down
docker-compose up -d
```

### 3. 检查状态
```bash
docker-compose ps
curl http://localhost:8081
curl http://localhost:3000/meals
```

## 🌐 访问地址

- **前端应用**: http://localhost:8081
- **后端API**: http://localhost:3000
- **Nginx代理**: http://localhost:8080

## 📋 常见问题

### 构建失败
1. 检查Docker是否正常运行
2. 确保有足够的磁盘空间
3. 尝试使用 `--force` 参数修复代码问题

### 服务无法访问
1. 检查端口是否被占用
2. 验证Docker容器状态
3. 查看容器日志：`docker-compose logs [service-name]`

### 样式问题
1. 清除浏览器缓存
2. 检查CSS文件是否正确加载
3. 验证CSS变量是否正确定义

## 🎯 新功能特性

- 🎨 **统一色彩主题**：现代化的蓝紫色渐变主题
- 📱 **移动端优化**：完整的响应式设计和触摸优化
- 🔄 **三种显示方式**：网格、列表、表格视图切换
- 🌙 **暗色模式支持**：自动适配系统主题
- ⚡ **性能优化**：代码分割和懒加载
- 🛡️ **错误处理**：完善的错误边界和用户提示

## 📞 技术支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源使用情况
3. 网络连接状态
4. 容器日志输出 