#!/usr/bin/env node

import {initLogging, logger} from "../logging";
import {processArgs} from "../args";
import {generateConfig} from "../config";
import {HistoryUpdater} from "../history";
import {QBitTorrentHandler} from "../qbittorrent";
import {MongoClient} from "mongodb";
import {MagnetUpdater} from "../magnet";

async function main() {
    const args = processArgs();
    const config = await generateConfig(args.config);
    initLogging(config.log);

    let mongoClient: MongoClient | null = null;

    try {
        logger.info("Executing command");

        const hash = args.hash;
        logger.info(`Hash received: '${hash}'`);

        mongoClient = new MongoClient(config.mongodb.connectionUrl);
        await mongoClient.connect();

        const torrentHandler = new QBitTorrentHandler(config);
        const historyUpdater = new HistoryUpdater(mongoClient, config.mongodb);
        const magnetUpdater = new MagnetUpdater(mongoClient, config.mongodb);

        const sid = await torrentHandler.generateSid();
        const torrents = await torrentHandler.listTorrents(sid, hash);
        await Promise.all([
            historyUpdater.updateHistory(torrents),
            magnetUpdater.updateMagnet(hash),
            torrentHandler.delete(sid, hash, false)
        ]);

        logger.info("Command completed successfully");
    } catch (e: unknown) {
        const error = e as Error;
        logger.error(error.stack);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
}

main();
