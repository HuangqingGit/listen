const fs = require("fs");
const path = require('path');

// 创建聊天文件路径
const documentsPath = require('os').homedir() + '\\Documents';
const filePath = path.join(documentsPath, 'chat-data.json');
// 创建一个数据缓存对象
let chatdata = require(filePath)

/**
 * 读写用户聊天信息
 * @param {Object} botdata 机器人对象
 * @param {Object} senduid 用户对象
 * @param {String} sendmsg 消息字符串
 * @param {String} role 此消息作者的角色 system、user 、assistant 默认 user
 */
function readWrite(botdata, senduid, sendmsg, role = "user") {
    let groupid = botdata.groupConfig.GroupId // 群ID
    let botuid = botdata.kwaiUserId // 机器人ID 
    let userid = senduid.kwaiUserId // 用户ID
    // 验证对象中是否有当前用户聊天信息
    if (!chatdata[groupid]) chatdata[groupid] = {}
    if (!chatdata[groupid][botuid]) chatdata[groupid][botuid] = {}
    if (!chatdata[groupid][botuid][userid]) chatdata[groupid][botuid][userid] = []

    // 将本次的消息push到数据中
    chatdata[groupid][botuid][userid].push({
        role: role,
        content: sendmsg
    })
    // 写入文件中记录当前聊天记录的数据大小，以便以后再次读取用户聊
    fs.writeFileSync(filePath, JSON.stringify(chatdata))
    // 返回当前用户的消息合集
    return chatdata[groupid][botuid][userid]
}

module.exports = readWrite;