/**
 * 每小时推送账号信息模块
 */

const axios = require('axios');
const { getNotificationConfig } = require('./userConfig');
const { statusData } = require('./status');

let hourlyNotifyTimer = null;

/**
 * 发送企业微信通知
 */
function sendWeComNotification(content) {
    const notifyConfig = getNotificationConfig();
    
    // 检查是否启用通知
    if (!notifyConfig.enabled || !notifyConfig.wecomWebhook) {
        return;
    }

    const payload = {
        msgtype: 'text',
        text: {
            content: content
        }
    };

    axios.post(notifyConfig.wecomWebhook, payload).catch(err => {
        console.error('[通知] 企业微信推送失败:', err.message);
    });
}

/**
 * 格式化账号信息
 */
function formatAccountInfo() {
    const { name, level, gold, exp, platform } = statusData;
    const platformName = platform === 'wx' ? '微信' : 'QQ';
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    return `【QQ农场脚本】账号信息推送
平台: ${platformName}
昵称: ${name || '未知'}
等级: ${level}
金币: ${gold}
经验: ${exp}
时间: ${time}`;
}

/**
 * 启动每小时推送
 */
function startHourlyNotify() {
    // 立即推送一次
    const info = formatAccountInfo();
    sendWeComNotification(info);
    console.log('[定时推送] 已发送账号信息');

    // 设置每小时推送一次
    hourlyNotifyTimer = setInterval(() => {
        const info = formatAccountInfo();
        sendWeComNotification(info);
        console.log('[定时推送] 已发送账号信息');
    }, 60 * 60 * 1000);  // 1小时
}

/**
 * 停止每小时推送
 */
function stopHourlyNotify() {
    if (hourlyNotifyTimer) {
        clearInterval(hourlyNotifyTimer);
        hourlyNotifyTimer = null;
        console.log('[定时推送] 已停止');
    }
}

module.exports = {
    startHourlyNotify,
    stopHourlyNotify,
};
