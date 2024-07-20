import type {HistoryClient} from "./history";
import {MongoClient} from "mongodb";
import {logger} from "./logging";
import type {Config} from "./config";
import type {TorrentFile} from "./qbittorrent";

export interface MongoDBConfig {
    connectionUrl: string
    database: string;
    downloadCollection: string;
}

interface MongoVideo {
    file_name: string;
    file_size: number;
    date_downloaded: Date;
}

export class MongoWrapper implements HistoryClient{
    private mongoConfig: MongoDBConfig;
    private mongoClient: MongoClient;

    constructor(private config: Config) {
        this.mongoConfig = config.mongodb;
        this.mongoClient = new MongoClient(this.mongoConfig.connectionUrl);
    }

    async updateHistory(torrentFiles: TorrentFile[]) {
        await this.mongoClient.connect();

        const database = this.mongoClient.db(this.mongoConfig.database);
        const collection = database.collection(this.mongoConfig.downloadCollection);

        const videos: MongoVideo[] = torrentFiles
            .filter(torrent => torrent.isMedia)
            .map((torrent) => ({file_name: torrent.name, file_size: torrent.size, date_downloaded: new Date()}));

        if (videos == null || videos.length < 1) {
            logger.info("No media files found to insert in cache");
            return;
        }

        try {
            await collection.insertMany(videos);
            logger.info(`Cache updated for collection: '${this.mongoConfig.downloadCollection}'`);
        } finally {
            await this.mongoClient.close();
        }
    }
}
