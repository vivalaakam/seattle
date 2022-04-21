import express, { NextFunction, Response } from 'express';
import { json } from 'body-parser';
import path from 'path';
import { readdirSync } from 'fs';

import { CustomRequest, MiddlewareProps } from './types';
import { router } from './router';
import { WorkerHandler } from './worker_handler';
import { Scheduler } from './scheduler';

export function middleware({ onLogEvent, basePath = '/', functions = './functions' }: MiddlewareProps) {
  const app = express();
  const scheduler = new Scheduler();

  if (onLogEvent) {
    scheduler.on('log', onLogEvent);
  }

  app.use(json());

  app.use((req: CustomRequest, res: Response, next: NextFunction) => {
    req.scheduler = scheduler;
    next();
  });

  app.use(basePath, router);

  app.on('mount', async () => {
    const files = readdirSync(functions);

    for (const file of files) {
      if (file !== '.' && file !== '..' && (file.endsWith('.js') || file.endsWith('.ts'))) {
        const filename = path.join(functions, file);
        const function_handler = await import(filename);

        if (function_handler.default instanceof WorkerHandler) {
          scheduler.createEvent(function_handler.default.name, filename);

          for (const cronJob of function_handler.default.cronJob) {
            scheduler.createTimer(function_handler.default.name, cronJob);
          }

          console.log('registered event', function_handler.default.name);
        }
      }
    }

    scheduler.startTimer();
  });

  return app;
}
