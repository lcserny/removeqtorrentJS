#!/usr/bin/env node

import {initLogging, logger} from "../logging";
import {processArgs} from "../args";
import {generateConfig} from "../config";
import {HistoryClient, HistoryUpdater} from "../history";
import {MongoWrapper} from "../mongo";
import {QBitTorrentHandler} from "../qbittorrent";

async function main() {
    const args = processArgs();
    const config = await generateConfig(args.config);
    initLogging(config.log);

    try {
        logger.info("Executing command");

        const hash = args.hash;
        logger.info(`Hash received: '${hash}'`);

        const torrentHandler = new QBitTorrentHandler(config);
        const mongoWrapper: HistoryClient = new MongoWrapper(config);
        const historyUpdater = new HistoryUpdater(mongoWrapper);

        const sid = await torrentHandler.generateSid();
        const torrents = await torrentHandler.listTorrents(sid, hash);
        await Promise.all([
            historyUpdater.updateHistory(torrents),
            torrentHandler.delete(sid, hash, false)
        ]);

        logger.info("Command completed successfully");
    } catch (e: unknown) {
        const error = e as Error;
        logger.error(error.stack);
    }
}

main();
