const yaml = require("yaml");
const {readFile} = require("node:fs/promises");
const {merge} = require("lodash");
const path = require("node:path");

async function generateConfig(configFile) {
    const defaults = await readFile(path.join(__dirname, "..", "cfg/defaults.yml"), "utf8");
    let config = yaml.parse(defaults);
    if (configFile) {
        const external = await readFile(configFile, "utf8");
        let externalConfig = yaml.parse(external);
        config = merge(config, externalConfig);
    }
    return config;
}

module.exports = {
    generateConfig
}