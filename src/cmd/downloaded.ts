import type {Command} from "./commands";
import type {MongoClient} from "mongodb";
import {QBitTorrentHandler} from "../qbittorrent";
import {HistoryUpdater} from "../history";
import {MagnetUpdater} from "../magnet";
import type {Config} from "../config";

export class CompletedCommand implements Command {

    async run(mongoClient: MongoClient, config: Config, hash: string): Promise<void> {
        const torrentHandler = new QBitTorrentHandler(config);
        const historyUpdater = new HistoryUpdater(mongoClient, config.mongodb);
        const magnetUpdater = new MagnetUpdater(mongoClient, config.mongodb);

        const sid = await torrentHandler.generateSid();
        const torrents = await torrentHandler.listTorrents(sid, hash);
        await Promise.all([
            historyUpdater.updateHistoryDownloaded(torrents),
            magnetUpdater.updateMagnet(hash),
            torrentHandler.delete(sid, hash, false)
        ]);
    }
}