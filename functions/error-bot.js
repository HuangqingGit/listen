const axios = require('axios');
const timediff = require('@im/im-sdk-plus/dist/listen/functions/time-diff');

/**
 * 推送错误信息给Bot
 * @param {Object} webhook // 发送到webhook地址? 这个地址必须是一个Bot对象
 * @param {String} message // 发送给谁的webhook的消息内容? 这个消息内容必须是String，支持Markdown语法格式
 * @param {String} username // 是谁发送的消息，用户邮箱前缀
 * @param {String} IntTime // 信息跟踪信息，包含了请求时长，响应时长，支持Markdown语法格式
 */
function sendErrorMessage(webhook, message, username, IntTime) {
    webhook = typeof (webhook.webhook) != 'object' ? JSON.parse(decodeURIComponent(webhook.webhook)) : webhook.webhook
    let tar = `<font size='2' color='#CDD0D6'>(本次交互耗时 ${timediff(IntTime)} ) Source: Kim-listen-In</font>`
    axios.post(webhook.url, {
            "msgtype": "markdown",
            "markdown": {
                "content": `${objectToMarkdown(message)} \n\n --- \n <@=username(${username})=> ${tar}`
            }
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            throw new Error("Kim-服务响应错误", error)
        })
}
/**
 * 将对象转换成Markdown格式
 * @param {Object} obj 要转换的对象
 * @returns 
 */
function objectToMarkdown(obj) {
    let output = '-----------**服务响应异常请稍后再试**-----------\n\n'
    output = output + '```json\n{\n';

    Object.keys(obj).forEach(key => {
        const innerObj = obj[key];
        const innerObjKeys = Object.keys(innerObj);
        // 如果innerObj为空，就跳过它
        if (innerObjKeys.length === 0) {
            return;
        }
        output += `    ${key}: {\n`;
        innerObjKeys.forEach(innerKey => {
            const value = innerObj[innerKey];
            if (value !== '') {
                output += `        ${innerKey}: ${JSON.stringify(value)}\n`;
            }
        });
        output += '    }\n';
    });
    
    output += '}\n```';
    // 从输出中删除空值
    output = output.replace(/"{}/g, '{}');
    output = output.replace(/,\n\s*\n/g, ',\n');
    // 设置属性名称格式
    output = output.replace(/(\w+):/g, '$1:');

    return output;
}
module.exports = sendErrorMessage;