import type { MongoClient } from "mongodb";
import type {Command} from "./commands";
import type {Config} from "../config";
import {QBitTorrentHandler} from "../qbittorrent";
import {HistoryUpdater} from "../history";

export class AddedCommand implements Command {
    
    async run(mongoClient: MongoClient, config: Config, hash: string): Promise<void> {
        const torrentHandler = new QBitTorrentHandler(config);
        const historyUpdater = new HistoryUpdater(mongoClient, config.mongodb);

        const sid = await torrentHandler.generateSid();
        const torrents = await torrentHandler.listTorrents(sid, hash);
        await historyUpdater.updateHistoryAdded(torrents);
    }
}