import winston from "winston";

const { combine, timestamp, prettyPrint, printf, errors } = winston.format;

export const logger = winston.createLogger();

export interface LogConfig {
    level?: string;
    json?: boolean;
    file?: string;
}

export function initLogging(logConfig?: LogConfig) {
    logger.level = logConfig?.level || "info";
    logger.format = combine(errors({stack: true}), timestamp(), logConfig?.json
        ? prettyPrint()
        : printf(({timestamp, level, message, stack}) => {
            const text = `${timestamp} ${level.toUpperCase()} ${message}`;
            return stack ? text + '\n' + stack : text;
        }));
    logger.add(new winston.transports.Console());
    logger.add(new winston.transports.File({filename: logConfig?.file || "removeqtorrent.log"}));
}
