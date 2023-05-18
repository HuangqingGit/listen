const fs = require('fs')
const urls = require('@im/im-sdk-plus/dist/listen/config.json')
const path = process.env.ProgramFiles + "\\Kim\\resources\\app\\app\\public\\react\\app\\app.html"

/**
 * 初始化：配置connect-src属性
 */
function add_src() {
    // 读取HTML文件
    let html = fs.readFileSync(path, 'utf8');

    urls['connect-src'].forEach(item => {
        // 创建一个正则表达式，用于匹配所需的 URL
        const regex = new RegExp(`^${item.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
        // 找到 connect-src 指令中的所有现有 URL 并移除空字符串、null、undefined
        const existingUrls = html.match(/connect-src\s+([^;]+)/)[1].split(' ').filter(Boolean);
        // 检查所需的 URL 是否已在 connect-src 指令中
        if (!existingUrls.some(url => regex.test(url))) {
            // 如果所需的 URL 不在 connect-src 指令中，则将其添加到 connect-src 指令中
            html = html.replace(/connect-src\s+([^;]+)/, `connect-src $1 ${item}`);
        }
    })

    // 重新写入文件
    fs.writeFileSync(path, html, (err) => {
        if (err) throw err;
        console.log('HTML file has been written!');
    })
}

module.exports = add_src
// 自动执行该函数
add_src()