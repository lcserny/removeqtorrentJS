const winston = require('winston');
const { combine, timestamp, prettyPrint, printf, errors } = winston.format;

let logger = winston.createLogger();

function initLogging(logConfig) {
    logger.level = logConfig?.level || "info";
    logger.format = combine(errors({stack: true}), timestamp(), logConfig.json
        ? prettyPrint()
        : printf(({timestamp, level, message, stack}) => {
            const text = `${timestamp} ${level.toUpperCase()} ${message}`;
            return stack ? text + '\n' + stack : text;
        }));
    logger.add(new winston.transports.Console());
    logger.add(new winston.transports.File({filename: logConfig?.file || "removeqtorrent.log"}));
}

module.exports = {
    initLogging,
    logger
};