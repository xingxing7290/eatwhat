# 前端Vue.js应用Dockerfile
FROM node:18-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 安装必要的网络工具
RUN apk add --no-cache curl

# 配置DNS和npm镜像源
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf && \
    npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 复制package文件
COPY package*.json ./

# 清理缓存并安装依赖
RUN npm cache clean --force && \
    npm install --production=false --verbose

# 验证依赖安装
RUN ls -la && \
    ls -la node_modules/ && \
    echo "Checking for vite..." && \
    find node_modules -name "vite" -type f && \
    echo "Checking .bin directory..." && \
    ls -la node_modules/.bin/ || echo ".bin directory not found"

# 复制源代码
COPY . .

# 尝试构建
RUN npm run build

# 生产阶段
FROM nginx:alpine as production-stage

# 复制构建产物到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 