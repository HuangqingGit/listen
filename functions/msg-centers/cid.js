const fs = require("fs");
const path = require('path')
const axios = require('axios');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot');
// 连续对话聊天储存根目录
const chatPath = require('os').homedir() + '\\Documents\\chatGPT';
// 设置axios的默认host
axios.defaults.baseURL = 'https://chat.kuckji.cn';

/**
 * Create 创建对话方法
 * @param {Object} usrid 用户信息
 * @param {Object} curBot 机器人信息
 * @param {String} msg 消息内容
 * @param {Object|String} TraTime 全局跟踪时间
 */
function create(usrid, curBot, msg, TraTime) {
    // 唯一时间戳
    let date = Date.now()
    // 存储路径
    let filePath = path.join(chatPath, `${usrid.username}\\group-${curBot.groupConfig.GroupId}\\bot-${curBot.kwaiUserId}`);
    // 连续对话配置路径
    let cidPath = path.join(chatPath, `${usrid.username}\\group-${curBot.groupConfig.GroupId}`);
    // 文件名称
    let fileName = `chat-${date}.json`

    // 停止连续对话
    if (/^(停止|结束|关闭)( )*/.test(msg)) {
        // 删除对话记录
        fs.unlink(`${cidPath}\\config.json`, (err) => {
            if (err) {
                // 发送通知
                errorbot(curBot, "连续对话结束异常,请稍后再试或连续管理员处理!", usrid.username, TraTime)
            } else {
                // 发送通知
                errorbot(curBot, "已结束连续对话!", usrid.username, TraTime)
            }
        })
    }
    // 新建连续对话
    else {
        // 当前用户在当前这个群已经有对应激活状态的对话机器人，则取消创建新的对话并给出提醒
        if (fs.existsSync(`${cidPath}\\config.json`)) {
            errorbot(curBot, "当前已存在激活的对话记录，如要使用新的对话，请结束当前对话后重试！", usrid.username, TraTime)
            return false
        }
        // 效验路径并创建文件
        createIfNotExists(`${filePath}\\${fileName}`, {
            // 配置基础信息
            CreateTime: date, // 创建时间
            CreateUser: usrid.username, // 创建者Name
            CreateBot: curBot, // 关联的Bot对象
            UpdateTime: date, // 最近更新时间
            ChatDatas: [] // 聊天数据对象
        })
        // 写入配置文件
        createIfNotExists(`${filePath}\\config.json`, [{
            createTime: date,
            createPath: `${filePath}\\${fileName}`
        }])
        // 写入当前连续对话配置
        createIfNotExists(`${cidPath}\\config.json`, {
            createTime: date,
            createPath: `${filePath}\\${fileName}`
        }, true)

        // 发送已开启连续对话通知
        errorbot(curBot, "连续对话模式已开启，您可以在不 @我 的情况下与我进行连续对话/问答！\n\n 退出连续对话模式请发送：结束对话", usrid.username, TraTime)
    }
}


/**
 * CID 连续对话消息分发模块
 * @param {Object} usrid 用户信息
 * @param {Object} KwaiMsg 消息报文
 * @param {Object|String} TraTime 全局跟踪时间
 */
function handle(usrid, KwaiMsg, TraTime) {
    // 连续对话功能枚举
    let uuid = usrid.username // 当前用户名
    let grid = KwaiMsg.sessionTargetId // 消息群ID
    let uuPath = `${chatPath}\\${uuid}\\group-${grid}\\config.json` // 数据缓存路径

    // 验证文件是否存在
    if (fs.existsSync(uuPath)) {
        // 读取当前连续对话配置
        const isCurPath = require(uuPath)
        // 删除缓存
        delete require.cache[require.resolve(uuPath)]
        // 读取当前连续对话数据
        let chats = require(isCurPath.createPath)
        // 删除缓存
        delete require.cache[require.resolve(isCurPath.createPath)]

        // 已经处于连续对话状态时给出提醒
        if (/^(开始|开启|打开)?( )*(连续|持续)?对话( )*(模式)?$/.test(KwaiMsg.text)) {
            // 发送通知
            errorbot(chats.CreateBot, "当前已处于连续对话状态!", usrid.username, TraTime)
            return false
        }
        // 停止/结束连续对话
        if (/^(停止|结束|关闭)( )*(连续|持续)?对话( )*(模式)?$/.test(KwaiMsg.text)) {
            // 删除对话记录
            fs.unlink(uuPath, (err) => {
                if (err) {
                    // 发送通知
                    errorbot(chats.CreateBot, "连续对话结束异常,请稍后再试或联系管理员处理!", usrid.username, TraTime)
                } else {
                    // 发送通知
                    errorbot(chats.CreateBot, "已结束连续对话!", usrid.username, TraTime)
                }
            })
            return false
        }

        // 记录当前用户发送的信息
        chats.ChatDatas.push({
            role: 'user',
            content: KwaiMsg.text
        })
        // 发送消息
        axios.post('/api', {
                senduid: usrid,
                sendmsg: chats.ChatDatas,
                botdata: chats.CreateBot,
                tratime: TraTime
            })
            .then(function (response) {
                let data = response.data.data
                data.choices.forEach(item => {
                    // 将本次回答写入choices数据库中
                    chats.ChatDatas.push({
                        role: item.message.role,
                        content: item.message.content
                    })
                    chats.UpdateTime = Date.now()
                    // 数据写入
                    fs.writeFileSync(isCurPath.createPath, JSON.stringify(chats))
                })
            })
            .catch(function (error) {
                let err = error.response
                delete err.config.data
                delete err.request
                delete err.data
                errorbot(curBot, err, usrid.username, TraTime)
            })

    }
}

/**
 * 效验文件路径是否存在，不存在则创建路径/文件
 * @param {String} filePath 文件路径
 * @param {Object} fileData 写入的数据
 * @param {Object} isrewrite 是否重写
 */
function createIfNotExists(filePath, fileData, isrewrite = false) {
    if (!fs.existsSync(filePath)) {
        const directoryPath = path.dirname(filePath);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, {
                recursive: true
            });
        }
        fs.writeFileSync(filePath, JSON.stringify(fileData));
        return false
    } else {
        let configs = require(filePath)
        if (isrewrite) {
            // 需要重写
            fs.writeFileSync(filePath, JSON.stringify(fileData));
        } else {
            // 不需要重新
            let arrays = [...Array.from(configs), ...fileData]
            fs.writeFileSync(filePath, JSON.stringify(arrays));
        }
        // 删除缓存
        delete require.cache[require.resolve(filePath)];
        return true
    }
}

module.exports.handleCid = handle
module.exports.createCid = create