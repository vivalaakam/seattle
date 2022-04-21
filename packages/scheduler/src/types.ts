import { CronExpression } from 'cron-parser';
import { Request } from 'express';
import { LogEvent, LogType } from 'vivalaakam_seattle_client';
import { Scheduler } from './scheduler';

export type WorkerOptions = {
  cronJob?: string[];
};

export type WorkerCallback<T> = (params: T) => void;

export type QueueEvent = {
  name: string;
  data?: object;
};

export type WorkerResultEvent = {
  event: 'result';
  result: unknown;
};

export type WorkerLogEvent = {
  event: 'log';
  message: string;
  data?: object;
  type?: LogType;
};

export type WorkerEventEvent = QueueEvent & {
  event: 'event';
};

export type WorkerEvent = WorkerResultEvent | WorkerEventEvent | WorkerLogEvent;

export type MiddlewareProps = {
  functions: string;
  basePath?: string;
  onLogEvent?: (event: LogEvent) => void;
};

export interface CustomRequest extends Request {
  scheduler?: Scheduler;
}

export type CronSubscription = {
  interval: CronExpression | null;
  event: string;
  ts: Date;
};
