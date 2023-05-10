const axios = require('axios');
const errorbot = require('@im/im-sdk-plus/dist/listen/functions/error-bot');
const timediff = require('@im/im-sdk-plus/dist/listen/functions/time-diff');
// 查城市ID
const geoapi = axios.create({
    baseURL: "https://geoapi.qweather.com",
    params: {
        key: "fe31d3dd42924bac81b014680b7d76d7"
    }
})
// 查天气
const devapi = axios.create({
    baseURL: "https://devapi.qweather.com",
    params: {
        key: "fe31d3dd42924bac81b014680b7d76d7"
    }
})

// 导入地理位置数据包
const areas = require('@im/im-sdk-plus/dist/listen/data/area_format.json')
const {
    types
} = require('ffi-napi');
const {
    now
} = require('lodash');
// 省份
let province = []
// 城市
let cities = []
// 区/县
let district = []
// 街道
let street = []

// 解构数据
areas.map(S_F => {
    // 获取省份
    province.push(S_F.name)
    S_F.childs.map(C_S => {
        // 获取城市
        cities.push(C_S.name)
        C_S.childs.map(Q_X => {
            // 获取区/县
            district.push(Q_X.name)
            Q_X.childs.map(J_D => {
                // 获取街道
                street.push(J_D.name)
            })
        })
    })
})



/**
 * 天气询问处理
 * @param {Object} usrid 用户信息
 * @param {Object} curBot 机器人信息
 * @param {String} msg 消息内容
 * @param {Object|String} TraTime 全局跟踪时间
 */
function weather(usrid, curBot, msg, TraTime) {
    let datas = semantic(msg)
    if (datas === 0) {
        // 当查询时间小于当前时间时执行的动作
        errorbot(curBot, "抱歉！当前暂不支持查询过往天气信息！", usrid.username, TraTime)
    }
    if (datas === 1) {
        // 当查询时间大于30天
        errorbot(curBot, "最大支持查询30天以内的天气信息", usrid.username, TraTime)
    }

    let url = 'now'
    if (datas.curday && datas.curday < 3) {
        url = '3d'
    } else if (datas.curday) {
        url = datas.daytext
    }

    // 获取区县全称呼
    let iext_name = FindCityID(areas, datas.town)
    geoapi.get('/v2/city/lookup', {
            params: {
                location: datas.town
            }
        })
        .then(res => {
            let data = res.data
            if (data.code === "200") {
                devapi.get(`/v7/weather/${url}`, {
                        params: {
                            location: data.location[0].id
                        }
                    })
                    .then(tres => {
                        let tdata = tres.data
                        if (tdata.code === "200") {
                            // 成功则发送给用户
                            if (url == "now") {
                                send1(usrid, curBot, tdata, iext_name, datas.date, TraTime)
                            } else {
                                send2(usrid, curBot, tdata, iext_name, datas.date, datas.curday, TraTime)
                            }
                        }
                        if (tdata.code === "403") {
                            // 推送错误
                            errorbot(curBot, "服务器拒绝了我们的请求，拒绝原因：非订阅用户最大只允许天获取7的天气预报信息", usrid.username, TraTime)
                        }
                    })
                    .catch(error => {
                        // 推送错误
                        errorbot(curBot, error, usrid.username, TraTime)
                    })
            }
            if (data.code === "404") {
                errorbot(curBot, "没有找到相关城市，可能是您的输入有误或存在错别字，请检查后重试！", usrid.username, TraTime)
            }
        })
        .catch(error => {
            // 推送错误
            errorbot(curBot, error, usrid.username, TraTime)
        })

}

/**
 * 语义处理
 * @param {String} weaMsg 
 */
