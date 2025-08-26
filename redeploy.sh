#!/bin/bash

# 一键重新编译并更新部署脚本
# 使用: ./redeploy.sh [--local] [--pull] [--prune]
#   --local  使用本地预构建策略（先在宿主机npm install/build，再用Dockerfile.local构建）
#   --pull   先执行 git pull 获取最新代码
#   --prune  构建前清理未使用镜像/缓存释放磁盘

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info(){ echo -e "${GREEN}[INFO]${NC} $*"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $*"; }
err(){ echo -e "${RED}[ERROR]${NC} $*"; }

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

DO_LOCAL=false
DO_PULL=false
DO_PRUNE=false
for arg in "$@"; do
	case "$arg" in
		--local) DO_LOCAL=true ;;
		--pull) DO_PULL=true ;;
		--prune) DO_PRUNE=true ;;
		*) warn "未知参数: $arg" ;;
	esac
done

check_tools(){
	command -v docker >/dev/null 2>&1 || { err "未安装docker"; exit 1; }
	command -v docker-compose >/dev/null 2>&1 || { err "未安装docker-compose"; exit 1; }
}

pull_code(){
	if $DO_PULL; then
		info "拉取最新代码..."
		git pull --rebase || { err "git pull 失败"; exit 1; }
	fi
}

prune_if_needed(){
	if $DO_PRUNE; then
		info "清理未使用数据(镜像/缓存/网络/构建缓存)..."
		docker system prune -a -f || true
		info "清理完成"
	fi
}

build_standard(){
	info "使用标准模式: docker-compose 直接构建镜像"
	set +e
	docker-compose build --no-cache backend frontend
	local code=$?
	set -e
	if [ $code -ne 0 ]; then
		err "标准构建失败。可尝试: 1) ./redeploy.sh --prune 释放磁盘后重试；2) ./redeploy.sh --local 使用本地预构建；3) 检查网络/DNS。"
		exit $code
	fi
}

recreate_stack(){
	info "以无停机方式更新容器(尽量)："
	docker-compose up -d --no-deps --build backend frontend
	info "刷新依赖服务(可选)"
	docker-compose up -d mongodb
	info "检查状态"
	docker-compose ps
}

build_local(){
	info "使用本地预构建策略"
	# 后端先在宿主机安装依赖
	pushd server >/dev/null
	if [ ! -d node_modules ]; then
		info "后端安装依赖..."
		npm config set registry https://registry.npmmirror.com
		npm install
	else
		info "后端已存在 node_modules，执行增量安装..."
		npm config set registry https://registry.npmmirror.com
		npm install
	fi
	popd >/dev/null

	# 构建后端本地镜像
	docker build -t eatwhat-backend-local -f server/Dockerfile.local server

	# 前端本地构建
	pushd client >/dev/null
	npm config set registry https://registry.npmmirror.com
	npm install
	npm run build
	popd >/dev/null

	# 注意：client/.dockerignore 可能忽略 dist，临时重命名确保包含
	DOCKERIGNORE_PATH="client/.dockerignore"
	RESTORE_DOCKERIGNORE=false
	if [ -f "$DOCKERIGNORE_PATH" ] && grep -q "^dist$" "$DOCKERIGNORE_PATH"; then
		mv "$DOCKERIGNORE_PATH" "client/.dockerignore.backup"
		RESTORE_DOCKERIGNORE=true
	fi

	docker build -t eatwhat-frontend -f client/Dockerfile.local client

	if $RESTORE_DOCKERIGNORE; then
		mv "client/.dockerignore.backup" "$DOCKERIGNORE_PATH"
	fi

	# 使用 docker-compose.local.yml 更新运行（仅前后端替换为本地镜像）
	docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d frontend backend

	info "本地预构建更新完成"
}

main(){
	check_tools
	pull_code
	prune_if_needed

	if $DO_LOCAL; then
		build_local
	else
		build_standard
		recreate_stack
	fi

	info "完成。 前端: http://localhost:${FRONTEND_PORT:-8081} 后端: http://localhost:${BACKEND_PORT:-3000}"
}

main "$@" 