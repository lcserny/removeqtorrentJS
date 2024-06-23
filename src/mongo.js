const {MongoClient} = require("mongodb");
const {logger} = require("./logging");

class MongoVideo {
    file_name;
    file_size;
    date_downloaded;
}

class MongoWrapper {
    constructor(config) {
        this.mongoConfig = config.mongodb;
        this.mongoClient = new MongoClient(this.mongoConfig.connectionUrl);
    }

    async updateHistory(torrentFiles) {
        await this.mongoClient.connect();

        const database = this.mongoClient.db(this.mongoConfig.database);
        const collection = database.collection(this.mongoConfig.downloadCollection);

        const videos = torrentFiles
            .filter(torrent => torrent.isMedia)
            .map((torrent) => {
                const video = new MongoVideo();
                video.file_name = torrent.name;
                video.file_size = torrent.size;
                video.date_downloaded = new Date();
                return video;
            });

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

module.exports = MongoWrapper;