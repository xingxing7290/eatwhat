# 后端Node.js应用Dockerfile
FROM node:18-slim

# 设置工作目录
WORKDIR /app

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

# 健康检查（使用 node 进行http探活，避免wget依赖）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/',res=>{if(res.statusCode>=200&&res.statusCode<500)process.exit(0);process.exit(1)}).on('error',()=>process.exit(1))"

# 启动应用
CMD ["npm", "start"] 