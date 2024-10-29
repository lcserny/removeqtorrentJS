import type {TorrentFile} from "./qbittorrent";
import type {MongoClient} from "mongodb";
import {logger} from "./logging";
import type {MongoDBConfig} from "./config";

interface DownloadedVideo {
    file_name: string;
    file_size: number;
    date_downloaded: Date;
}

export interface HistoryClient {
    // eslint-disable-next-line no-unused-vars
    updateHistory(torrents: TorrentFile[]): Promise<void>;
}

export class HistoryUpdater implements HistoryClient{
    
    private readonly client: MongoClient;
    private readonly config: MongoDBConfig;

    constructor(client: MongoClient, config: MongoDBConfig) {
        this.config = config;
        this.client = client;
    }

    async updateHistory(torrents: TorrentFile[]) {
        const database = this.client.db(this.config.database);
        const collection = database.collection(this.config.downloadCollection);

        const videos: DownloadedVideo[] = torrents
            .filter(torrent => torrent.isMedia)
            .map((torrent) => ({
                file_name: torrent.name,
                file_size: torrent.size,
                date_downloaded: new Date()
            }));

        if (videos == null || videos.length < 1) {
            logger.info("No media files found to insert in cache");
            return;
        }

        await collection.insertMany(videos);
        logger.info(`Cache updated for collection: '${this.config.downloadCollection}'`);
    }
}
