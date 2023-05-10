const fs = require('fs');
const path = require('path');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot');
let time

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
        // 如果是要删除的文件，则删除文件
        else if (file === "config.json") {
            // 获取数据
            const data = require(filePath)
            // 删除缓存
            delete require.cache[require.resolve(filePath)]
            // fs.unlinkSync(filePath);
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
                            // 发送通知
                            errorbot(create.CreateBot, "检测到您激活的对话已长时间没有进行交互，避免影响您的及时消息，已自动结束连续对话。", create.CreateUser)
                        }
                    })
                }
            }
        }
    });
}

/**
 * 定时清理长时间未交互的持续对话连接
 */
function clearCid() {
    // 如果定时器不存在就启动定时器
    if (!time) {
        // 每30秒检查一次配置文件
        tiem = setInterval(() => {
            deleteFile(require('os').homedir() + '\\Documents\\chatGPT')
        }, 1000 * 10)
    }

}

module.exports = clearCid;