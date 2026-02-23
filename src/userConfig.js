/**
 * 用户配置加载模块
 */

const fs = require('fs');
const path = require('path');

let userConfig = null;

/**
 * 从环境变量解析黑名单
 * 支持格式：
 *   - 单个值: "123456789" 或 "all"
 *   - 多个值: "123456789,987654321,张三"
 *   - JSON数组: "[123456789,987654321]"
 */
function parseBlacklistFromEnv(envValue) {
    if (!envValue) return null;
    
    // 尝试解析为 JSON
    try {
        const parsed = JSON.parse(envValue);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (e) {
        // 不是 JSON，继续其他解析方式
    }
    
    // 如果是 "all"，返回数组
    if (envValue.toLowerCase() === 'all') {
        return ['all'];
    }
    
    // 按逗号分割
    const items = envValue.split(',').map(item => item.trim()).filter(item => item);
    
    // 尝试转换为数字
    return items.map(item => {
        const num = parseInt(item);
        return isNaN(num) ? item : num;
    });
}

/**
 * 加载用户配置文件
 */
function loadUserConfig() {
    // 如果已经加载过，直接返回（已包含环境变量覆盖）
    if (userConfig) return userConfig;
    
    const configPath = path.join(__dirname, '..', 'config.json');
    
    let baseConfig;
    
    // 如果配置文件不存在，使用默认配置
    if (!fs.existsSync(configPath)) {
        console.log('[配置] config.json 不存在，使用默认配置');
        baseConfig = getDefaultConfig();
    } else {
        try {
            const content = fs.readFileSync(configPath, 'utf8');
            const fileConfig = JSON.parse(content);
            console.log('[配置] 已加载 config.json');
            
            // 合并默认配置，确保所有字段都存在
            const defaultConfig = getDefaultConfig();
            baseConfig = mergeConfig(defaultConfig, fileConfig);
        } catch (e) {
            console.error(`[配置] 读取 config.json 失败: ${e.message}`);
            console.log('[配置] 使用默认配置');
            baseConfig = getDefaultConfig();
        }
    }
    
    // 应用环境变量覆盖并缓存
    userConfig = applyEnvOverrides(baseConfig);
    return userConfig;
}

/**
 * 应用环境变量覆盖配置
 */
function applyEnvOverrides(config) {
    const overrides = [];
    
    // 登录配置
    if (process.env.WX_CODE) {
        config.login.wxCode = process.env.WX_CODE;
        overrides.push('WX_CODE');
    }
    if (process.env.QQ_CODE) {
        config.login.qqCode = process.env.QQ_CODE;
        overrides.push('QQ_CODE');
    }
    if (process.env.PLATFORM) {
        config.login.platform = process.env.PLATFORM.toLowerCase();
        overrides.push('PLATFORM');
    }
    
    // 通知配置
    if (process.env.WECOM_WEBHOOK) {
        config.notification.wecomWebhook = process.env.WECOM_WEBHOOK;
        overrides.push('WECOM_WEBHOOK');
    }
    if (process.env.NOTIFICATION_ENABLED !== undefined) {
        config.notification.enabled = process.env.NOTIFICATION_ENABLED === 'true';
        overrides.push('NOTIFICATION_ENABLED');
    }
    
    // 好友配置 - 合并黑名单
    if (process.env.FRIEND_BLACKLIST) {
        const envBlacklist = parseBlacklistFromEnv(process.env.FRIEND_BLACKLIST);
        if (envBlacklist) {
            // 合并配置文件和环境变量中的黑名单
            const configBlacklist = config.friend.blacklist || [];
            
            // 检查是否有 'all'
            const hasAllInConfig = configBlacklist.includes('all') || configBlacklist.includes('ALL');
            const hasAllInEnv = envBlacklist.includes('all') || envBlacklist.includes('ALL');
            
            if (hasAllInConfig || hasAllInEnv) {
                // 如果任一包含 'all'，则使用 'all'
                config.friend.blacklist = ['all'];
            } else {
                // 合并并去重
                const merged = [...configBlacklist, ...envBlacklist];
                config.friend.blacklist = Array.from(new Set(merged.map(item => 
                    typeof item === 'string' ? item.toLowerCase() : item
                ))).map((item, index) => {
                    // 恢复原始值（保持大小写和类型）
                    const original = merged.find(orig => {
                        if (typeof orig === 'string' && typeof item === 'string') {
                            return orig.toLowerCase() === item;
                        }
                        return orig === item;
                    });
                    return original;
                });
            }
            
            overrides.push('FRIEND_BLACKLIST (合并)');
        }
    }
    
    if (process.env.DISABLE_ALL_FRIEND_CHECK !== undefined) {
        config.friend.disableAllFriendCheck = process.env.DISABLE_ALL_FRIEND_CHECK === 'true';
        overrides.push('DISABLE_ALL_FRIEND_CHECK');
    }
    
    // 输出覆盖信息
    if (overrides.length > 0) {
        console.log(`[配置] 环境变量覆盖: ${overrides.join(', ')}`);
    }
    
    // 输出最终黑名单
    if (config.friend.blacklist && config.friend.blacklist.length > 0) {
        const blacklistStr = config.friend.blacklist.slice(0, 5).join(', ');
        const more = config.friend.blacklist.length > 5 ? ` 等${config.friend.blacklist.length}个` : '';
        console.log(`[配置] 好友黑名单: ${blacklistStr}${more}`);
    }
    
    return config;
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
    return {
        login: {
            wxCode: '',
            qqCode: '',
            platform: 'qq'
        },
        notification: {
            wecomWebhook: '',
            enabled: false
        },
        friend: {
            blacklist: [],
            disableAllFriendCheck: false
        },
        invite: {
            links: []
        }
    };
}

/**
 * 合并配置（深度合并）
 */
function mergeConfig(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
        if (userConfig[key] && typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
            result[key] = { ...defaultConfig[key], ...userConfig[key] };
        } else {
            result[key] = userConfig[key];
        }
    }
    
    return result;
}

/**
 * 获取登录配置
 */
function getLoginConfig() {
    const config = loadUserConfig();
    return config.login || getDefaultConfig().login;
}

/**
 * 获取通知配置
 */
function getNotificationConfig() {
    const config = loadUserConfig();
    return config.notification || getDefaultConfig().notification;
}

/**
 * 获取好友配置
 */
function getFriendConfig() {
    const config = loadUserConfig();
    return config.friend || getDefaultConfig().friend;
}

/**
 * 获取邀请链接配置
 */
function getInviteConfig() {
    const config = loadUserConfig();
    return config.invite || getDefaultConfig().invite;
}

module.exports = {
    loadUserConfig,
    getLoginConfig,
    getNotificationConfig,
    getFriendConfig,
    getInviteConfig,
};
