# Docker 快速开始

## 一键部署

### Windows 用户

1. 准备配置文件：
   ```cmd
   copy config.example.json config.json
   ```
   然后编辑 `config.json` 填写你的登录信息

2. 运行部署脚本：
   ```cmd
   docker-run.bat
   ```

### Linux/Mac 用户

1. 准备配置文件：
   ```bash
   cp config.example.json config.json
   ```
   然后编辑 `config.json` 填写你的登录信息

2. 运行部署脚本：
   ```bash
   chmod +x docker-run.sh
   ./docker-run.sh
   ```

## 查看运行状态

```bash
# 查看日志
docker logs -f qq-farm-bot

# 查看容器状态
docker ps | grep qq-farm
```

## 常用操作

```bash
# 停止
docker stop qq-farm-bot

# 启动
docker start qq-farm-bot

# 重启
docker restart qq-farm-bot

# 删除
docker rm -f qq-farm-bot
```

## 配置文件说明

`config.json` 必填项：

```json
{
  "login": {
    "qqCode": "你的QQ登录code",
    "platform": "qq"
  }
}
```

可选配置：

```json
{
  "notification": {
    "wecomWebhook": "企业微信机器人地址",
    "enabled": true
  },
  "friend": {
    "blacklist": [1118181882, "好友名字"],
    "disableAllFriendCheck": false
  },
  "invite": {
    "links": ["?uid=xxx&openid=xxx"]
  }
}
```

## 更多信息

详细文档请查看 [DOCKER.md](DOCKER.md)
