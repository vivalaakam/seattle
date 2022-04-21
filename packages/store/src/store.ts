import * as url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { match, pathToRegexp } from 'path-to-regexp';
import { createHash } from 'crypto';
import { Db, Filter } from 'mongodb';
import { LogEvent, LogType } from 'vivalaakam_seattle_client';

import { makeId } from './make-id';
import { BatchRequest, Listener, Params, StoreObject } from './types';
import { NotFound } from './errors';

export class Store {
  private db: Db;
  private prefix: string;
  private readonly listeners: Listener<unknown>[];

  private readonly onLogEvent?: (event: LogEvent) => void;

  constructor(db: Db, prefix = '', onLogEvent?: (event: LogEvent) => void) {
    this.db = db;
    this.prefix = prefix;
    this.onLogEvent = onLogEvent;

    // @ts-ignore
    this.listeners = [
      { method: 'get', path: `${prefix}/class/:collection`, handler: this.list },
      { method: 'get', path: `${prefix}/class/:collection/:id`, handler: this.get },
      { method: 'post', path: `${prefix}/class/:collection`, handler: this.create },
      { method: 'put', path: `${prefix}/class/:collection/:id`, handler: this.update },
      { method: 'delete', path: `${prefix}/class/:collection/:id`, handler: this.delete },
      { method: 'post', path: `${prefix}/batch`, handler: this.batch },
    ].map(l => ({
      ...l,
      regexp: pathToRegexp(l.path),
      match: match(l.path, { encode: encodeURI, decode: decodeURIComponent }),
    }));

    for (const listener of this.listeners) {
      console.log('registered handler', `${listener.method} ${listener.path}`);
    }
  }

  async list(
    keys: Params,
    body: unknown,
    filter: Filter<StoreObject<object>> = {}
  ): Promise<Array<StoreObject<object>>> {
    return this.db.collection<StoreObject<object>>(keys.collection).find(filter).toArray();
  }

  async get(keys: Params): Promise<StoreObject<object>> {
    const data = await this.db.collection<StoreObject<object>>(keys.collection).findOne({ _id: keys.id });

    if (!data) {
      throw new NotFound('not found');
    }

    return data;
  }

  async create(keys: Params, body: object = {}): Promise<StoreObject<object>> {
    const resp = await this.db.collection<StoreObject<object>>(keys.collection).insertOne({
      _id: createHash('md5').update(makeId(10)).digest('hex'),
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.get({ collection: keys.collection, id: resp.insertedId });
  }

  async update(keys: Params, body: object = {}): Promise<StoreObject<object>> {
    await this.db.collection<StoreObject<object>>(keys.collection).updateOne(
      { _id: keys.id },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      }
    );

    return this.get({ collection: keys.collection, id: keys.id });
  }

  async delete(keys: Params): Promise<{}> {
    await this.db?.collection(keys.collection).deleteOne({ _id: keys.id });
    return {};
  }

  async batch(keys: Params, body: { requests: BatchRequest[] }) {
    const responses = [];
    for (const request of body.requests) {
      const handler = this.getListener(request.path, request.method);

      if (!handler) {
        responses.push({
          error: 'handler not found',
        });
        continue;
      }

      const keys = handler.match(request.path);

      if (!keys) {
        responses.push({
          error: 'not found',
        });
        continue;
      }

      const response = await handler.handler.call(this, keys.params, request.body);
      responses.push(response);
    }

    return responses;
  }

  async listener(req: IncomingMessage, res: ServerResponse, next?: () => void) {
    const queryObject = url.parse(req.url ?? '', true);

    if (!queryObject.pathname?.startsWith(this.prefix)) {
      return next?.();
    }

    const handler = this.getListener(queryObject.pathname ?? '', req.method ?? 'GET');

    if (!handler) {
      this.onLogEvent?.({
        event: 'error:404',
        requestId: `${req.method}:${req.url}`,
        date: new Date(),
        message: 'handler not found',
        data: {
          method: req.method,
          url: req.url,
        },
        type: LogType.error,
      });

      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      });
      res.end('');
      return;
    }

    try {
      const keys = handler.match(queryObject.pathname ?? '');
      if (keys) {
        const buffers = [];

        for await (const chunk of req) {
          buffers.push(chunk);
        }

        const body = buffers.length ? JSON.parse(Buffer.concat(buffers).toString()) : {};
        const filters = new URLSearchParams(queryObject.search ?? '');

        const response = await handler.handler.call(
          this,
          keys.params,
          body,
          JSON.parse(filters.get('filter') ?? '{}') as Filter<Partial<StoreObject<object>>>
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
    } catch (e) {
      if (e instanceof NotFound) {
        this.onLogEvent?.({
          event: 'error:404',
          requestId: `${req.method}:${req.url}`,
          date: new Date(),
          message: 'object not found',
          data: {
            method: req.method,
            url: req.url,
          },
          type: LogType.error,
        });

        res.writeHead(404, {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        });
        res.end('');
        return;
      }

      if (e instanceof Error) {
        this.onLogEvent?.({
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
      res.end('');
    }
  }

  getListener(url: string, method: string) {
    for (const h of this.listeners) {
      if (h.regexp.test(url) && method.toLowerCase() === h.method) {
        return h;
      }
    }

    return null;
  }
}
