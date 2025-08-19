#!/bin/bash

# 本地前端构建脚本
echo "=================================="
echo "  本地前端构建脚本"
echo "=================================="

# 检查是否在client目录
if [ ! -f "package.json" ]; then
    echo "请在client目录下运行此脚本"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "Node.js未安装，尝试使用Docker构建..."
    
    # 使用Docker在本地构建
    echo "使用Docker构建前端..."
    docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "
        echo 'Installing dependencies...'
        npm install --registry=https://registry.npmmirror.com
        echo 'Building application...'
        npm run build
    "
else
    echo "使用本地Node.js构建..."
    
    # 清理之前的构建
    echo "清理之前的构建..."
    rm -rf dist/
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "安装依赖..."
        npm install
    fi
    
    # 构建应用
    echo "构建应用..."
    npm run build
fi

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    echo "构建文件位于: $(pwd)/dist/"
    echo ""
    echo "现在可以使用以下命令部署："
    echo "1. 使用本地构建: docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d"
    echo "2. 或者手动构建: docker build -f Dockerfile.local -t eatwhat-frontend ."
else
    echo "❌ 构建失败！"
    exit 1
fi 