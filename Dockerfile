# 使用 Node.js 官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置时区为中国
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建配置文件目录（如果不存在）
RUN mkdir -p /app/config

# 暴露配置文件为卷（可选）
VOLUME ["/app/config"]

# 设置环境变量
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai
# 禁用 SSL 验证（解决证书问题）
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 启动脚本
CMD ["node", "client.js"]
