# Docker 部署指南

## 快速开始

### 1. 准备配置文件

```bash
# 复制配置文件模板
cp config.example.json config.json

# 编辑配置文件，填写你的登录信息
# 必填项：
#   - login.qqCode 或 login.wxCode
#   - login.platform
# 可选项：
#   - notification.wecomWebhook (企业微信通知)
#   - friend.blacklist (好友黑名单)
#   - invite.links (邀请链接)
```

### 2. 构建并运行

#### 方式一：使用脚本（推荐）

**Linux/Mac:**
```bash
chmod +x docker-run.sh
./docker-run.sh
```

**Windows:**
```cmd
docker-run.bat
```

#### 方式二：使用 docker-compose

```bash
# 构建镜像
docker build -t qq-farm:latest .

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 方式三：使用 docker 命令

```bash
# 构建镜像
docker build -t qq-farm:latest .

# 运行容器
docker run -d \
  --name qq-farm-bot \
  --restart unless-stopped \
  -v $(pwd)/config.json:/app/config.json:ro \
  -e TZ=Asia/Shanghai \
  qq-farm:latest

# 查看日志
docker logs -f qq-farm-bot
```

## 常用命令

### 查看日志
```bash
# 实时查看日志
docker logs -f qq-farm-bot

# 查看最近 100 行日志
docker logs --tail 100 qq-farm-bot
```

### 容器管理
```bash
# 停止容器
docker stop qq-farm-bot

# 启动容器
docker start qq-farm-bot

# 重启容器
docker restart qq-farm-bot

# 删除容器
docker rm -f qq-farm-bot
```

### 更新镜像
```bash
# 拉取最新代码后重新构建
git pull
docker build -t qq-farm:latest .

# 重启容器
docker stop qq-farm-bot
docker rm qq-farm-bot
docker-compose up -d
# 或
./docker-run.sh
```

## 配置说明

### 方式一：使用配置文件（推荐）

配置文件通过 volume 挂载到容器中：

```yaml
volumes:
  - ./config.json:/app/config.json:ro
```

`:ro` 表示只读模式，防止容器修改配置文件。

### 方式二：使用环境变量

环境变量优先级高于配置文件，适合 CI/CD 或多环境部署。

#### 支持的环境变量

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `QQ_CODE` | QQ 登录 code | `QQ_CODE=your_code` |
| `WX_CODE` | 微信登录 code | `WX_CODE=your_code` |
| `PLATFORM` | 平台选择 | `PLATFORM=qq` 或 `PLATFORM=wx` |
| `WECOM_WEBHOOK` | 企业微信机器人地址 | `WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...` |
| `NOTIFICATION_ENABLED` | 是否启用通知 | `NOTIFICATION_ENABLED=true` |
| `FRIEND_BLACKLIST` | 好友黑名单 | 见下方说明 |
| `DISABLE_ALL_FRIEND_CHECK` | 禁用所有好友巡查 | `DISABLE_ALL_FRIEND_CHECK=true` |

#### 好友黑名单格式

`FRIEND_BLACKLIST` 支持多种格式：

```bash
# 单个 GID
FRIEND_BLACKLIST=1118181882

# 多个值（逗号分隔）
FRIEND_BLACKLIST=1118181882,987654321,张三

# JSON 数组
FRIEND_BLACKLIST=[1118181882,987654321]

# 禁用所有好友巡查
FRIEND_BLACKLIST=all
```

#### 使用 .env 文件

1. 复制示例文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件填写配置

3. 使用环境变量配置启动：
   ```bash
   docker-compose -f docker-compose.env.yml up -d
   ```

#### 直接在 docker-compose.yml 中设置

```yaml
services:
  qq-farm:
    environment:
      - QQ_CODE=your_qq_code
      - PLATFORM=qq
      - WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
      - FRIEND_BLACKLIST=1118181882,987654321
```

#### 使用 docker run 命令

```bash
docker run -d \
  --name qq-farm-bot \
  --restart unless-stopped \
  -e QQ_CODE=your_code \
  -e PLATFORM=qq \
  -e WECOM_WEBHOOK=https://qyapi.weixin.qq.com/... \
  -e FRIEND_BLACKLIST=1118181882,987654321 \
  -e TZ=Asia/Shanghai \
  qq-farm:latest
