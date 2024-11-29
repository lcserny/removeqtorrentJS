import type {TorrentFile} from "./qbittorrent";
import type {AnyBulkWriteOperation, MongoClient} from "mongodb";
import {logger} from "./logging";
import type {MongoDBConfig} from "./config";

interface DownloadedMedia {
    file_name: string;
    file_size: number;
    date_downloaded: Date;
    download_complete: boolean;
}

export interface HistoryClient {
    // eslint-disable-next-line no-unused-vars
    updateHistoryDownloaded(torrents: TorrentFile[]): Promise<void>;

    // eslint-disable-next-line no-unused-vars
    updateHistoryAdded(torrents: TorrentFile[]): Promise<void>;
}

export class HistoryUpdater implements HistoryClient{
    
    private readonly client: MongoClient;
    private readonly config: MongoDBConfig;

    constructor(client: MongoClient, config: MongoDBConfig) {
        this.config = config;
        this.client = client;
    }

    async updateHistoryAdded(torrents: TorrentFile[]): Promise<void> {
        await this.updateInternal(torrents, false);
    }

    async updateHistoryDownloaded(torrents: TorrentFile[]): Promise<void> {
        await this.updateInternal(torrents, true);
    }

    private async updateInternal(torrents: TorrentFile[], downloaded: boolean): Promise<void> {
        const database = this.client.db(this.config.database);
        const collection = database.collection(this.config.downloadCollection);

        const operations: AnyBulkWriteOperation[] = torrents
            .filter(torrent => torrent.isMedia)
            .map(torrent => ({
                file_name: torrent.name,
                file_size: torrent.size,
                date_downloaded: new Date(),
                download_complete: downloaded,
            } as DownloadedMedia))
            .map(dm => ({
                updateOne: {
                    filter: {
                        file_name: dm.file_name,
                        file_size: dm.file_size,
                    },
                    update: {$set: dm},
                    upsert: true,
                }
            }));

        if (operations == null || operations.length < 1) {
            logger.info("No media files found to upsert in cache");
            return;
        }

        await collection.bulkWrite(operations);
        logger.info(`Cache updated for collection: '${this.config.downloadCollection}'`);
    }
}
