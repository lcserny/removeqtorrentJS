import type {OptionValues} from "commander";
import {program} from "commander";

export function processArgs(): OptionValues {
    program
        .name("removeqtorrent")
        .description("CLI to remove QBitTorrent torrents")
        .requiredOption("-H, --hash <string>", "Torrent hash to work with")
        .option("-c, --config <string>", "Optional YAML config file path")

    program.parse();

    return program.opts();
}
