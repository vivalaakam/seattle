import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { readdir } from 'fs/promises';

import { MiddlewareProps } from './types';
import { WorkerHandler } from './worker_handler';
import { Handler } from './handler';

export function middleware({ onLogEvent, basePath = '/', functions = './functions' }: MiddlewareProps) {
  const handler = new Handler(basePath);

  if (onLogEvent) {
    handler.on('log', onLogEvent);
  }

  let init: Promise<void> | null = null;

  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
    if (handler.initialized) {
      if (!init) {
        init = readdir(functions)
          .then(files =>
            Promise.allSettled(
              files.map(file => {
                if (file !== '.' && file !== '..' && file.endsWith('.js')) {
                  const filename = path.join(functions, file);
                  return import(filename).then(functionHandler => {
                    if (functionHandler.default instanceof WorkerHandler) {
                      handler.createEvent(functionHandler.default.name, filename);

                      functionHandler.default.cronJob.forEach((cronJob: string) => {
                        handler.createTimer(functionHandler.default.name, cronJob);
                      });

                      console.log('registered event', functionHandler.default.name);
                    }
                  });
                }

                return Promise.resolve();
              })
            )
          )
          .then(() => {
            handler.initialized = true;
          });
      }
      await init;
    }

    return handler.router.handle(req, res, next);
  };
}
