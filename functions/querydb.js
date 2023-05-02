const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Users/cd-huangqing/AppData/Roaming/Kim/localData/databases/684276754383/users.db').serialize();

/**
 * 封装一个DB数据查询函数
 * @param {String} statement 传递查询SQL语句
 */
function queryDB(statement) {
    return new Promise((resolve, reject) => {
        // 读取文件
        db.each(statement, (err, row) => {
            if (err) {
                reject(err)
            }
            resolve(data = {
                code: 1,
                data: row
            })
        });
    });
}

module.exports = queryDB;