```

### 配置优先级

环境变量 > 配置文件 > 默认值

例如：
- 如果同时设置了 `QQ_CODE` 环境变量和 `config.json` 中的 `qqCode`
- 将使用环境变量中的值

### 环境变量

可以通过环境变量覆盖配置文件中的设置：

```yaml
environment:
  - TZ=Asia/Shanghai          # 时区
  - NODE_ENV=production       # 运行环境
```

### 日志配置

默认日志配置：
- 最大文件大小：10MB
- 保留文件数：3 个

可以在 `docker-compose.yml` 中修改：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 故障排查

### 容器无法启动

1. 检查配置文件是否存在：
   ```bash
   ls -la config.json
   ```

2. 检查配置文件格式是否正确：
   ```bash
   cat config.json | python -m json.tool
   ```

3. 查看容器日志：
   ```bash
   docker logs qq-farm-bot
   ```

### 连接失败

1. 检查网络连接：
   ```bash
   docker exec qq-farm-bot ping -c 3 gate-obt.nqf.qq.com
   ```

2. 检查 code 是否过期：
   - 更新 config.json 中的 code
   - 重启容器：`docker restart qq-farm-bot`

### 配置更新不生效

配置文件更新后需要重启容器：
```bash
docker restart qq-farm-bot
```

## 多账号部署

### 方式一：使用多个配置文件

如果需要运行多个账号，可以创建多个容器：

```bash
# 账号1
docker run -d \
  --name qq-farm-bot-1 \
  -v $(pwd)/config1.json:/app/config.json:ro \
  qq-farm:latest

# 账号2
docker run -d \
  --name qq-farm-bot-2 \
  -v $(pwd)/config2.json:/app/config.json:ro \
  qq-farm:latest
```

### 方式二：使用环境变量（推荐）

使用 docker-compose：

```yaml
version: '3.8'

services:
  qq-farm-1:
    image: qq-farm:latest
    container_name: qq-farm-bot-1
    restart: unless-stopped
    environment:
      - QQ_CODE=账号1的code
      - PLATFORM=qq
      - WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
      - FRIEND_BLACKLIST=1118181882

  qq-farm-2:
    image: qq-farm:latest
    container_name: qq-farm-bot-2
    restart: unless-stopped
    environment:
      - QQ_CODE=账号2的code
      - PLATFORM=qq
      - WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
      - FRIEND_BLACKLIST=all
```

### 方式三：使用 .env 文件

在 `.env` 文件中定义多个账号的变量：

```bash
# 账号1
QQ_CODE_1=账号1的code
FRIEND_BLACKLIST_1=1118181882,987654321

# 账号2
QQ_CODE_2=账号2的code
FRIEND_BLACKLIST_2=all

# 共享配置
WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
```

然后在 docker-compose 中引用：

```yaml
services:
  qq-farm-1:
    environment:
      - QQ_CODE=${QQ_CODE_1}
      - FRIEND_BLACKLIST=${FRIEND_BLACKLIST_1}
      - WECOM_WEBHOOK=${WECOM_WEBHOOK}

  qq-farm-2:
    environment:
      - QQ_CODE=${QQ_CODE_2}
      - FRIEND_BLACKLIST=${FRIEND_BLACKLIST_2}
      - WECOM_WEBHOOK=${WECOM_WEBHOOK}
```

## 安全建议

1. **不要将 config.json 提交到 Git**
   - 已添加到 `.gitignore`
   - 包含敏感的登录信息

2. **使用只读挂载**
   - 配置文件使用 `:ro` 只读模式
   - 防止容器意外修改配置

3. **定期更新镜像**
   - 拉取最新代码
   - 重新构建镜像

4. **监控日志**
   - 定期检查日志
   - 及时发现异常

## 性能优化

### 减小镜像体积

使用 alpine 基础镜像（已默认使用）：
- 镜像大小约 150MB
- 启动速度快

### 资源限制

可以限制容器资源使用：

```yaml
services:
  qq-farm:
    # ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
```

## 备份与恢复

### 备份配置
```bash
cp config.json config.json.backup
```

### 导出镜像
```bash
docker save qq-farm:latest | gzip > qq-farm-image.tar.gz
```

### 导入镜像
```bash
docker load < qq-farm-image.tar.gz
```

## 技术支持

如有问题，请查看：
1. 容器日志：`docker logs qq-farm-bot`
2. 主项目 README.md
3. GitHub Issues
