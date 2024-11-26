#!/usr/bin/env node

import {initLogging, logger} from "../logging";
import {processArgs} from "../args";
import {generateConfig} from "../config";
import {MongoClient} from "mongodb";
import {produceCommand} from "../cmd/commands";

async function main() {
    const args = processArgs();
    const config = await generateConfig(args.config);
    initLogging(config.log);

    let mongoClient: MongoClient | null = null;

    try {
        logger.info("Executing command");

        const hash = args.hash;
        logger.info(`Hash received: '${hash}'`);
        
        const cmdName = args.run;
        logger.info(`Command to run: '${cmdName}'`);

        mongoClient = new MongoClient(config.mongodb.connectionUrl);
        await mongoClient.connect();

        const command = produceCommand(cmdName);
        await command.run(mongoClient, config, hash);

        logger.info("Command completed successfully");
    } catch (e: unknown) {
        const error = e as Error;
        logger.error(error.stack);
    } finally {
        if (mongoClient) {
            await mongoClient.close();
        }
    }
}

main();
