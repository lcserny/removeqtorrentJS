import type { StartedTestContainer} from "testcontainers";
import {GenericContainer, Wait} from "testcontainers";
import * as path from "node:path";
import type { Config} from "../src/config";
import {generateConfig} from "../src/config";
import {QBitTorrentHandler} from "../src/qbittorrent";
import {initLogging} from "../src/logging";

const MAPPED_PORT = 8080;

describe("qbittorrent container IT", () => {
    let container: StartedTestContainer;
    let config: Config;

    beforeAll(async () => {
        initLogging({level: "none"});

        container = await new GenericContainer("linuxserver/qbittorrent:4.5.2")
            .withExposedPorts(MAPPED_PORT)
            .withBindMounts([{
                source: path.join(__dirname, "resources", "qBittorrent.conf"),
                target: "/config/qBittorrent/qBittorrent.conf"
            }])
            .withStartupTimeout(10000)
            .withWaitStrategy(Wait.forLogMessage("[ls.io-init] done."))
            .start();

        config = await generateConfig();
        config.torrents.webUi.baseUrl = `http://${container.getHost()}:${container.getMappedPort(MAPPED_PORT)}`;
    });

    afterAll(async () => {
        await container.stop();
    });

    test("TorrentHandler can generate SID", async () => {
        const handler = new QBitTorrentHandler(config);
        const sid = await handler.generateSid();
        expect(sid).not.toBeNull();
        expect(sid.length > 0).toBeTruthy();
    });

    test("TorrentHandler can delete torrent by hash", async () => {
        const handler = new QBitTorrentHandler(config);
        const sid = await handler.generateSid();

        await handler.addTorrent(sid, path.join(__dirname, "resources", "ubuntu-server.iso.torrent"));

        await new Promise((r) => setTimeout(r, 100));

        let torrents = await handler.getInfo(sid);
        expect(torrents.length > 0).toBeTruthy();
        expect(torrents[0].hash).not.toBeNull();
        expect(torrents[0].hash.length).toBeTruthy();

        await handler.delete(sid, torrents[0].hash, true);

        torrents = await handler.getInfo(sid);
        expect(torrents.length === 0).toBeTruthy();
    });
});
