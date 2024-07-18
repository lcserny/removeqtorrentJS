import {logger} from "./logging";
import axios, {AxiosHeaders} from "axios";
import mime from "mime-types";
import path from "node:path";
import fs from "node:fs";
import {Config} from "./config";

axios.defaults.timeout = 5000;

export interface WebUIConfig {
    baseUrl: string;
    username: string;
    password: string;
    downloadRootPath: string;
}

export interface TorrentsConfig {
    webUi: WebUIConfig;
}

export interface TorrentFile {
    name: string;
    size: number;
    isMedia?: boolean;
}

export interface TorrentInfo {
    hash: string;
}

export class QBitTorrentHandler {
    private readonly videoMimeTypes: string[];
    private webUi: WebUIConfig;
    private readonly loginUrl: string;
    private readonly torrentFilesUrl: string;
    private readonly torrentDeleteUrl: string;
    private readonly torrentAddUrl: string;
    private readonly torrentInfoUrl: string;

    constructor(config: Config) {
        this.videoMimeTypes = config.video.mimeTypes;
        this.webUi = config.torrents.webUi;
        this.loginUrl = `${this.webUi.baseUrl}/api/v2/auth/login`;
        this.torrentFilesUrl = `${this.webUi.baseUrl}/api/v2/torrents/files`;
        this.torrentDeleteUrl = `${this.webUi.baseUrl}/api/v2/torrents/delete`;
        this.torrentAddUrl = `${this.webUi.baseUrl}/api/v2/torrents/add`;
        this.torrentInfoUrl = `${this.webUi.baseUrl}/api/v2/torrents/info`;
    }

    async generateSid(): Promise<string> {
        const response = await axios.postForm(this.loginUrl, {
            username: this.webUi.username,
            password: this.webUi.password,
        });

        const cookies = response.headers["set-cookie"];
        if (!cookies || !cookies[0].includes("SID")) {
            throw new Error(`Error occurred sending request to generate SID, no SID cookie returned`);
        }

        const sid = cookies[0].substring(4, cookies[0].indexOf(";"));
        logger.info("SID generated: " + sid);

        return sid;
    }

    async listTorrents(sid: string, hash: string): Promise<TorrentFile[]> {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        const response = await axios.postForm<TorrentFile[]>(this.torrentFilesUrl,
            {hash: hash},
            {headers: headers}
        );

        const torrents = response.data
            .map((torrent: TorrentFile) => {
                const filePath = path.join(this.webUi.downloadRootPath, torrent.name);
                torrent.isMedia = isVideo(filePath, this.videoMimeTypes);
                return torrent;
            });

        logger.info(`Torrent files retrieved: ${JSON.stringify(torrents)}`);
        return torrents;
    }

    async delete(sid: string, hash: string, removeFiles: boolean) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        await axios.postForm(this.torrentDeleteUrl,
            {hashes: hash, deleteFiles: removeFiles.toString()},
            {headers: headers}
        );

        logger.info(`Deleted torrent with hash: '${hash}'`);
    }

    async addTorrent(sid: string, torrentFile: string) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);
        headers.setContentType("multipart/form-data");

        await axios.postForm(this.torrentAddUrl,
            { torrents: fs.createReadStream(torrentFile) },
            { headers: headers }
        );
    }

    async getInfo(sid: string): Promise<TorrentInfo[]> {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        const response = await axios.postForm<TorrentInfo[]>(this.torrentInfoUrl, null,{ headers: headers } );
        const torrents = response.data;

        logger.info(`Torrent info retrieved: ${JSON.stringify(torrents)}`);
        return torrents;
    }
}

function isVideo(filePath: string, videoMimeTypes: string[]) : boolean {
    const fileMime = mime.lookup(filePath);
    if (fileMime) {
        for (const allowedMime of videoMimeTypes) {
            if (allowedMime === fileMime) {
                return true;
            }
        }
        return fileMime.startsWith("video/");
    }
    return false;
}
