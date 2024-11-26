import type {MongoClient} from "mongodb";
import {AddedCommand} from "./added";
import {CompletedCommand} from "./downloaded";
import type {Config} from "../config";

export type CommandName = "added" | "completed";

export interface Command {
    // eslint-disable-next-line no-unused-vars
    run(mongoClient: MongoClient, config: Config, hash: string): Promise<void>;
}

export function produceCommand(name: CommandName): Command {
    switch (name) {
        case "added":
            return new AddedCommand();
        case "completed":
        default:
            return new CompletedCommand();
    }
}