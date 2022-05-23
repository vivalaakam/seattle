import { Worker } from 'worker_threads';
import EventEmitter from 'events';
import path from 'path';
import { EventEvent, LogEvent, LogType } from 'vivalaakam_seattle_client';
import { makeId } from 'vivalaakam_seattle_utils';
import { CustomRequest, CustomResponse, Router } from 'vivalaakam_seattle_router';

import { CronSubscription, WorkerEvent } from './types';

export class Handler extends EventEmitter {
  private _subscriptions = new Map<string, string>();

  private _timers: Array<CronSubscription> = [];

  private _initialized = false;

  readonly router: Router;

  readonly parentHost;

  constructor(prefix = '', parentHost = '') {
    super();
    this.parentHost = parentHost;
    this.router = new Router(prefix);
    this.router.post('/event/:eventName', this.handleEventRequest);
    this.router.get('/events', this.handleRegisteredEventRequest);
    this.router.get('/timers', this.handleRegisteredTimersRequest);
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value) {
    this._initialized = value;
  }

  async notifyParent() {
    if (!this.parentHost) {
      return Promise.resolve();
    }

    return fetch(`${this.parentHost}/register`, {
      method: 'POST',
      body: JSON.stringify({
        events: this.events(),
        timers: this.timers(),
      }),
    })
      .then(resp => resp.json())
      .then(({ eventsRemote, logsRemote }) => {
        if (logsRemote) {
          this.on('log', (log: LogEvent) =>
            fetch(logsRemote, { method: 'POST', body: JSON.stringify(log) })
          );
        }

        if (eventsRemote) {
          this.on('event', (event: EventEvent) =>
            fetch(eventsRemote, { method: 'POST', body: JSON.stringify(event) })
          );
        }
      });
  }

  handleRegisteredEventRequest(req: CustomRequest<unknown, unknown, unknown>, res: CustomResponse) {
    const events = this.events() ?? [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events }));
  }

  handleRegisteredTimersRequest(req: CustomRequest<unknown, unknown, unknown>, res: CustomResponse) {
    const timers = this.timers() ?? [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ timers }));
  }

  handleEventRequest(req: CustomRequest<object, { eventName: string }, unknown>, res: CustomResponse) {
    if (req?.params?.eventName) {
      const requestId = 'x-request-id' in req.headers ? String(req.headers['x-request-id']) : makeId(10);

      this.handler(requestId, req.params.eventName, req.body).then(data => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      });
    }
  }

  handler(requestId: string, eventName: string, data: object = {}) {
    const filename = this._subscriptions.get(eventName);

    if (!filename) {
      throw new Error('not found');
    }

    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'worker.js'), {
        workerData: {
          filename,
          params: data,
        },
      });

      worker.on('message', (event: WorkerEvent) => {
        switch (event.event) {
          case 'result':
            resolve(event.result);
            break;
          case 'log':
            this.emit('log', {
              requestId,
              date: new Date(),
              event: eventName,
              message: event.message,
              data: event.data,
              type: event.type,
            });

            break;
          case 'event':
            this.emit('event', {
              requestId,
              date: new Date(),
              event: event.event,
              data: event.data,
            });

            this.emit('log', {
              requestId,
              date: new Date(),
              event: eventName,
              message: 'event pushed',
              data: {
                eventName,
              },
              type: LogType.info,
            });
            break;
        }
      });
      worker.on('error', reject);
      worker.on('exit', async (code: number) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  events() {
    return [...this._subscriptions.keys()];
  }

  timers() {
    return Array.from(this._timers);
  }

  createEvent(event: string, target: string) {
    this._subscriptions.set(event, target);
  }

  createTimer(event: string, interval: string) {
    this._timers.push({
      interval,
      event,
    });
  }
}
