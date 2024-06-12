const winston = require('winston');
const { combine, timestamp, prettyPrint, errors } = winston.format;

let logger = winston.createLogger({
    format: combine(errors({stack: true}), timestamp(), prettyPrint())
});

function initLogging(logConfig) {
    logger.level = logConfig?.level || "info";
    logger.add(new winston.transports.Console());
    logger.add(new winston.transports.File({filename: logConfig?.file || "removeqtorrent.log.json"}));
}

module.exports = {
    initLogging,
    logger
};