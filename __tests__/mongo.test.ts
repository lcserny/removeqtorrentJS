import {initLogging} from "../src/logging";
import type { StartedTestContainer} from "testcontainers";
import {GenericContainer, Wait} from "testcontainers";
import type { Config} from "../src/config";
import {generateConfig} from "../src/config";
import {MongoWrapper} from "../src/mongo";
import {MongoClient} from "mongodb";

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
        const wrapper = new MongoWrapper(config);

        const name = "name1";
        const size = 2;
        const isMedia = true;

        await wrapper.updateHistory([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        expect(await collection.countDocuments()).toBe(1);

        const doc = await collection.findOne();
        expect(doc?.file_name).toBe(name);
        expect(doc?.file_size).toBe(size);
    });

    test("non-media is not updated in history", async () => {
        const wrapper = new MongoWrapper(config);

        const name = "nonMedia";
        const size = 2;
        const isMedia = false;

        await wrapper.updateHistory([{name, size, isMedia}]);

        const database = client.db(config.mongodb.database);
        const collection = database.collection(config.mongodb.downloadCollection);

        expect(await collection.countDocuments({
            file_name: name,
            file_size: size
        })).toBe(0);
    });
});