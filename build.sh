#!/bin/bash

# QQ农场脚本 Docker 镜像打包脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="qq-farm"
IMAGE_TAG="latest"
REGISTRY=""  # 留空表示本地，或填写如 "registry.example.com/"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   QQ农场脚本 Docker 镜像打包${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    echo -e "${YELLOW}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# 显示构建信息
echo -e "${BLUE}镜像名称:${NC} ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${BLUE}构建时间:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 构建镜像
echo -e "${GREEN}[1/3] 开始构建 Docker 镜像...${NC}"
docker build -t ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}构建失败！${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}[2/3] 构建成功！${NC}"

# 显示镜像信息
echo ""
echo -e "${GREEN}[3/3] 镜像信息:${NC}"
docker images ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}

# 获取镜像大小
IMAGE_SIZE=$(docker images ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG} --format "{{.Size}}")
echo ""
echo -e "${BLUE}镜像大小:${NC} ${IMAGE_SIZE}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   打包完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 提供后续操作建议
echo -e "${YELLOW}后续操作:${NC}"
echo ""
echo "1. 运行容器:"
echo "   docker run -d --name qq-farm-bot -e QQ_CODE=your_code ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "2. 使用 docker-compose:"
echo "   docker-compose up -d"
echo ""
echo "3. 保存镜像为文件:"
echo "   docker save ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG} | gzip > qq-farm-${IMAGE_TAG}.tar.gz"
echo ""
echo "4. 推送到镜像仓库 (需要先配置 REGISTRY):"
echo "   docker push ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "5. 查看镜像层信息:"
echo "   docker history ${REGISTRY}${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
