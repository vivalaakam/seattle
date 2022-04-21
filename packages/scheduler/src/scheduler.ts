import { parseExpression } from 'cron-parser';
import EventEmitter from 'events';
import path from 'path';
import { LogType } from 'vivalaakam_seattle_client';

import { Worker } from 'worker_threads';
import { CronSubscription, QueueEvent, WorkerEvent } from './types';
import { makeId, sleep } from './utils';

export class Scheduler extends EventEmitter {
  private _subscriptions = new Map<string, string>();
  private _locked = false;
  private _queue: QueueEvent[] = [];
  private _timers: Array<CronSubscription> = [];

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

  createEvent(event: string, target: string) {
    this._subscriptions.set(event, target);
  }

  createTimer(event: string, cronJob: string | number | Date) {
    if (typeof cronJob === 'string') {
      const interval = parseExpression(cronJob);
      this._timers.push({
        interval,
        event,
        ts: interval.next().toDate(),
      });
    } else {
      this._timers.push({
        interval: null,
        event,
        ts: new Date(cronJob),
      });
    }
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

  nextTimer() {
    const ts = new Date();
    let event = this._timers.reduce<CronSubscription | null>((memo, curr) => {
      if (ts >= curr.ts && (!memo || curr.ts < memo.ts)) {
        return curr;
      }

      return memo;
    }, null);

    if (event !== null && event.interval) {
      event.ts = event.interval.next().toDate();
    } else {
      const index = this._timers.findIndex(e => e === event);

      if (index > -1) {
        this._timers.splice(index, 1);
      }
    }

    return { value: event?.event ?? null, done: false };
  }

  async startTimer() {
    let event = this.nextTimer();
    while (!event.done) {
      if (event.value) {
        this.immediatelyEvent({ name: event.value, data: {} });
      }

      await sleep();

      event = this.nextTimer();
    }
  }
}
