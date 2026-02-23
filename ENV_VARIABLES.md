# 环境变量配置指南

## 概述

脚本支持通过环境变量进行配置，环境变量的优先级高于配置文件。这对于 Docker 部署、CI/CD 或多环境管理非常有用。

## 配置优先级

```
环境变量 > config.json > 默认值
```

## 支持的环境变量

### 登录配置

| 变量名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `QQ_CODE` | String | QQ 小程序登录 code | `QQ_CODE=your_qq_code` |
| `WX_CODE` | String | 微信小程序登录 code | `WX_CODE=your_wx_code` |
| `PLATFORM` | String | 平台选择：`qq` 或 `wx` | `PLATFORM=qq` |

### 通知配置

| 变量名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `WECOM_WEBHOOK` | String | 企业微信机器人 Webhook 地址 | `WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx` |
| `NOTIFICATION_ENABLED` | Boolean | 是否启用通知 | `NOTIFICATION_ENABLED=true` |

### 好友配置

| 变量名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `FRIEND_BLACKLIST` | String/Array | 好友黑名单 | 见下方详细说明 |
| `DISABLE_ALL_FRIEND_CHECK` | Boolean | 禁用所有好友巡查 | `DISABLE_ALL_FRIEND_CHECK=true` |

## FRIEND_BLACKLIST 详细说明

`FRIEND_BLACKLIST` 支持多种格式：

### 1. 单个 GID（数字）

```bash
FRIEND_BLACKLIST=1118181882
```

### 2. 单个名字（字符串）

```bash
FRIEND_BLACKLIST=张三
```

### 3. 多个值（逗号分隔）

```bash
# 混合 GID 和名字
FRIEND_BLACKLIST=1118181882,987654321,张三,李四

# 只有 GID
FRIEND_BLACKLIST=1118181882,987654321,1234567890

# 只有名字
FRIEND_BLACKLIST=张三,李四,王五
```

### 4. JSON 数组格式

```bash
# 数字数组
FRIEND_BLACKLIST=[1118181882,987654321]

# 字符串数组
FRIEND_BLACKLIST=["张三","李四"]

# 混合数组
FRIEND_BLACKLIST=[1118181882,"张三",987654321]
```

### 5. 禁用所有好友巡查

```bash
FRIEND_BLACKLIST=all
# 或
FRIEND_BLACKLIST=ALL
```

## 使用方式

### 1. Docker Run

```bash
docker run -d \
  --name qq-farm-bot \
  --restart unless-stopped \
  -e QQ_CODE=your_code \
  -e PLATFORM=qq \
  -e WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx \
  -e NOTIFICATION_ENABLED=true \
  -e FRIEND_BLACKLIST=1118181882,987654321 \
  -e TZ=Asia/Shanghai \
  qq-farm:latest
```

### 2. Docker Compose

#### 方式 A：直接在 docker-compose.yml 中设置

```yaml
version: '3.8'

services:
  qq-farm:
    image: qq-farm:latest
    container_name: qq-farm-bot
    restart: unless-stopped
    environment:
      - QQ_CODE=your_code
      - PLATFORM=qq
      - WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
      - NOTIFICATION_ENABLED=true
      - FRIEND_BLACKLIST=1118181882,987654321
      - TZ=Asia/Shanghai
```

#### 方式 B：使用 .env 文件（推荐）

1. 创建 `.env` 文件：

```bash
# 复制示例文件
cp .env.example .env
```

2. 编辑 `.env` 文件：

```bash
QQ_CODE=your_code
PLATFORM=qq
WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
NOTIFICATION_ENABLED=true
FRIEND_BLACKLIST=1118181882,987654321
```

3. 在 docker-compose.yml 中引用：

```yaml
version: '3.8'

services:
  qq-farm:
    image: qq-farm:latest
    env_file:
      - .env
```

4. 启动：

```bash
docker-compose -f docker-compose.env.yml up -d
```

### 3. 本地运行

#### Linux/Mac

```bash
export QQ_CODE=your_code
export PLATFORM=qq
export WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
export FRIEND_BLACKLIST=1118181882,987654321

node client.js
```

#### Windows CMD

```cmd
set QQ_CODE=your_code
set PLATFORM=qq
set WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
set FRIEND_BLACKLIST=1118181882,987654321

node client.js
```

#### Windows PowerShell

```powershell
$env:QQ_CODE="your_code"
$env:PLATFORM="qq"
$env:WECOM_WEBHOOK="https://qyapi.weixin.qq.com/..."
$env:FRIEND_BLACKLIST="1118181882,987654321"

node client.js
```

## 多账号配置示例

### 使用 .env 文件

```bash
# .env 文件
QQ_CODE_1=账号1的code
QQ_CODE_2=账号2的code
WECOM_WEBHOOK=https://qyapi.weixin.qq.com/...
FRIEND_BLACKLIST_1=1118181882,987654321
FRIEND_BLACKLIST_2=all
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  qq-farm-1:
    image: qq-farm:latest
    container_name: qq-farm-bot-1
    restart: unless-stopped
    environment:
      - QQ_CODE=${QQ_CODE_1}
      - PLATFORM=qq
      - WECOM_WEBHOOK=${WECOM_WEBHOOK}
      - FRIEND_BLACKLIST=${FRIEND_BLACKLIST_1}

  qq-farm-2:
    image: qq-farm:latest
    container_name: qq-farm-bot-2
    restart: unless-stopped
    environment:
      - QQ_CODE=${QQ_CODE_2}
      - PLATFORM=qq
      - WECOM_WEBHOOK=${WECOM_WEBHOOK}
      - FRIEND_BLACKLIST=${FRIEND_BLACKLIST_2}
```

## 验证配置

启动容器后，查看日志确认环境变量是否生效：

```bash
docker logs qq-farm-bot
```

你应该看到类似的输出：

```
[配置] 已加载 config.json
[配置] 环境变量覆盖: QQ_CODE, PLATFORM, WECOM_WEBHOOK, FRIEND_BLACKLIST
```

## 常见问题

### Q: 环境变量不生效？

A: 检查以下几点：
1. 环境变量名是否正确（区分大小写）
2. 重启容器：`docker restart qq-farm-bot`
3. 查看日志确认是否有 "环境变量覆盖" 的提示

### Q: FRIEND_BLACKLIST 格式错误？

A: 确保：
1. 逗号分隔时没有多余空格
2. JSON 格式时使用正确的引号
3. 查看日志中是否有解析错误

### Q: 同时设置了配置文件和环境变量？

A: 环境变量优先级更高，会覆盖配置文件中的值。

### Q: 如何禁用环境变量？

A: 删除或注释掉环境变量，然后重启容器。

## 安全建议

1. **不要将 .env 文件提交到 Git**
   - 已添加到 `.gitignore`
   - 包含敏感的登录信息

2. **使用 Docker Secrets（生产环境）**
   ```yaml
   services:
     qq-farm:
       secrets:
         - qq_code
   
   secrets:
     qq_code:
       file: ./secrets/qq_code.txt
   ```

3. **定期更新 code**
   - code 有有效期
   - 过期后需要重新获取

4. **限制容器权限**
   - 使用非 root 用户运行
   - 限制网络访问

## 参考

- [Docker 环境变量文档](https://docs.docker.com/compose/environment-variables/)
- [Docker Compose .env 文件](https://docs.docker.com/compose/env-file/)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)
