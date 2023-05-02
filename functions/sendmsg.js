const axios = require('axios');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot')
const readwrite = require('@im/im-sdk-plus/dist/listen/functions/read-write')
// const marked = require('marked')

// 设置axios的默认host
// axios.defaults.baseURL = 'https://api.kuckji.cn'; // 测试环境: https://api.kuckji.cn/api/'
// axios.defaults.baseURL = 'http://localhost:3002'; // 测试环境: http://localhost:3002/api/'
axios.defaults.baseURL = 'https://chat.kuckji.cn'; // 线上环境：https://chat.kuckji.cn/api/' ChatGPT-3.5-turbo


/**
 * 发送消息给数据预处理服务器
 * @param {Object} KwaiMsg Kwai消息体
 * @param {Number} msgType 消息类型
 * @param {String} usrid UserID/BotID
 * @param {Object} curBot BotInfo对象
 * @param {Object|String} TraTime TraTime
 */
function sendBot(KwaiMsg, msgType, usrid, curBot, TraTime) {
    // 替换webhook的值
    curBot.webhook = JSON.parse(decodeURIComponent(curBot.webhook))

    // 文本消息
    if (msgType === 0) {
        let msgStr = KwaiMsg.text.replace(`@${curBot.displayName} `, "")

        // 调用读写信息函数
        axios.post('/api', {
                senduid: usrid,
                sendmsg: readwrite(curBot, usrid, msgStr),
                botdata: curBot,
                tratime: TraTime
            })
            .then(function (response) {
                let data = response.data.data
                data.choices.forEach(item => {
                    console.log(readwrite(curBot, usrid, item.message.content, item.message.role))
                })
            })
            .catch(function (error) {
                let err = error.response
                delete err.config.data
                delete err.request
                delete err.data
                errorbot(curBot, err, usrid.username, TraTime)
            })
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