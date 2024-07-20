import type {TorrentFile} from "./qbittorrent";

export interface HistoryClient {
    updateHistory(torrents: TorrentFile[]): Promise<void>;
}

export class HistoryUpdater {
    constructor(private client: HistoryClient) {
    }

    async updateHistory(torrents: TorrentFile[]) {
        await this.client.updateHistory(torrents);
    }
}
