import type {OptionValues} from "commander";
import {program} from "commander";
import type {CommandName} from "./cmd/commands";

export function processArgs(): OptionValues {
    program
        .name("removeqtorrent")
        .description("CLI to remove QBitTorrent torrents")
        .requiredOption("-H, --hash <string>", "Torrent hash to work with")
        .option("-R, --run <string>", "Command to run: added | completed", "completed" as CommandName)
        .option("-c, --config <string>", "Optional YAML config file path")

    program.parse();

    return program.opts();
}
