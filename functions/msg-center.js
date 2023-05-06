const cid = require('@im/im-sdk-plus/dist/listen/functions/msg-centers/cid')

// 连续对话聊天储存根目录
const chatPath = require('os').homedir() + '\\Documents\\chatGPT';

/*正则表达式配置*/

let openCID = /^(开始|开启|打开|停止|结束|关闭)?( )*(连续|持续)?对话( )*(模式)?$/i // GPT连续对话
let cities = ['北京', '上海', '广州', '深圳']; // 示例城市列表
let cityRegex = new RegExp(cities.join('|'), 'g');
let reg = /(前天|昨天|今天|明天|后天)?( )*(\S)?( )*(的|地)?天气( )(in)?( )(中国)?( )([^\s]*)?/gi;
let a = /(前天|昨天|今天|明天|后天)?( )*(的|地)?天气/


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

    const query = '明天广州天气怎么样？'; // 示例询问
    let match = reg.exec(query);
    while (match != null) {
        const city = match[12]; // 城市名称在正则表达式中的第12组
        console.log(city);
        match = reg.exec(query);
    }
}

module.exports = msgcenter;