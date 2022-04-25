import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let connection: MongoClient;
let mongoServer: MongoMemoryServer;
const dbName = 'testDb';

export const connect = async () => {
  if (!connection) {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName,
      },
    });
    connection = await MongoClient.connect(mongoServer.getUri(), {});
  }
};

export const params = () => ({
  dbConnection: mongoServer.getUri(),
  dbName,
});

export const close = async () => {
  if (connection) {
    await connection.db(dbName).dropDatabase();
    await connection.close();
    await mongoServer.stop();
  }
};

export const clear = async () => {
  if (connection) {
    const collections = await connection.db(dbName).collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};
