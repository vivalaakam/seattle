import { IncomingMessage, ServerResponse } from 'http';

import { MiddlewareProps } from './types';
import { Core } from './core';

export function middleware({ onLogEvent, basePath = '/' }: MiddlewareProps) {
  const core = new Core(basePath);

  if (onLogEvent) {
    core.on('log', onLogEvent);
  }

  return async (req: IncomingMessage, res: ServerResponse, next?: () => void) =>
    core.router.handle(req, res, next);
}
