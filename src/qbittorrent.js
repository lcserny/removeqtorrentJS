const {logger} = require("./logging");
const axios = require("axios");
const {AxiosHeaders} = require("axios");
const mime = require('mime-types');
const path = require("node:path");
const fs = require("node:fs");

axios.defaults.timeout = 5000;

class TorrentFile {
    name;
    size;
    isMedia;
}

class TorrentInfo {
    hash;
}


class QBitTorrentHandler {
    constructor(config) {
        this.videoMimeTypes = config.video.mimeTypes;
        this.webUi = config.torrents.webUi;
        this.loginUrl = `${this.webUi.baseUrl}/api/v2/auth/login`;
        this.torrentFilesUrl = `${this.webUi.baseUrl}/api/v2/torrents/files`;
        this.torrentDeleteUrl = `${this.webUi.baseUrl}/api/v2/torrents/delete`;
        this.torrentAddUrl = `${this.webUi.baseUrl}/api/v2/torrents/add`;
        this.torrentInfoUrl = `${this.webUi.baseUrl}/api/v2/torrents/info`;
    }

    async generateSid() {
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

    async listTorrents(sid, hash) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        const response = await axios.postForm(this.torrentFilesUrl,
            {hash: hash},
            {headers: headers}
        );

        const torrents = response.data
            .map((data) => {
                const torrent = new TorrentFile();
                torrent.name = data.name;
                torrent.size = data.size;

                const filePath = path.join(this.webUi.downloadRootPath, torrent.name);
                torrent.isMedia = isVideo(filePath, this.videoMimeTypes);

                return torrent;
            });

        logger.info(`Torrent files retrieved: ${JSON.stringify(torrents)}`);
        return torrents;
    }

    async delete(sid, hash, removeFiles) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        await axios.postForm(this.torrentDeleteUrl,
            {hashes: hash, deleteFiles: removeFiles.toString()},
            {headers: headers}
        );

        logger.info(`Deleted torrent with hash: '${hash}'`);
    }

    async addTorrent(sid, torrentFile) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);
        headers.setContentType("multipart/form-data");

        await axios.postForm(this.torrentAddUrl,
            { torrents: fs.createReadStream(torrentFile) },
            { headers: headers }
        );
    }

    async getInfo(sid) {
        const headers = new AxiosHeaders();
        headers.set("cookie", `SID=${sid}`);

        const response = await axios.postForm(this.torrentInfoUrl, null,{ headers: headers } );

        const torrents = response.data
            .map((data) => {
                const torrent = new TorrentInfo();
                torrent.hash = data.hash;
                return torrent;
            });

        logger.info(`Torrent info retrieved: ${JSON.stringify(torrents)}`);
        return torrents;
    }
}

function isVideo(filePath, videoMimeTypes) {
    const fileMime = mime.lookup(filePath);
    for (let allowedMime of videoMimeTypes) {
        if (allowedMime === fileMime) {
            return true;
        }
    }
    return fileMime.startsWith("video/");
}

module.exports = QBitTorrentHandler;