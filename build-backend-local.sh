#!/bin/bash

# 本地后端构建脚本
echo "=================================="
echo "  本地后端构建脚本"
echo "=================================="

# 检查是否在server目录
if [ ! -f "package.json" ]; then
    echo "请在server目录下运行此脚本"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "Node.js未安装，无法构建后端"
    exit 1
fi

echo "使用本地Node.js构建..."

# 清理之前的构建
echo "清理之前的构建..."
rm -rf node_modules/

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 验证依赖安装
if [ -d "node_modules/express" ]; then
    echo "✅ 依赖安装成功！"
    echo "现在可以使用 Dockerfile.local 来构建Docker镜像"
else
    echo "❌ 依赖安装失败！"
    exit 1
fi 