import winston from "winston";

const { combine, timestamp, prettyPrint, printf, errors } = winston.format;

export let logger = winston.createLogger();

export class LogConfig {
    constructor(public level: string = "info",
                public json: boolean = false,
                public file: string = "removeqtorrent.log") {
    }
}

export function initLogging(logConfig: LogConfig) {
    logger.level = logConfig?.level;
    logger.format = combine(errors({stack: true}), timestamp(), logConfig.json
        ? prettyPrint()
        : printf(({timestamp, level, message, stack}) => {
            const text = `${timestamp} ${level.toUpperCase()} ${message}`;
            return stack ? text + '\n' + stack : text;
        }));
    logger.add(new winston.transports.Console());
    logger.add(new winston.transports.File({filename: logConfig?.file}));
}
