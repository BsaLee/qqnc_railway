# QQ 农场挂机脚本

一个功能完整的 QQ 农场自动化脚本，支持自动收获、种植、巡查好友、领取任务等功能。支持 QQ 和微信两个平台，可通过 Docker 轻松部署。

## ✨ 功能特性

### 核心功能
- ✅ **自动收获** - 自动收获成熟作物
- ✅ **自动种植** - 收获后自动购买种子并种植
- ✅ **自动施肥** - 自动给作物施肥
- ✅ **自动除草/除虫** - 自动清理农场
- ✅ **自动铲除** - 铲除枯死作物
- ✅ **自动出售** - 每分钟自动出售仓库果实

### 好友功能
- ✅ **自动巡查好友** - 帮忙浇水、除草、除虫
- ✅ **自动偷菜** - 自动从好友农场偷菜
- ✅ **好友黑名单** - 支持指定不巡查的好友
- ✅ **自动同意好友申请** - 微信环境自动同意好友申请

### 任务系统
- ✅ **自动领取任务** - 自动领取完成的任务奖励
- ✅ **分享翻倍** - 支持分享翻倍/三倍奖励
- ✅ **自动降级** - 分享翻倍失败自动降级为普通领取

### 通知功能
- ✅ **企业微信通知** - 登录成功、掉线等事件推送
- ✅ **实时日志** - 详细的操作日志输出

### 部署方式
- ✅ **Docker 支持** - 一键 Docker 部署
- ✅ **环境变量配置** - 灵活的环境变量支持
- ✅ **多账号部署** - 支持同时运行多个账号

## 🚀 快速开始

### 前置要求

- Node.js 18+ 或 Docker
- QQ/微信小程序登录 code
- （可选）企业微信机器人 webhook

### 本地运行

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/qq-farm-bot.git
cd qq-farm-bot
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置文件

```bash
# 复制配置文件模板
cp config.example.json config.json

# 编辑配置文件
# 填写你的登录 code、平台、webhook 等信息
```

#### 4. 运行脚本

```bash
# QQ 平台
node client.js --code your_qq_code

# 微信平台
node client.js --code your_wx_code --wx

# 使用配置文件（无需传 code）
node client.js
```

### Docker 运行

#### 快速启动（推荐）

**Windows:**
```cmd
docker-run.bat
```

**Linux/Mac:**
```bash
chmod +x docker-run.sh
./docker-run.sh
```

#### 手动 Docker 命令

```bash
# 构建镜像
docker build -t qq-farm:latest .

# 运行容器
docker run -d --name qq-farm-bot --restart unless-stopped \
  -e QQ_CODE=your_code \
  -e PLATFORM=qq \
  -e WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx \
  -e FRIEND_BLACKLIST=1118181882,987654321 \
  -e TZ=Asia/Shanghai \
  qq-farm:latest

# 查看日志
docker logs -f qq-farm-bot
```

#### Docker Compose

```bash
# 使用配置文件
docker-compose up -d

# 使用环境变量
docker-compose -f docker-compose.env.yml up -d
```

## 📋 配置说明

### config.json 配置

```json
{
  "login": {
    "wxCode": "微信登录code",
    "qqCode": "QQ登录code",
    "platform": "qq"
  },
  
  "notification": {
    "wecomWebhook": "企业微信机器人地址",
    "enabled": true
  },
  
  "friend": {
    "blacklist": [1118181882, "好友名字"],
    "disableAllFriendCheck": false
  },
  
  "invite": {
    "links": ["?uid=xxx&openid=xxx&share_source=xxx"]
  }
}
```

### 环境变量配置

支持通过环境变量覆盖配置文件（优先级更高）：

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| `QQ_CODE` | QQ 登录 code | `QQ_CODE=your_code` |
| `WX_CODE` | 微信登录 code | `WX_CODE=your_code` |
| `PLATFORM` | 平台选择 | `PLATFORM=qq` 或 `wx` |
| `WECOM_WEBHOOK` | 企业微信机器人 | `WECOM_WEBHOOK=https://...` |
| `NOTIFICATION_ENABLED` | 启用通知 | `NOTIFICATION_ENABLED=true` |
| `FRIEND_BLACKLIST` | 好友黑名单 | `FRIEND_BLACKLIST=1118181882,987654321` |
| `DISABLE_ALL_FRIEND_CHECK` | 禁用所有好友巡查 | `DISABLE_ALL_FRIEND_CHECK=true` |

详见 [ENV_VARIABLES.md](ENV_VARIABLES.md)

## 🎮 使用示例

### 基础用法

```bash
# QQ 平台，自动巡查
node client.js --code your_qq_code

# 微信平台，自动巡查
node client.js --code your_wx_code --wx

# 自定义巡查间隔（秒）
node client.js --code your_code --interval 30 --friend-interval 5
```

### 好友黑名单

