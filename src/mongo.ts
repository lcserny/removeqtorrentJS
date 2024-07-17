import {HistoryClient} from "./history";
import {MongoClient} from "mongodb";
import {logger} from "./logging";
import {Config} from "./config";
import {TorrentFile} from "./qbittorrent";

export class MongoDBConfig {
    constructor(public connectionUrl: string, public database: string, public downloadCollection: string) {
    }
}

class MongoVideo {
    constructor(public file_name: string,
                public file_size: number,
                public date_downloaded: Date) {
    }
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

        const videos = torrentFiles
            .filter(torrent => torrent.isMedia)
            .map((torrent) => new MongoVideo(torrent.name, torrent.size, new Date()));

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
