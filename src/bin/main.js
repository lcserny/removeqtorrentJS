#!/usr/bin/env node

const {initLogging, logger} = require("../logging");
const {processArgs} = require("../args");
const {generateConfig} = require("../config");
const HistoryUpdater = require("../history");
const MongoWrapper = require("../mongo");
const QBitTorrentHandler = require("../qbittorrent");

async function main() {
    const args = processArgs();
    const config = await generateConfig(args.config);
    initLogging(config.log);

    try {
        logger.info("Executing command");

        const hash = args.hash;
        logger.info(`Hash received: '${hash}'`);

        const torrentHandler = new QBitTorrentHandler(config);
        const mongoWrapper = new MongoWrapper(config);
        const historyUpdater = new HistoryUpdater(mongoWrapper);

        const sid = await torrentHandler.generateSid();
        const torrents = await torrentHandler.listTorrents(sid, hash);
        await Promise.all([
            historyUpdater.updateHistory(torrents),
            torrentHandler.delete(sid, hash, false)
        ]);

        logger.info("Command completed successfully");
    } catch (error) {
        logger.error(error.stack);
    }
}

main();
