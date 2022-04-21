import { IncomingMessage, ServerResponse } from 'http';
import { MongoClient } from 'mongodb';
import { LogType } from 'vivalaakam_seattle_client';
import { MiddlewareProps } from './types';
import { Store } from './store';
import { Timeout } from './errors';

export function middleware({ dbConnection, dbName, basePath = '', onLogEvent }: MiddlewareProps) {
  const client = new MongoClient(dbConnection);
  let _connected = false;

  const store = new Store(client.db(dbName), basePath, onLogEvent);

  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    try {
      if (!_connected) {
        await Promise.race([
          client.connect(),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Timeout('timeout'));
            }, 5000);
          }),
        ]);
        _connected = true;
        console.log('db connected');
      }

      return store.listener(req, res, next);
    } catch (e) {
      if (e instanceof Timeout) {
        onLogEvent?.({
          event: 'error:500',
          requestId: `${req.method}:${req.url}`,
          date: new Date(),
          message: e.message,
          data: {
            method: req.method,
            url: req.url,
          },
          type: LogType.error,
        });
      }

      res.writeHead(500, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      });
      res.end(JSON.stringify({ message: 'timeout' }));
    }
  };
}
