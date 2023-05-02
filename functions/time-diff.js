/**
 * 计算两个时间的差值，并以分/秒/毫秒为单位展示
 * @param {String|Object} stamp1 时间戳/Date 对象
 * @param {[String|Object]} stamp2 时间戳2 默认为当前时间戳
 * @returns 
 */
function timeDifference(stamp1, stamp2 = Date.now()) {
    if (typeof (stamp1) == "string" && stamp1.length == 13) {
        stamp1 = Number(stamp1)
    } else if (typeof (stamp1) == "object" || typeof (stamp1) == "string") {
        stamp1 = new Date(stamp1).getTime()
    } else if (typeof (stamp1) != "number") {
        throw new Error("传递的时间戳 1 必须是[Date|Number]")
    }

    const milliseconds = Math.abs(stamp2 - stamp1);
    if (milliseconds < 1000) {
        return milliseconds + ' ms';
    }
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
        return seconds + ' s';
    }
    const minutes = Math.floor(seconds / 60);
    return minutes + ' min';
}

module.exports = timeDifference;