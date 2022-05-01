import { WorkerCallback, WorkerOptions } from './types';

export class WorkerHandler<T> {
  name: string;

  callback: WorkerCallback<T>;

  cronJob: string[];

  constructor(name: string, callback: WorkerCallback<T>, params: WorkerOptions = {}) {
    this.name = name;
    this.callback = callback;
    this.cronJob = params.cronJob ?? [];
  }

  call(params: T) {
    return this.callback(params);
  }
}
