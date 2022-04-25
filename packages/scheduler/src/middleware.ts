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

    await Promise.allSettled(
      files.map(async file => {
        if (file !== '.' && file !== '..' && file.endsWith('.js')) {
          const filename = path.join(functions, file);
          const functionHandler = await import(filename);

          if (functionHandler.default instanceof WorkerHandler) {
            scheduler.createEvent(functionHandler.default.name, filename);

            functionHandler.default.cronJob.forEach((cronJob: string | number | Date) => {
              scheduler.createTimer(functionHandler.default.name, cronJob);
            });

            console.log('registered event', functionHandler.default.name);
          }
        }
      })
    );

    scheduler.startTimer();
  });

  return app;
}