function semantic(weaMsg) {
    // 已“|”分割成字符串
    const provinceRegex = province.join('|') // 省
    const citiesRegex = cities.join('|') // 市
    const districtRegex = district.join('|') // 区-县
    const streetRegex = street.join('|') // 乡-镇-街道
    // 时间表达式
    const dateRegex = '大前天|前天|昨天|今天|明天|后天|大后天|(2[0-9]{3}/)?([0-9]{1,2}/)([0-9]{1,2})|(2[0-9]{3}-)?([0-9]{1,2}-)([0-9]{1,2})|(2[0-9]{3}年)?([0-9]{1,2}月)?([0-9]{1,2}(日|号))'
    // 匹配词表达式
    const weatherRegex = new RegExp(`(${dateRegex})?(${provinceRegex})?(省)?( )*(${citiesRegex})?(市)?( )*(${districtRegex})?(区|县)?( )*(${streetRegex})?(街道|乡|镇)?( )*(${dateRegex})?(的|地)?(天气|气温|温度|气象)`, 'i')
    // 获取匹配词数组
    const matches = weaMsg.match(weatherRegex)
    if (matches) {
        let date = matches[1] || matches[24] || '今天' // 时间
        let province = matches[12] || "" // 省
        let market = matches[15] || "" // 市
        let county = matches[18] || "" // 区/县
        let town = matches[21] || matches[18] || matches[15] || matches[12] || "双流" // 街道
        let word = matches[29] || matches[11] || "天气" // 关键词

        let year = (matches[2] || matches[5] || matches[8] || matches[25] || matches[28] || matches[31] || "").replace(/[年月日号\/-]/g, '') // 年
        let moon = (matches[3] || matches[6] || matches[9] || matches[26] || matches[29] || matches[32] || "").replace(/[年月日号\/-]/g, '') // 月
        let days = (matches[4] || matches[7] || matches[10] || matches[27] || matches[30] || matches[33] || "").replace(/[年月日号\/-]/g, '') // 日

        // 时间预处理
        let ta = new Date()
        let curday = 0
        let daytext = "now"
        let gex = /(前天|昨天|今天|明天|后天)/
        if (gex.test(date)) {
            let da = date.match(gex)[0]
            switch (da) {
                case "今天":
                    curday = 0
                    break;
                case "明天":
                    ta.setDate(ta.getDate() + 1)
                    curday = 1
                    break;
                case "后天":
                    ta.setDate(ta.getDate() + 2)
                    curday = 2
                    break;
                default:
                    return 0
            }
        } else {
            year ? ta.setFullYear(Number(year)) : ""
            moon ? ta.setMonth(Number(moon - 1)) : ""
            ta.setDate(Number(days))
            console.log(ta.getTime())

            // 计算差值
            curday = getDaysBetweenDates(ta.getTime(), new Date().getTime())
            // 查询时间小于当前时间，暂不支持
            if (ta.getTime() < new Date().getTime()) return 0
            // 大于当前日期的执行
            if (curday > 30) return 1
            if (curday >= 0 && curday < 3) daytext = "3d" // 3Day
            if (curday >= 3 && curday < 7) daytext = "7d" // 7Day
            if (curday >= 7 && curday < 10) daytext = "10d" // 10Day
            if (curday >= 10 && curday < 15) daytext = "15d" // 15Day
            if (curday >= 15 && curday < 30) daytext = "30d" // 30Day
        }

        // 返回结果
        return {
            time: ta,
            daytext,
            curday,
            date,
            province,
            market,
            county,
            town,
            word,
            year,
            moon,
            days
        }
    }
}

/**
 * 发送天气数据---1
 * @param {Object} usrid 用户信息
 * @param {Object} curBot 机器人信息
 * @param {Object} wedata 天气数据
 * @param {String} title 天气数据
 * @param {String} date 天气数据
 * @param {Object|String} TraTime 全局跟踪时间
 */
function send1(usrid, curBot, wedata, title, date, TraTime) {
    let now = wedata.now
    // TraTime为false时，默认为空
    let tar = TraTime ? `<font size='2' color='#CDD0D6'>(本次交互耗时 ${timediff(TraTime)} ) Source: 和风天气</font>` : ""
    let msg = `## ${title}${date}天气情况如下\n\n` +
        `**观测温度：** ${now.temp}℃\n` +
        `**体感温度：** ${now.feelsLike}℃\n` +
        `**观测时间：** ${formatTimestamp(new Date("2023-05-10T16:14+08:00").getTime(),"yyyy年MM月dd日 HH:mm:ss")}\n` +
        `**天气描述：** ${now.text}\n` +
        `**风速：** ${now.windSpeed}km/h\n` +
        `**风向：** ${now.windDir}\n` +
        `**风向角度：** ${now.wind360}°\n` +
        `**风力等级：** ${now.windScale}级\n` +
        `**相对湿度：** ${now.humidity}%\n` +
        `**大气压强：** ${now.pressure} hPa\n` +
        `**降水量：** ${now.precip} mm\n` +
        `**能见度：** ${now.vis}/km\n` +
        `**云量：** ${now.cloud }%\n` +
        `**露点温度：** ${now.dew}℃\n\n` +
        `### **[查看详情](${wedata.fxLink})**`


    axios.post(curBot.webhook.url, {
            "msgtype": "markdown",
            "markdown": {
                "content": `${msg} \n\n --- \n <@=username(${usrid.username})=> ${tar}`
            }
        })
        .then(response => {
            // console.log(response.data);
        })
        .catch(error => {
            throw new Error("Kim-服务响应错误", error)
        })
}

