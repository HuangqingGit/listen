const cid = require('@im/im-sdk-plus/dist/listen/functions/msg-centers/cid')
const weather = require('@im/im-sdk-plus/dist/listen/functions/msg-centers/weather')

/*正则表达式配置*/

let openCID = /^(开始|开启|打开|停止|结束|关闭)?( )*(连续|持续)?对话( )*(模式)?$/i // GPT连续对话
let weaTher = /(天气|气温|温度|气象)/ // 天气

/**
 * 消息处理中心，处理各类消息的分发地址
 * @param {Object} usrid 用户信息
 * @param {Object} curBot 机器人信息
 * @param {String} msg 消息内容
 * @param {Object|String} TraTime 全局跟踪时间
 */
function msgcenter(usrid, curBot, msg, TraTime) {

    // 匹配连续对话功能
    if (openCID.test(msg)) {
        // 创建对话
        cid.createCid(usrid, curBot, msg, TraTime)
    }
    // 匹配消息中是有天气相关的关键词
    if (weaTher.test(msg)) {
        weather(usrid, curBot, msg, TraTime)
    }

    // 都不满足以上逻辑则执行默认执行GPT
}

module.exports = msgcenter;