import { CronExpression } from 'cron-parser';
import { Request } from 'express';
import { Scheduler } from './scheduler';

export enum LogType {
  error = 'error',
  info = 'info',
  debug = 'debug',
}

export type LogFunction = (message: string, data?: object, type?: LogType) => void;

export type PublishEventFunction = (event: string, data?: object) => void;

export type CallbackContext = {
  log: LogFunction;
  publishEvent: PublishEventFunction;
};

export type WorkerOptions = {
  cronJob?: string[];
};

export type WorkerCallback<T> = (params: T, context: CallbackContext) => void;

export type LogEvent = {
  event: string;
  requestId: string;
  date: Date;
  message: string;
  data: object;
  type: LogType;
};

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
