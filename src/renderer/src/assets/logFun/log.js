/**
 * 日志打印函数
 * @param {Date} date - 日志记录时间,格式：YYYY-MM-DD HH:mm
 * @param {string} log - 要打印的日志内容
 * @param {string} type - 日志类型，可选值为 'info', 'error', 'warning'，默认值为 'info'
 * @param {String} model - 日志记录模型，可选值为 'console', 'file'，默认值为 'file'
 * @param {string} fileName - 可选参数，指定日志文件名
 * @returns {void}
 * @description 该函数用于打印日志信息，根据日志类型和文件名进行分类打印。
 * 当 model 为 'console' 时，将日志打印到控制台；
 * 当 model 为 'file' 时，将日志记录到指定的日志文件中。
 * 当 fileName 未指定时，默认使用 '{HH:mm}.txt' 作为日志文件名。
 * 文件夹的名字为 '{date}'，格式为 YYYY-MM-DD
 * 日志文件的路径为 './logInfo/{date}/{HH:mm}.txt'
 * 日志文件为error的时候单独记录在 './logError/{date}/{HH:mm}.txt'
 * 日志文件的格式为：'{date} {HH:mm} {type} {log}'
 * @author Li Zezhong
 * @version 1.0.0
 * @date 2025/11/30
 */
