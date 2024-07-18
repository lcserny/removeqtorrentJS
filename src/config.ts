import yaml from "yaml";
import {readFile} from "node:fs/promises";
import {merge} from "lodash";
import path from "node:path";
import {LogConfig} from "./logging";
import {MongoDBConfig} from "./mongo";
import {TorrentsConfig} from "./qbittorrent";

export interface VideoConfig {
    mimeTypes: string[];
}

export interface Config {
    log: LogConfig;
    video: VideoConfig;
    mongodb: MongoDBConfig;
    torrents: TorrentsConfig;
}

export async function generateConfig(configFile: string = ""): Promise<Config> {
    const defaults = await readFile(path.join(__dirname, "..", "cfg/defaults.yml"), "utf8");
    let config = yaml.parse(defaults);
    if (configFile) {
        const external = await readFile(configFile, "utf8");
        const externalConfig = yaml.parse(external);
        config = merge(config, externalConfig);
    }
    return config;
}
