import { DashboardMiddleware } from './types';
import { IncomingMessage, ServerResponse } from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';

export function middleware({ basePath = '', handlersHost = '/', storeHost = '/' }: DashboardMiddleware) {
  const template = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf-8');
  const compiledTemplate = template
    .replace('{{publicHost}}', basePath);

  return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    const queryObject = url.parse(req.url ?? '', true);

    if (!queryObject.pathname?.startsWith(basePath)) {
      return next?.();
    }

    if (queryObject.pathname === `${basePath}/config`) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ handlers: handlersHost, store: storeHost }));
      return;
    }

    const localPath = queryObject.pathname?.split('/');
    const fileName = localPath[localPath.length - 1];

    const file = path.join(__dirname, `public/${fileName}`);
    if (fs.existsSync(file)) {
      const stream = fs.createReadStream(file);
      stream.pipe(res);

      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(compiledTemplate);
  };
}
