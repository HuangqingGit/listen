const fs = require('fs');
const path = require('path');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot');
// 保存记录当前存活的链接数量
let SurvivalLink = 0

/**
 * 删除目录下config配置文件
 * @param {String} rootDir 目录地址Path
 */
function deleteFile(rootDir) {
    // 判断当前的路径是否存在如果不存在则直接退出
    if (!fs.existsSync(rootDir)) return
    // 获取当前目录下的所有文件和文件夹
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
        // 获取当前文件/文件夹的完整路径
        const filePath = path.join(rootDir, file);
        // 如果是目录，则递归调用 deleteFile
        if (fs.statSync(filePath).isDirectory()) {
            deleteFile(filePath);
        }
        // 如果是config.json文件
        else if (file === "config.json") {
            // 获取数据
            const data = require(filePath)
            // 删除缓存
            delete require.cache[require.resolve(filePath)]
            // 读取数据类型为Object的文件
            if (Object.prototype.toString.call(data) === "[object Object]") {
                // 获取数据
                const create = require(data.createPath)
                // 清楚缓存
                delete require.cache[require.resolve(data.createPath)]
                // 删除长时间没有交互的链接
                if ((create.UpdateTime + (1000 * 60 * 5)) < Date.now()) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            // 发送通知
                            errorbot(create.CreateBot, "连续对话结束异常,请稍后再试或联系管理员处理!", create.CreateUser)
                        } else {
                            // 当前存活的对话链接数量 -1
                            SurvivalLink -= 1
                            // 发送通知
                            errorbot(create.CreateBot, "检测到您激活的对话已长时间没有进行交互，避免影响您的及时消息，已自动结束连续对话。", create.CreateUser)
                        }
                    })
                } else {
                    // 当前存活的对话链接数量 +1
                    SurvivalLink += 1
                }
            }
        }
    });

    // 根据存活链接数量返回状态
    if (SurvivalLink) {
        return true
    } else {
        return false
    }
}

/**
 * 定时清理长时间未交互的持续对话连接
 */
function clearCid(t = 0) {
    // 每30秒检查一次配置文件
    setTimeout(() => {
        const Survival = deleteFile(require('os').homedir() + '\\Documents\\chatGPT')
        // 重置计数
        SurvivalLink = 0
        if (Survival) {
            // 如果返回结果为true 则递归调用 5s
            clearCid(5000)
        } else {
            // 120s 后再次调用
            clearCid(120000)
        }
    }, t)
}

module.exports = clearCid;

clearCid()