```bash
# 拉黑指定好友
docker run -d --name qq-farm-bot \
  -e QQ_CODE=your_code \
  -e FRIEND_BLACKLIST=1118181882,987654321 \
  br00wn/qq-farm:latest

# 禁用所有好友巡查
docker run -d --name qq-farm-bot \
  -e QQ_CODE=your_code \
  -e FRIEND_BLACKLIST=all \
  br00wn/qq-farm:latest
```

### 企业微信通知

```bash
docker run -d --name qq-farm-bot \
  -e QQ_CODE=your_code \
  -e WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx \
  -e NOTIFICATION_ENABLED=true \
  br00wn/qq-farm:latest
```

### 多账号部署

```yaml
version: '3.8'

services:
  qq-farm-1:
    image: br00wn/qq-farm:latest
    environment:
      - QQ_CODE=账号1的code
      - PLATFORM=qq
      - FRIEND_BLACKLIST=1118181882

  qq-farm-2:
    image: br00wn/qq-farm:latest
    environment:
      - QQ_CODE=账号2的code
      - PLATFORM=qq
      - FRIEND_BLACKLIST=all
```

## 📊 日志输出示例

```
[启动] QQ code=0c3rkhll... 农场1s 好友10s
========== 登录成功 ==========
  GID:    123456789
  昵称:   张三
  等级:   25
  金币:   12345
===============================

[巡田] 检查完成: 收获3 种植3 施肥2
[好友] 巡查 5 人 → 偷6/除草2/浇水1
[任务] 发现 2 个可领取任务
[任务] ✓ 完成1次收获 → 金币1800/点券20
[仓库] 出售完成，共获得 100 金币
```

## 🔧 命令行参数

```bash
node client.js [选项]

选项:
  --code <code>              登录 code（必需，或在 config.json 中配置）
  --qr                       QQ 平台扫码登录
  --wx                       使用微信平台（默认为 QQ）
  --interval <秒>            自己农场巡查间隔（默认 10 秒）
  --friend-interval <秒>     好友巡查间隔（默认 1 秒）
  --verify                   验证 proto 定义
  --decode <数据>            解码 PB 数据
```

## 🐳 Docker 相关

### 构建镜像

```bash
docker build -t qq-farm:latest .
```

### 推送到 Docker Hub

```bash
# 登录
docker login

# 打标签
docker tag qq-farm:latest yourusername/qq-farm:latest

# 推送
docker push yourusername/qq-farm:latest
```

### 常用 Docker 命令

```bash
# 查看日志
docker logs -f qq-farm-bot

# 停止容器
docker stop qq-farm-bot

# 启动容器
docker start qq-farm-bot

# 重启容器
docker restart qq-farm-bot

# 删除容器
docker rm -f qq-farm-bot
```

详见 [DOCKER.md](DOCKER.md)

## 📝 配置文件说明

### share.txt（邀请链接）

仅微信环境有效，格式：

```
?uid=123456&openid=oABCD1234567890&share_source=1&doc_id=abc123
?uid=789012&openid=oXYZ9876543210&share_source=2&doc_id=def456
```

启动时会自动处理这些邀请链接。

### .env 文件

用于 Docker 环境变量配置，详见 [.env.example](.env.example)

## ⚙️ 高级配置

### 自定义巡查间隔

```bash
# 农场 30 秒巡查一次，好友 5 秒巡查一次
node client.js --code your_code --interval 30 --friend-interval 5
```

### 调试模式

```bash
# 查看指定好友的详细信息
# 在 src/friend.js 中修改 DEBUG_FRIEND_LANDS 变量
```

### 禁用功能

```bash
# 禁用所有好友巡查
DISABLE_ALL_FRIEND_CHECK=true

# 禁用企业微信通知
NOTIFICATION_ENABLED=false
```

## 🔐 安全建议

1. **不要分享 config.json** - 包含登录凭证
2. **使用私有 Docker 仓库** - 如果镜像包含敏感信息
3. **定期更新 code** - code 有有效期
4. **使用环境变量** - 比配置文件更安全
5. **监控日志** - 及时发现异常

## 🐛 故障排查

### 连接失败

```
[WS] 错误: unable to verify the first certificate
```

**解决方案：** 这是 SSL 证书验证问题，已在 Dockerfile 中处理，无需手动干预。

### 任务领取失败

```
[任务] ⚠ ✗ 完成1次收获: 任务未完成
```

**解决方案：** 脚本会自动降级为普通领取，无需处理。

### 容器无法启动

1. 检查配置文件：`docker logs qq-farm-bot`
2. 检查网络连接
3. 重启 Docker：`docker restart qq-farm-bot`

详见 [DOCKER.md](DOCKER.md) 的故障排查部分

## 📚 文档

- [DOCKER.md](DOCKER.md) - Docker 部署详细指南
- [ENV_VARIABLES.md](ENV_VARIABLES.md) - 环境变量完整说明
- [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md) - Docker 快速开始

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## ⚖️ 声明

本项目开源免费，严禁倒卖。请从公开仓库免费获取。

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有贡献者和使用者的支持！

---

**最后更新：** 2026-02-14

**项目地址：** https://github.com/yourusername/qq-farm-bot

**问题反馈：** https://github.com/yourusername/qq-farm-bot/issues
