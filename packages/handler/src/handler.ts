import { Worker } from 'worker_threads';
import EventEmitter from 'events';
import path from 'path';
import { LogEvent, LogType } from 'vivalaakam_seattle_client';
import { makeId } from 'vivalaakam_seattle_utils';
import { CustomRequest, CustomResponse, Router } from 'vivalaakam_seattle_router';

import { CronSubscription, QueueEvent, WorkerEvent } from './types';

export class Handler extends EventEmitter {
  private _subscriptions = new Map<string, string>();

  private _locked = false;

  private _queue: QueueEvent[] = [];

  private _timers: Array<CronSubscription> = [];

  private _initialized = false;

  readonly router: Router;

  constructor(prefix = '') {
    super();
    this.router = new Router(prefix);
    this.router.get('/event/:eventName', this.handleEventRequest);
    this.router.get('/registeredEvents', this.handleRegisteredEventRequest);
    this.router.get('/registeredTimers', this.handleRegisteredTimersRequest);
    this.router.get('/streamEvents', this.handleStreamEventRequest);
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value) {
    this._initialized = value;
  }

  handleStreamEventRequest(req: CustomRequest<unknown, unknown, unknown>, res: CustomResponse) {
    const headers = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    };
    res.writeHead(200, headers);

    const connection = {
      type: 'connected',
      id: makeId(10),
    };

    res.write(`data: ${JSON.stringify(connection)}\n\n`);

    const subscription = (event: LogEvent) => {
      const data = {
        type: 'log',
        event,
      };

      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    this.addListener('log', subscription);

    req.on('close', () => {
      this.removeListener('log', subscription);
      console.log(`${connection.id} Connection closed`);
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
      this.handler(req.params.eventName, req.body).then(response => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      });
    }
  }

  handler(eventName: string, data: object = {}) {
    const filename = this._subscriptions.get(eventName);

    if (!filename) {
      throw new Error('not found');
    }

    return new Promise((resolve, reject) => {
      const requestId = makeId(10);
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
            this.pushEvent(event);
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

  pushEvent(event: QueueEvent) {
    this._queue.push(event);
    if (!this._locked) {
      this.handleQueueEvent();
    }
  }

  immediatelyEvent(event: QueueEvent) {
    this._queue.unshift(event);
    if (!this._locked) {
      this.handleQueueEvent();
    }
  }

  private async handleQueueEvent() {
    this._locked = true;
    while (this._queue.length) {
      const event = this._queue.shift();
      if (event) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await this.handler(event.name, event.data);
        } catch (e) {
          if (e instanceof Error) {
            console.log(e.message);
          }
        }
      }
    }

    this._locked = false;
  }
}
