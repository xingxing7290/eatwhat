#!/bin/bash

# 部署测试脚本
# 用于验证Docker部署是否成功

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "=================================="
echo "  安排吃啥 部署测试脚本"
echo "=================================="

# 检查Docker服务状态
echo "1. 检查Docker服务状态..."
if docker-compose ps | grep -q "Up"; then
    print_success "Docker服务运行正常"
else
    print_error "Docker服务未运行"
    exit 1
fi

# 等待服务启动
echo "2. 等待服务启动..."
sleep 15

# 测试前端服务
echo "3. 测试前端服务..."
if curl -s -f http://localhost:8081/ > /dev/null; then
    print_success "前端服务访问正常"
else
    print_error "前端服务访问失败"
fi

# 测试后端API
echo "4. 测试后端API..."
if curl -s -f http://localhost:3000/ > /dev/null; then
    print_success "后端API访问正常"
else
    print_error "后端API访问失败"
fi

# 测试MongoDB连接
echo "5. 测试MongoDB连接..."
if docker exec eatwhat-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB连接正常"
else
    print_error "MongoDB连接失败"
fi

# 测试Nginx代理
echo "6. 测试Nginx代理..."
if curl -s -f http://localhost:8080/ > /dev/null; then
    print_success "Nginx代理访问正常"
else
    print_warning "Nginx代理访问失败（可能未启动）"
fi

# 检查容器健康状态
echo "7. 检查容器健康状态..."
containers=("eatwhat-frontend" "eatwhat-backend" "eatwhat-mongodb")
all_healthy=true

for container in "${containers[@]}"; do
    if docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null | grep -q "healthy"; then
        print_success "$container 健康检查通过"
    else
        print_warning "$container 健康检查未通过或未配置"
        all_healthy=false
    fi
done

# 性能测试
echo "8. 性能测试..."
echo "   - 前端响应时间:"
start_time=$(date +%s%N)
curl -s http://localhost:8081/ > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
print_success "前端响应时间: ${response_time}ms"

echo "   - API响应时间:"
start_time=$(date +%s%N)
curl -s http://localhost:3000/ > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))
print_success "API响应时间: ${response_time}ms"

# 资源使用情况
echo "9. 资源使用情况..."
echo "   - 容器资源使用:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# 总结
echo ""
echo "=================================="
echo "  测试结果总结"
echo "=================================="

if [ "$all_healthy" = true ]; then
    print_success "所有核心服务运行正常！"
    echo ""
    echo "访问地址:"
    echo "  - 前端应用: http://localhost:8081"
    echo "  - 后端API: http://localhost:3000"
    echo "  - Nginx代理: http://localhost:8080"
    echo ""
    print_success "部署测试完成！"
else
    print_warning "部分服务存在问题，请检查日志"
    echo ""
    echo "查看日志命令:"
    echo "  docker-compose logs [service-name]"
    echo "  ./deploy.sh logs [service-name]"
fi 