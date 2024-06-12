class HistoryUpdater {
    constructor(client) {
        this.client = client;
    }

    async updateHistory(torrents) {
        await this.client.updateHistory(torrents);
    }
}

module.exports = HistoryUpdater;