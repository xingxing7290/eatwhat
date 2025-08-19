# 后端Node.js应用Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装网络工具和设置DNS
RUN apk add --no-cache curl wget && \
    echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf

# 设置npm镜像源和网络配置
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# 复制package.json和package-lock.json
COPY package*.json ./

# 清理缓存并安装依赖
RUN npm cache clean --force && \
    npm install --verbose

# 复制源代码
COPY . .

# 创建uploads目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动应用
CMD ["npm", "start"] 