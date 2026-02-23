#!/bin/bash

# QQ农场脚本 Docker 运行脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   QQ农场脚本 Docker 部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 config.json 是否存在
if [ ! -f "config.json" ]; then
    echo -e "${RED}错误: config.json 不存在${NC}"
    echo -e "${YELLOW}请先复制 config.example.json 为 config.json 并填写配置${NC}"
    echo ""
    echo "  cp config.example.json config.json"
    echo "  # 然后编辑 config.json 填写你的配置"
    echo ""
    exit 1
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo -e "${YELLOW}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}警告: docker-compose 未安装，将使用 docker 命令${NC}"
    USE_COMPOSE=false
else
    USE_COMPOSE=true
fi

echo -e "${GREEN}[1/3] 构建 Docker 镜像...${NC}"
docker build -t qq-farm:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}构建失败！${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[2/3] 停止旧容器（如果存在）...${NC}"
docker stop qq-farm-bot 2>/dev/null
docker rm qq-farm-bot 2>/dev/null

echo ""
echo -e "${GREEN}[3/3] 启动容器...${NC}"

if [ "$USE_COMPOSE" = true ]; then
    docker-compose up -d
else
    docker run -d \
        --name qq-farm-bot \
        --restart unless-stopped \
        -v "$(pwd)/config.json:/app/config.json:ro" \
        -e TZ=Asia/Shanghai \
        qq-farm:latest
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "查看日志:"
    echo "  docker logs -f qq-farm-bot"
    echo ""
    echo "停止容器:"
    echo "  docker stop qq-farm-bot"
    echo ""
    echo "重启容器:"
    echo "  docker restart qq-farm-bot"
    echo ""
else
    echo -e "${RED}启动失败！${NC}"
    exit 1
fi
