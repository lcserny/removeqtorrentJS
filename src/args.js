const { program } = require('commander');

function processArgs() {
    program
        .name("removeqtorrent")
        .description("CLI to remove QBitTorrent torrents")
        .requiredOption("-H, --hash <string>", "Torrent hash to work with")
        .option("-c, --config <string>", "Optional YAML config file path")

    program.parse();

    return program.opts();
}

module.exports = {
    processArgs
}