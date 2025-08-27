#!/bin/bash

# 安排吃啥 - 一键编译部署脚本
# 使用方法: ./build-and-deploy.sh [--force] [--skip-build]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  安排吃啥 - 一键编译部署脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查参数
FORCE_BUILD=false
SKIP_BUILD=false

for arg in "$@"; do
    case "$arg" in
        --force) FORCE_BUILD=true ;;
        --skip-build) SKIP_BUILD=true ;;
        *) print_warning "未知参数: $arg" ;;
    esac
done

# 检查Docker环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    print_message "Docker环境检查通过"
}

# 修复常见代码问题
fix_code_issues() {
    print_message "检查并修复代码问题..."
    
    # 修复CalendarPage.vue中的标签问题
    if grep -q "size=\"small\"" client/src/views/CalendarPage.vue; then
        print_message "修复CalendarPage.vue中的标签问题..."
        sed -i '/size="small"/,/^$/s/^[[:space:]]*$//' client/src/views/CalendarPage.vue
    fi
    
    # 修复MealPage.vue中的TypeScript语法
    if grep -q "as string\[\]" client/src/views/MealPage.vue; then
        print_message "修复MealPage.vue中的TypeScript语法..."
        sed -i 's/\[\] as string\[\]/\[\]/g' client/src/views/MealPage.vue
    fi
    
    # 修复图标导入问题
    if grep -q "Table.*@element-plus/icons-vue" client/src/views/MealPage.vue; then
        print_message "修复图标导入问题..."
        sed -i 's/Table, Edit/Document, Edit/g' client/src/views/MealPage.vue
        sed -i 's/<Table \/>/<Document \/>/g' client/src/views/MealPage.vue
    fi
    
    print_message "代码问题修复完成"
}

# 构建前端应用
build_frontend() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "跳过前端构建"
        return 0
    fi
    
    print_message "开始构建前端应用..."
    
    cd client
    
    # 清理之前的构建
    if [ -d "dist" ]; then
        print_message "清理之前的构建文件..."
        rm -rf dist/
    fi
    
    # 检查node_modules
    if [ ! -d "node_modules" ]; then
        print_message "安装前端依赖..."
        docker run --rm -v $(pwd):/app -w /app node:18-alpine npm install
    fi
    
    # 构建应用
    print_message "构建前端应用..."
    if docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build; then
        print_message "前端构建成功！"
    else
        print_error "前端构建失败，尝试修复代码问题后重新构建..."
        cd ..
        fix_code_issues
        cd client
        docker run --rm -v $(pwd):/app -w /app node:18-alpine npm run build
        print_message "修复后构建成功！"
    fi
    
    cd ..
    
    # 检查构建结果
    if [ -d "client/dist" ]; then
        print_message "构建文件位于: client/dist/"
        ls -la client/dist/
    else
        print_error "构建失败！未找到dist目录"
        exit 1
    fi
}

# 重新部署服务
redeploy_services() {
    print_message "重新部署服务..."
    
    # 停止服务
    print_message "停止现有服务..."
    docker-compose down
    
    # 启动服务
    print_message "启动服务..."
    docker-compose up -d
    
    # 等待服务就绪
    print_message "等待服务就绪..."
    sleep 10
    
    # 检查服务状态
    print_message "检查服务状态..."
    docker-compose ps
    
    # 检查健康状态
    local services=("frontend" "backend" "mongodb")
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            print_message "$service 服务运行正常"
        else
            print_warning "$service 服务可能存在问题"
        fi
    done
}

# 测试服务
test_services() {
    print_message "测试服务连通性..."
    
    # 测试前端
    if curl -s http://localhost:8081 > /dev/null; then
        print_message "✅ 前端服务正常 (http://localhost:8081)"
    else
        print_warning "⚠️  前端服务可能存在问题"
    fi
    
    # 测试后端
    if curl -s http://localhost:3000/meals > /dev/null; then
        print_message "✅ 后端API正常 (http://localhost:3000)"
    else
        print_warning "⚠️  后端API可能存在问题"
    fi
}

# 显示部署信息
show_deployment_info() {
    print_message "部署完成！"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo "  - 前端应用: http://localhost:8081"
    echo "  - 后端API: http://localhost:3000"
    echo "  - Nginx代理: http://localhost:8080"
    echo ""
    echo -e "${BLUE}新增功能:${NC}"
    echo "  - 移动端响应式设计"
    echo "  - 三种显示方式切换 (网格/列表/表格)"
    echo "  - 统一色彩主题"
    echo "  - 优化的登录界面"
    echo ""
    echo -e "${YELLOW}提示:${NC} 可以在手机浏览器中访问测试移动端效果"
}

# 主函数
main() {
    print_header
    
    # 检查Docker环境
    check_docker
    
    # 修复代码问题
    if [ "$FORCE_BUILD" = true ]; then
        fix_code_issues
    fi
    
    # 构建前端
    build_frontend
    
    # 重新部署服务
    redeploy_services
    
    # 测试服务
    test_services
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main "$@" 