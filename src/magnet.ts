import type {MongoClient} from "mongodb";
import type {MongoDBConfig} from "./config";
import {logger} from "./logging";

export interface MagnetClient {
    // eslint-disable-next-line no-unused-vars
    updateMagnet(hash: string): Promise<void>;
}

export class MagnetUpdater implements MagnetClient {
    
    private readonly client: MongoClient;
    private readonly config: MongoDBConfig;
    
    constructor(client: MongoClient, config: MongoDBConfig) {
        this.client = client;
        this.config = config;
    }
    
    async updateMagnet(hash: string) {
        const database = this.client.db(this.config.database);
        const collection = database.collection(this.config.magnetCollection);

        await collection.findOneAndUpdate(
            { hash: hash },
            { $set: { downloaded: true, dateDownloaded: new Date() } }
        );

        logger.info(`Magnet with hash '${hash}' updated for collection: '${this.config.magnetCollection}'`);
    }
}
