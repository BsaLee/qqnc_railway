@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo    QQ农场脚本 Docker 部署
echo ========================================
echo.

REM 检查 config.json 是否存在
if not exist "config.json" (
    echo [错误] config.json 不存在
    echo [提示] 请先复制 config.example.json 为 config.json 并填写配置
    echo.
    echo   copy config.example.json config.json
    echo   REM 然后编辑 config.json 填写你的配置
    echo.
    pause
    exit /b 1
)

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装
    echo [提示] 请先安装 Docker Desktop: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [1/3] 构建 Docker 镜像...
docker build -t qq-farm:latest .

if errorlevel 1 (
    echo [错误] 构建失败！
    pause
    exit /b 1
)

echo.
echo [2/3] 停止旧容器（如果存在）...
docker stop qq-farm-bot >nul 2>&1
docker rm qq-farm-bot >nul 2>&1

echo.
echo [3/3] 启动容器...

REM 检查 docker-compose 是否可用
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [提示] 使用 docker 命令启动...
    docker run -d ^
        --name qq-farm-bot ^
        --restart unless-stopped ^
        -v "%cd%\config.json:/app/config.json:ro" ^
        -e TZ=Asia/Shanghai ^
        qq-farm:latest
) else (
    echo [提示] 使用 docker-compose 启动...
    docker-compose up -d
)

if errorlevel 1 (
    echo [错误] 启动失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo    部署成功！
echo ========================================
echo.
echo 查看日志:
echo   docker logs -f qq-farm-bot
echo.
echo 停止容器:
echo   docker stop qq-farm-bot
echo.
echo 重启容器:
echo   docker restart qq-farm-bot
echo.
pause
