@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM QQ农场脚本 Docker 镜像打包脚本

REM 配置
set IMAGE_NAME=qq-farm
set IMAGE_TAG=latest
set REGISTRY=

echo ========================================
echo    QQ农场脚本 Docker 镜像打包
echo ========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装
    echo [提示] 请先安装 Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

REM 显示构建信息
echo [信息] 镜像名称: %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%
echo [信息] 构建时间: %date% %time%
echo.

REM 构建镜像
echo [1/3] 开始构建 Docker 镜像...
docker build -t %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG% .

if errorlevel 1 (
    echo [错误] 构建失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 构建成功！

REM 显示镜像信息
echo.
echo [3/3] 镜像信息:
docker images %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%

echo.
echo ========================================
echo    打包完成！
echo ========================================
echo.

REM 提供后续操作建议
echo [后续操作]
echo.
echo 1. 运行容器:
echo    docker run -d --name qq-farm-bot -e QQ_CODE=your_code %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%
echo.
echo 2. 使用 docker-compose:
echo    docker-compose up -d
echo.
echo 3. 保存镜像为文件:
echo    docker save %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG% -o qq-farm-%IMAGE_TAG%.tar
echo.
echo 4. 推送到镜像仓库 (需要先配置 REGISTRY):
echo    docker push %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%
echo.
echo 5. 查看镜像层信息:
echo    docker history %REGISTRY%%IMAGE_NAME%:%IMAGE_TAG%
echo.
pause
