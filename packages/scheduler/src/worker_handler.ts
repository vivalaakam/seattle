import { LogFunction, PublishEventFunction, WorkerCallback, WorkerOptions } from './types';

export class WorkerHandler<T> {
  name: string;
  callback: WorkerCallback<T>;
  cronJob: string[];

  constructor(name: string, callback: WorkerCallback<T>, params: WorkerOptions = {}) {
    this.name = name;
    this.callback = callback;
    this.cronJob = params.cronJob ?? [];
  }

  call(params: T, log: LogFunction, publishEvent: PublishEventFunction) {
    return this.callback(params, { log, publishEvent });
  }
}
