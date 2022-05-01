import { match, pathToRegexp } from 'path-to-regexp';
import url from 'url';
import { CustomRequest, CustomResponse, HandlerCallback, Listener, RouterInterface } from './types';
import { NotFound } from './errors';

export class Router implements RouterInterface {
  private readonly _prefix: string;

  private _listeners: Listener[] = [];

  constructor(prefix = '') {
    this._prefix = prefix;
  }

  addListener<Body, Params, Search>(
    method: string,
    path: string,
    handler: HandlerCallback<Body, Params, Search>
  ) {
    const fullPath = `${this._prefix}${path}`;
    this._listeners.push({
      method,
      path: fullPath,
      handler,
      regexp: pathToRegexp(fullPath),
      match: match(fullPath, { encode: encodeURI, decode: decodeURIComponent }),
    });
  }

  get<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void {
    return this.addListener('get', path, handler);
  }

  post<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void {
    return this.addListener('post', path, handler);
  }

  put<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void {
    return this.addListener('put', path, handler);
  }

  delete<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void {
    return this.addListener('delete', path, handler);
  }

  async handle(req: CustomRequest<object, object, object>, res: CustomResponse, next?: () => void) {
    const queryObject = url.parse(req.url ?? '', true);

    if (!queryObject.pathname?.startsWith(this._prefix)) {
      return next?.();
    }

    const handler = this.getHandler(queryObject.pathname ?? '', req.method ?? 'GET');

    if (!handler) {
      throw new NotFound('handler not found');
    }

    const keys = handler.match(queryObject.pathname ?? '');

    const data = await new Promise<string>(resolve => {
      if (!req.readableLength) {
        resolve('');
      }

      const buffers: string[] = [];
      req.on('data', chunk => {
        buffers.push(chunk);
      });

      req.on('end', () => {
        resolve(buffers.join(''));
      });
    });

    if (data.length) {
      req.body = JSON.parse(data);
    }
    if (keys) {
      req.params = keys.params;
    }
    req.search = queryObject.query;

    return handler.handler(req as CustomRequest<object, object, object>, res as CustomResponse, next);
  }

  getHandler(pathUrl: string, method: string) {
    for (const h of this._listeners) {
      if (h.regexp.test(pathUrl) && method.toLowerCase() === h.method) {
        return h;
      }
    }

    return null;
  }
}
