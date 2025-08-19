#!/bin/bash

# 安排吃啥 (eatwhat) Docker部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|status|logs|clean]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="eatwhat"
COMPOSE_FILE="docker-compose.yml"

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
    echo -e "${BLUE}  安排吃啥 Docker部署脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Docker是否安装
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

# 检查端口占用
check_ports() {
    local ports=("8081" "3000" "27017" "8080")
    local conflicts=()
    
    for port in "${ports[@]}"; do
        if netstat -tulpn 2>/dev/null | grep ":$port " > /dev/null; then
            conflicts+=("$port")
        fi
    done
    
    if [ ${#conflicts[@]} -gt 0 ]; then
        print_warning "以下端口已被占用: ${conflicts[*]}"
        print_warning "请确保这些端口可用或修改docker-compose.yml中的端口映射"
    fi
}

# 创建必要的目录
create_directories() {
    mkdir -p server/uploads
    mkdir -p logs
    print_message "创建必要的目录"
}

# 启动服务
start_services() {
    print_message "启动所有服务..."
    docker-compose -f $COMPOSE_FILE up -d --build
    
    if [ $? -eq 0 ]; then
        print_message "服务启动成功！"
        print_message "等待服务就绪..."
        sleep 10
        
        # 检查服务状态
        check_services_status
        
        print_message "部署完成！"
        print_message "访问地址:"
        echo "  - 前端应用: http://localhost:8081"
        echo "  - 后端API: http://localhost:3000"
        echo "  - Nginx代理: http://localhost:8080"
    else
        print_error "服务启动失败"
        exit 1
    fi
}

# 停止服务
stop_services() {
    print_message "停止所有服务..."
    docker-compose -f $COMPOSE_FILE down
    print_message "服务已停止"
}

# 重启服务
restart_services() {
    print_message "重启所有服务..."
    stop_services
    sleep 2
    start_services
}

# 查看服务状态
check_services_status() {
    print_message "检查服务状态..."
    docker-compose -f $COMPOSE_FILE ps
    
    # 检查健康状态
    local services=("frontend" "backend" "mongodb")
    for service in "${services[@]}"; do
        if docker-compose -f $COMPOSE_FILE ps | grep -q "$service.*Up"; then
            print_message "$service 服务运行正常"
        else
            print_warning "$service 服务可能存在问题"
        fi
    done
}

# 查看日志
show_logs() {
    if [ -z "$1" ]; then
        print_message "显示所有服务日志..."
        docker-compose -f $COMPOSE_FILE logs -f
    else
        print_message "显示 $1 服务日志..."
        docker-compose -f $COMPOSE_FILE logs -f "$1"
    fi
}

# 清理资源
clean_resources() {
    print_warning "这将删除所有容器、网络和数据卷！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "清理所有资源..."
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        docker system prune -f
        print_message "清理完成"
    else
        print_message "取消清理操作"
    fi
}

# 备份数据
backup_data() {
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    print_message "开始备份数据到 $backup_dir..."
    
    # 备份MongoDB数据
    if docker-compose -f $COMPOSE_FILE ps | grep -q "mongodb.*Up"; then
        print_message "备份MongoDB数据..."
        docker exec eatwhat-mongodb mongodump --out /data/backup
        docker cp eatwhat-mongodb:/data/backup "$backup_dir/mongodb_backup"
    fi
    
    # 备份上传文件
    if [ -d "server/uploads" ]; then
        print_message "备份上传文件..."
        cp -r server/uploads "$backup_dir/uploads"
    fi
    
    # 创建压缩包
    tar -czf "${backup_dir}.tar.gz" "$backup_dir"
    rm -rf "$backup_dir"
    
    print_message "备份完成: ${backup_dir}.tar.gz"
}

# 显示帮助信息
show_help() {
    echo "使用方法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志 (可选: 服务名)"
    echo "  backup    备份数据"
    echo "  clean     清理所有资源"
    echo "  help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start          # 启动服务"
    echo "  $0 logs frontend  # 查看前端日志"
    echo "  $0 status         # 查看服务状态"
}

# 主函数
main() {
    print_header
    
    case "${1:-start}" in
        start)
            check_docker
            check_ports
            create_directories
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_services_status
            ;;
        logs)
            show_logs "$2"
            ;;
        backup)
            backup_data
            ;;
        clean)
            clean_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 