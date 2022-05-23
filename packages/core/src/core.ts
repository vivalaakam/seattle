import EventEmitter from 'events';
import { LogEvent } from 'vivalaakam_seattle_client';
import { makeId } from 'vivalaakam_seattle_utils';
import { CustomRequest, CustomResponse, Router } from 'vivalaakam_seattle_router';

import { parseExpression } from 'cron-parser';
import { CronSubscriptions, RegisterRequest } from './types';

export class Core extends EventEmitter {
  private _subscriptions = new Map<string, string>();

  private _cronSubscriptions = new Map<string, CronSubscriptions>();

  private _timers: Array<{ next: Date; event: string }> = [];

  private _initialized = false;

  readonly router: Router;

  constructor(prefix = '') {
    super();
    this.router = new Router(prefix);
    this.router.post('/register', this.handleRegisterRequest);
    this.router.get('/registeredEvents', this.handleRegisteredEventRequest);
    this.router.get('/registeredTimers', this.handleRegisteredTimersRequest);
    this.router.get('/streamEvents', this.handleStreamEventRequest);
    this.router.get('/event/:event', this.handleEventRequest);
    this.router.post('/event/:event', this.handleEventRequest);
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(value) {
    this._initialized = value;
  }

  handleRegisterRequest(req: CustomRequest<RegisterRequest, unknown, unknown>, res: CustomResponse) {
    try {
      if (req.body) {
        const { events, timers } = req.body;

        events.forEach(e => {
          this._subscriptions.set(e.event, e.path);
        });

        timers.forEach(t => {
          if (!this._cronSubscriptions.has(t.interval)) {
            const interval = parseExpression(t.interval);

            this._cronSubscriptions.set(t.interval, {
              regexp: interval,
              events: [],
            });

            this._timers.push({
              next: interval.next().toDate(),
              event: t.interval,
            });
          }

          const subscription = this._cronSubscriptions.get(t.interval);
          if (subscription) {
            subscription.events.push(t.event);
          }
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'done' }));
    } catch (e) {
      if (e instanceof Error) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: e.message }));
      }
    }
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

  async handleEventRequest(req: CustomRequest<unknown, { event: string }, unknown>, res: CustomResponse) {
    const remoteUrl = this._subscriptions.get(req.params?.event ?? '');

    if (!remoteUrl) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: 'not found' }));
      return;
    }

    try {
      const resp = await fetch(remoteUrl, {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: {
          'x-request-id': makeId(10),
        },
      });

      const data = await resp.text();

      res.writeHead(resp.status, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch (e) {
      if (e instanceof Error) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: e.message }));
      }
    }
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
}
