//cfg 
const LOG_LEVEL = "info"

require('winston-logstash');
const winston = require('winston');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    level: LOG_LEVEL,
    //prettyPrint: true,
    colorize: true,
    timestamp: true
});
/*
winston.add(winston.transports.File, {
    filename: APP_NAME + '_error.log',
    level: 'error',
    timestamp: true
});
winston.add(winston.transports.Logstash, {
    port: 5050,
    ssl_enable: false,
    host: 'listener.logz.io',
    max_connect_retries: -1,
    meta: {
        token: 'bdOAQvprXpSokYCuQkrmacxzMFGlbNGD'
    },
    node_name: APP_NAME,

    level: 'info',
    timestamp: true,
});
*/
module.exports = function (module_name) {
    const logger = {
        error: function (text, meta) {
            winston.log('error', /*module_name + ': ' +*/ text, {from: module_name})
        },
        warn: function (text, meta) {
            winston.log('warn', /*module_name + ': ' +*/ text, {from: module_name})
        },
        info: function (text, meta) {
            winston.log('info', /*module_name + ': ' +*/ text, {from: module_name})
        },
        debug: function (text, meta) {
            winston.log('debug', /*module_name + ': ' +*/ text, {from: module_name})
        },
        log: function (level, msg, meta) {
            winston.log(level, /*module_name + ': ' +*/ text, {from: module_name})
        }
    }

    return logger;
}
