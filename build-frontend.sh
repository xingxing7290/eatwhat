#!/bin/bash

# 前端构建脚本
echo "开始构建前端应用..."

# 检查是否在client目录
if [ ! -f "package.json" ]; then
    echo "请在client目录下运行此脚本"
    exit 1
fi

# 清理之前的构建
echo "清理之前的构建..."
rm -rf dist/

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    # 使用Docker来安装依赖，避免本地环境问题
    docker run --rm -v $(pwd):/app -w /app node:18-alpine npm install
fi

# 构建应用
echo "构建应用..."
docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build

# 检查构建结果
if [ -d "dist" ]; then
    echo "构建成功！"
    echo "构建文件位于: $(pwd)/dist/"
    echo "现在可以使用 Dockerfile.static 来构建Docker镜像"
else
    echo "构建失败！"
    exit 1
fi 