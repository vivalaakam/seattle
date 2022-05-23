import { CronExpression } from 'cron-parser';
import { LogEvent } from 'vivalaakam_seattle_client';

export type WorkerCallback<T> = (params: T) => void;

export type MiddlewareProps = {
  basePath?: string;
  onLogEvent?: (event: LogEvent) => void;
};

export type CronSubscription = {
  event: string;
  interval: string;
};

export type EventSubscription = {
  event: string;
  path: string;
};

export type CronSubscriptions = {
  regexp: CronExpression;
  events: string[];
};

export type RegisterRequest = {
  events: Array<EventSubscription>;
  timers: Array<CronSubscription>;
  remoteHost: string;
};
