import {initLogging} from "../src/logging";
import type { StartedTestContainer} from "testcontainers";
import {GenericContainer, Wait} from "testcontainers";
import type { Config} from "../src/config";
import {generateConfig} from "../src/config";
import type {Document} from "mongodb";
import { MongoClient} from "mongodb";
import {HistoryUpdater} from "../src/history";

const MAPPED_PORT = 27017;
const USER = "root";
const PASS = "rootpass";

describe("mongoDB container IT", () => {
    let container: StartedTestContainer;
    let config: Config;
    let client: MongoClient;

    beforeAll(async () => {
        initLogging({level: "none"});

        container = await new GenericContainer("mongo:7.0")
            .withExposedPorts(MAPPED_PORT)
            .withEnvironment({
                "MONGO_INITDB_ROOT_USERNAME": USER,
                "MONGO_INITDB_ROOT_PASSWORD": PASS,
            })
            .withStartupTimeout(10000)
            .withWaitStrategy(Wait.forLogMessage("Waiting for connections"))
            .start();

        config = await generateConfig();
        config.mongodb.connectionUrl = `mongodb://${USER}:${PASS}@${container.getHost()}:${container.getMappedPort(MAPPED_PORT)}/?retryWrites=true&w=majority`;

        client = new MongoClient(config.mongodb.connectionUrl);
    });

    afterAll(async () => {
        await container.stop();
    });

    beforeEach(async () => {
        await client.connect();
    });

    afterEach(async () => {
        await client.close();
    });

    test("can update history", async () => {
        const updater = new HistoryUpdater(client, config.mongodb);

        const name = "name1";
        const size = 2;
        const isMedia = true;

        await updater.updateHistoryDownloaded([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        expect(await collection.countDocuments({ file_name: name })).toBe(1);

        const docs: Document[] = await collection.find({ file_name: name }).toArray();
        expect(docs[0].file_name).toBe(name);
        expect(docs[0].file_size).toBe(size);
        expect(docs[0].download_complete).toBeTruthy();
    });

    test("non-media is not updated in history", async () => {
        const updater = new HistoryUpdater(client, config.mongodb);

        const name = "nonMedia";
        const size = 2;
        const isMedia = false;

        await updater.updateHistoryDownloaded([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        expect(await collection.countDocuments({
            file_name: name,
            file_size: size
        })).toBe(0);
    });

    test("can update history only for added", async () => {
        const updater = new HistoryUpdater(client, config.mongodb);

        const name = "name4";
        const size = 2;
        const isMedia = true;

        await updater.updateHistoryAdded([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        expect(await collection.countDocuments({ file_name: name })).toBe(1);

        const docs: Document[] = await collection.find({ file_name: name }).toArray();
        expect(docs[0].file_name).toBe(name);
        expect(docs[0].file_size).toBe(size);
        expect(docs[0].download_complete).toBeFalsy();
    });

    test("update history for added then completed", async () => {
        const updater = new HistoryUpdater(client, config.mongodb);

        const name = "name for update and complete";
        const size = 3;
        const isMedia = true;

        await updater.updateHistoryAdded([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        const docs: Document[] = await collection.find({ file_name: name }).toArray();
        expect(docs.length).toBe(1);
        expect(docs[0].file_name).toBe(name);
        expect(docs[0].file_size).toBe(size);
        expect(docs[0].download_complete).toBeFalsy();

        await updater.updateHistoryDownloaded([{name, size, isMedia}]);

        const docsAfter: Document[] = await collection.find({ file_name: name }).toArray();
        expect(docsAfter.length).toBe(1);
        expect(docsAfter[0].file_name).toBe(name);
        expect(docsAfter[0].file_size).toBe(size);
        expect(docsAfter[0].download_complete).toBeTruthy();
    });
});