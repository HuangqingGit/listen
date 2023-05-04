const groupIds = require('@im/im-sdk-plus/dist/listen/data/group_packet.json')
const querydb = require('@im/im-sdk-plus/dist/listen/functions/querydb')
const sendmsg = require('@im/im-sdk-plus/dist/listen/functions/sendmsg')
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot')
const cid = require('@im/im-sdk-plus/dist/listen/functions/msg-centers/cid')
const clearCid = require('@im/im-sdk-plus/dist/listen/functions/clear-cid')


let Employee = 'SELECT * FROM EmployeeInfo WHERE kwaiUserId = '
let Bot = 'SELECT * FROM BotInfo WHERE kwaiUserId = '

/**
 * BOT机器人监听消息函数
 * @param {Object} pbMessage 消息体
 * @param {Number} targetType 消息类型
 * @param {Object} th 传递指向this
 */
async function listen(pbMessage, targetType, th) {
    // 启动链接清理器
    clearCid()
    // 全局跟踪时间
    let TrackingTime = new Date()
    // 消息类型
    let messageType = pbMessage.contentType
    // 判断逻辑
    if (groupIds[pbMessage.strTargetId]) {
        // 如果此群的配置被禁用则停止执行
        if (groupIds[pbMessage.strTargetId].Disable) return

        let KwaiMsg = th.rawMessageToKwaiMsg(pbMessage.strTargetId, targetType, pbMessage) // 接收到的消息
        let usrid = pbMessage.fromUser.uid.toString() // 转换userID
        if (usrid === "undefined" || usrid === null) usrid = "100" // 如果userID不存在则默认为100

        // 用try和catch进行捕获异常
        try {
            // 在db数据库中查找消息发送者的信息
            let userResult = await querydb(`${Employee}${usrid}`)
            // 如果code为真则将查询结果重新赋值给usrid
            if (userResult.code) usrid = userResult.data
        } catch (error) {
            console.log(error)
        }

        // 遍历匹配被@的机器人Name
        for (var i = 0; i < groupIds[pbMessage.strTargetId].BotIds.length; i++) {
            // 用try和catch进行捕获异常
            try {
                // 当前下标的Bot机器人信息
                let curBot = groupIds[pbMessage.strTargetId].BotIds[i]
                // 在db数据库中查找Bot机器人信息
                let botResult = await querydb(`${Bot}${curBot.botId}`)
                // 把群当前ID和群中的其他机器人配置加到botResult中
                let batdata = botResult.data
                batdata.groupConfig = groupIds[pbMessage.strTargetId]
                // 匹配到的组名称
                let pattern = new RegExp(`^@${batdata.displayName} `, 'gi')
                // 如果没有@机器人则退出当前循环，继续下一次循环
                if (!pattern.test(KwaiMsg.text)) continue

                // 如果Bot机器人没有被禁用则进行下一步
                if (curBot.enable) {
                    // 如果code和sendmsg的返回结果都为True则退出for循环
                    if (botResult.code && sendmsg(KwaiMsg, messageType, usrid, batdata, TrackingTime)) return
                } else {
                    let msg = '对不起，当前机器人的交互功能已被管理员禁用！ \n\n  Sorry, the interaction function of the current robot has been disabled by the administrator!'
                    // 如果机器人已经禁用,则判断是否发送提示信息
                    if (curBot.disablePrompts) errorbot(batdata, msg, usrid.username, TrackingTime)
                    return
                }
            } catch (error) {
                console.log(error)
                // 如果需要重新尝试，可以使用 continue，否则使用 break
                break;
            }
        }

        // 如果前面没有检测到@机器人事件，则最后来处理连续对话
        cid.handleCid(usrid, KwaiMsg, TrackingTime)

        // 以上条件都不满足时打印消息类型
        // console.log(messageType, KwaiMsg)
    }
}

module.exports = listen