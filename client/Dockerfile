# 前端Vue.js应用Dockerfile
FROM node:18-slim as build-stage

# 设置工作目录
WORKDIR /app

# 配置npm镜像源与重试
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm cache clean --force && \
    npm install --production=false --verbose

# 复制源代码
COPY . .

# 构建
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