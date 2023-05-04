const axios = require('axios');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot')
const readwrite = require('@im/im-sdk-plus/dist/listen/functions/read-write')
const msgcenter = require('@im/im-sdk-plus/dist/listen/functions/msg-center')

// 设置axios的默认host
axios.defaults.baseURL = 'https://chat.kuckji.cn';


/**
 * 发送消息给数据预处理服务器
 * @param {Object} KwaiMsg Kwai消息体
 * @param {Number} msgType 消息类型
 * @param {Object} usrid UserID/BotID
 * @param {Object} curBot BotInfo对象
 * @param {Object|String} TraTime TraTime
 */
function sendBot(KwaiMsg, msgType, usrid, curBot, TraTime) {
    // 替换webhook的值
    curBot.webhook = JSON.parse(decodeURIComponent(curBot.webhook))

    // 文本消息
    if (msgType === 0) {
        let msgStr = KwaiMsg.text.replace(`@${curBot.displayName} `, "")
        msgcenter(usrid, curBot, msgStr, TraTime)
        return true
    }

    // 图片消息
    if (msgType === 1) {
        console.log('图像消息:', KwaiMsg)
        return true
    }
    // 附带消息回复类型
    if (msgType === 12) {
        console.log('回复消息:', KwaiMsg)
        return true
    }
    // 没有匹配的消息处理类型时返回True
    return false
}

module.exports = sendBot