/**
 * 发送天气数据---2
 * @param {Object} usrid 用户信息
 * @param {Object} curBot 机器人信息
 * @param {Object} wedata 天气数据
 * @param {String} title 天气数据
 * @param {String} date 天气数据
 * @param {String} pointer 天气数据
 * @param {Object|String} TraTime 全局跟踪时间
 */
function send2(usrid, curBot, wedata, title, date, pointer, TraTime) {
    console.log(pointer)
    let daily = wedata.daily[pointer]
    // TraTime为false时，默认为空
    let tar = TraTime ? `<font size='2' color='#CDD0D6'>(本次交互耗时 ${timediff(TraTime)} ) Source: 和风天气</font>` : ""
    let msg = `## ${title}${date}天气情况如下\n` +
        `**预报日期：** ${formatTimestamp(new Date(daily.fxDate).getTime(),"yyyy年MM月dd日 HH:mm:ss")}\n` +
        `**最高温度：** ${daily.tempMax}℃\n` +
        `**最低温度：** ${daily.tempMin}℃\n` +
        `**月相名称：** ${daily.moonPhase}\n` +
        `**百天风速：** ${daily.windSpeedDay}km/h\n` +
        `**夜间风速：** ${daily.windSpeedNight}km/h\n` +
        `**风力等级：** ${daily.wind360Day}级\n` +
        `**相对湿度：** ${daily.humidity}%\n` +
        `**大气压强：** ${daily.pressure} hPa\n` +
        `**紫外线：** ${daily.uvIndex}nm\n` +
        `**降水量：** ${daily.precip} mm\n` +
        `**能见度：** ${daily.vis}/km\n` +
        `**云量：** ${daily.cloud }%\n\n` +
        `**[查看详情](${wedata.fxLink})**`


    axios.post(curBot.webhook.url, {
            "msgtype": "markdown",
            "markdown": {
                "content": `${msg} \n\n --- \n <@=username(${usrid.username})=> ${tar}`
            }
        })
        .then(response => {
            // console.log(response.data);
        })
        .catch(error => {
            throw new Error("Kim-服务响应错误", error)
        })
}

/**
 * 将时间戳转换成指定格式
 * @param {String} timestamp 待时间搓
 * @param {String} format 要求格式
 * @returns 
 */
function formatTimestamp(timestamp, format) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const formattedDate = format
        .replace('yyyy', year)
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    return formattedDate;
}

/**
 * 查找城市名称
 * @param {Object} obj 要查找的对象
 * @param {String} name 要查找的值
 * @returns 
 */
function FindCityID(obj, name) {
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].name === name && obj[i].deep <= 2) {
            return obj[i].ext_name;
        } else {
            if (obj[i].childs) {
                let res = FindCityID(obj[i].childs, name);
                if (res) {
                    return res;
                }
            }
        }
    }
}

/**
 * 计算两个时间相差的天数
 * @param {String} date1 时间戳1
 * @param {String} date2 时间戳2
 * @returns 
 */
function getDaysBetweenDates(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
    const timestamp1 = new Date(date1).getTime(); // 将第一个日期转换成时间戳
    const timestamp2 = new Date(date2).getTime(); // 将第二个日期转换成时间戳
    const diff = Math.abs(timestamp1 - timestamp2); // 计算两个时间戳之差的绝对值
    const days = Math.floor(diff / oneDay); // 将时间戳之差转换成天数并向下取整
    return days;
}

module.exports = weather