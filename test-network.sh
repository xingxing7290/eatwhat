#!/bin/bash

# 网络连接测试脚本
echo "=================================="
echo "  Docker容器网络连接测试"
echo "=================================="

# 测试1：基础Alpine镜像网络
echo "1. 测试基础Alpine镜像网络连接..."
docker run --rm node:18-alpine sh -c "
echo 'Testing ping...'
ping -c 3 registry.npmjs.org || echo 'Ping failed'
echo 'Testing curl...'
curl -s --connect-timeout 10 https://registry.npmjs.org/vite | head -5 || echo 'Curl failed'
echo 'Testing npm...'
npm view vite version --registry=https://registry.npmjs.org || echo 'NPM failed'
"

echo ""

# 测试2：Debian镜像网络
echo "2. 测试Debian镜像网络连接..."
docker run --rm node:18 sh -c "
echo 'Testing ping...'
ping -c 3 registry.npmjs.org || echo 'Ping failed'
echo 'Testing curl...'
curl -s --connect-timeout 10 https://registry.npmjs.org/vite | head -5 || echo 'Curl failed'
echo 'Testing npm...'
npm view vite version --registry=https://registry.npmjs.org || echo 'NPM failed'
"

echo ""

# 测试3：国内镜像源
echo "3. 测试国内镜像源连接..."
docker run --rm node:18-alpine sh -c "
echo 'Testing npmmirror...'
npm view vite version --registry=https://registry.npmmirror.com || echo 'NPMMirror failed'
"

echo ""

# 测试4：DNS配置
echo "4. 测试DNS配置..."
docker run --rm node:18-alpine sh -c "
echo 'Current DNS:'
cat /etc/resolv.conf
echo 'Setting custom DNS...'
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
echo 'nameserver 8.8.4.4' >> /etc/resolv.conf
echo 'New DNS:'
cat /etc/resolv.conf
echo 'Testing with custom DNS...'
ping -c 3 registry.npmjs.org || echo 'Ping failed with custom DNS'
"

echo ""
echo "=================================="
echo "  测试完成"
echo "==================================" 