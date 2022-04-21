import { MiddlewareProps } from './types';
import { Store } from './store';
import { MongoClient } from 'mongodb';
import { IncomingMessage, ServerResponse } from 'http';

export function middleware({ dbConnection, dbName, basePath = '/' }: MiddlewareProps) {
  const client = new MongoClient(dbConnection);
  let _connected = false;

  const store = new Store(client.db(dbName), basePath);

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (!_connected) {
      await client.connect();
      _connected = true;
    }

    return store.listener(req, res);
  };
}
