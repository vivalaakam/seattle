import { AppConfig, LogEvent, SearchParams } from './types';

export class Api {
  private _handlers = '';

  private _store = '';

  init(config: AppConfig) {
    this._handlers = config.handlers ?? '';
    this._store = config.store ?? '';
  }

  get handlers() {
    return this._handlers;
  }

  get store() {
    return this._handlers;
  }

  prepareSearch(search: SearchParams) {
    return Object.entries(search)
      .map(([field, value]) => {
        if (typeof value === 'object' || Array.isArray(value)) {
          return `${field}=${JSON.stringify(value)}`;
        }

        return `${field}=${value}`;
      })
      .join('&');
  }

  async getRegisteredEvents(): Promise<{ events: Array<string> }> {
    return this.getRequest(`${this._handlers}/registeredEvents`);
  }

  async getRequest(endpoint: string) {
    const response = await fetch(endpoint);
    return response.json();
  }

  async getStoredLogs(search: SearchParams): Promise<LogEvent[]> {
    return this.getRequest(`${this._store}/class/logs?${this.prepareSearch(search)}`);
  }
}

export const api = new Api();
