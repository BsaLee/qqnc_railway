/**
 * 任务系统 - 自动领取任务奖励
 */

const { types } = require('./proto');
const { sendMsgAsync, networkEvents } = require('./network');
const { toLong, toNum, log, logWarn, sleep } = require('./utils');
const { getItemName } = require('./gameConfig');

// ============ 防重复领取 ============
const claimingTasks = new Set();  // 正在领取的任务ID
const claimedTasks = new Set();   // 已领取的任务ID（本次运行期间）

// ============ 任务 API ============

async function getTaskInfo() {
    const body = types.TaskInfoRequest.encode(types.TaskInfoRequest.create({})).finish();
    const { body: replyBody } = await sendMsgAsync('gamepb.taskpb.TaskService', 'TaskInfo', body);
    return types.TaskInfoReply.decode(replyBody);
}

async function claimTaskReward(taskId, doShared = false) {
    const body = types.ClaimTaskRewardRequest.encode(types.ClaimTaskRewardRequest.create({
        id: toLong(taskId),
        do_shared: doShared,
    })).finish();
    const { body: replyBody } = await sendMsgAsync('gamepb.taskpb.TaskService', 'ClaimTaskReward', body);
    return types.ClaimTaskRewardReply.decode(replyBody);
}

async function batchClaimTaskReward(taskIds, doShared = false) {
    const body = types.BatchClaimTaskRewardRequest.encode(types.BatchClaimTaskRewardRequest.create({
        ids: taskIds.map(id => toLong(id)),
        do_shared: doShared,
    })).finish();
    const { body: replyBody } = await sendMsgAsync('gamepb.taskpb.TaskService', 'BatchClaimTaskReward', body);
    return types.BatchClaimTaskRewardReply.decode(replyBody);
}

// ============ 任务分析 ============

/**
 * 分析任务列表，找出可领取的任务
 */
function analyzeTaskList(tasks) {
    const claimable = [];
    for (const task of tasks) {
        const id = toNum(task.id);
        const progress = toNum(task.progress);
        const totalProgress = toNum(task.total_progress);
        const isClaimed = task.is_claimed;
        const isUnlocked = task.is_unlocked;
        const shareMultiple = toNum(task.share_multiple);

        // 可领取条件: 已解锁 + 未领取 + 进度完成
        if (isUnlocked && !isClaimed && progress >= totalProgress && totalProgress > 0) {
            claimable.push({
                id,
                desc: task.desc || `任务#${id}`,
                shareMultiple,
                rewards: task.rewards || [],
            });
        }
    }
    return claimable;
}

/**
 * 计算奖励摘要
 */
function getRewardSummary(items) {
    const summary = [];
    for (const item of items) {
        const id = toNum(item.id);
        const count = toNum(item.count);
        // 常见物品ID: 1=金币, 2=经验
        if (id === 1) summary.push(`金币${count}`);
        else if (id === 2) summary.push(`经验${count}`);
        summary.push(`${getItemName(id)}(${id})x${count}`);
    }
    return summary.join('/');
}

// ============ 自动领取 ============

/**
 * 领取单个任务奖励（带自动降级和防重复）
 * 先尝试分享翻倍，失败则自动降级为普通领取
 */
async function claimTaskWithFallback(task) {
    // 防止重复领取
    if (claimingTasks.has(task.id) || claimedTasks.has(task.id)) {
        return false;
    }
    
    claimingTasks.add(task.id);
    
    try {
        const useShare = task.shareMultiple > 1;
        
        try {
            // 尝试分享翻倍领取
            const claimReply = await claimTaskReward(task.id, useShare);
            const items = claimReply.items || [];
            const rewardStr = items.length > 0 ? getRewardSummary(items) : '无';
            const multipleStr = useShare ? ` (${task.shareMultiple}倍)` : '';
            
            log('任务', `✓ ${task.desc}${multipleStr} → ${rewardStr}`);
            claimedTasks.add(task.id);
            return true;
        } catch (e) {
            // 如果是分享翻倍失败（错误码 1008001），尝试普通领取
            if (useShare && (e.message.includes('1008001') || e.message.includes('任务未完成'))) {
                try {
                    const claimReply = await claimTaskReward(task.id, false);
                    const items = claimReply.items || [];
                    const rewardStr = items.length > 0 ? getRewardSummary(items) : '无';
                    
                    log('任务', `✓ ${task.desc} (普通) → ${rewardStr}`);
                    claimedTasks.add(task.id);
                    return true;
                } catch (fallbackError) {
                    // 静默处理已领取错误
                    if (fallbackError.message.includes('1008002') || fallbackError.message.includes('任务已领取')) {
                        claimedTasks.add(task.id);
                        return false;
                    }
                    logWarn('任务', `✗ ${task.desc}: ${fallbackError.message}`);
                    return false;
                }
            }
            
            // 静默处理已领取错误
            if (e.message.includes('1008002') || e.message.includes('任务已领取')) {
                claimedTasks.add(task.id);
                return false;
            }
            
            // 其他错误才输出警告
            logWarn('任务', `✗ ${task.desc}: ${e.message}`);
            return false;
        }
    } finally {
        claimingTasks.delete(task.id);
    }
}

/**
 * 检查并领取所有可领取的任务奖励
 */
async function checkAndClaimTasks() {
    try {
        const reply = await getTaskInfo();
        if (!reply.task_info) return;

        const taskInfo = reply.task_info;
        const allTasks = [
            ...(taskInfo.growth_tasks || []),
            ...(taskInfo.daily_tasks || []),
            ...(taskInfo.tasks || []),
        ];

        const claimable = analyzeTaskList(allTasks);
        if (claimable.length === 0) return;

        log('任务', `发现 ${claimable.length} 个可领取任务`);

        for (const task of claimable) {
            await claimTaskWithFallback(task);
            await sleep(300);
        }
    } catch (e) {
        // 静默失败
    }
}

/**
 * 处理任务状态变化推送
 */
function onTaskInfoNotify(taskInfo) {
    if (!taskInfo) return;

    const allTasks = [
        ...(taskInfo.growth_tasks || []),
        ...(taskInfo.daily_tasks || []),
        ...(taskInfo.tasks || []),
    ];

    const claimable = analyzeTaskList(allTasks);
    if (claimable.length === 0) return;

    // 有可领取任务，延迟后自动领取（增加延迟避免服务器状态未同步）
    log('任务', `有 ${claimable.length} 个任务可领取，准备自动领取...`);
    setTimeout(() => claimTasksFromList(claimable), 2000);
}

/**
 * 从任务列表领取奖励
 */
async function claimTasksFromList(claimable) {
    for (const task of claimable) {
        await claimTaskWithFallback(task);
        await sleep(300);
    }
}

// ============ 初始化 ============

function initTaskSystem() {
    // 监听任务状态变化推送
    networkEvents.on('taskInfoNotify', onTaskInfoNotify);

    // 启动时检查一次任务
    setTimeout(() => checkAndClaimTasks(), 4000);
}

function cleanupTaskSystem() {
    networkEvents.off('taskInfoNotify', onTaskInfoNotify);
    claimingTasks.clear();
    claimedTasks.clear();
}

module.exports = {
    checkAndClaimTasks,
    initTaskSystem,
    cleanupTaskSystem,
};
