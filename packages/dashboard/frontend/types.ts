import { LogType } from 'vivalaakam_seattle_client';

export type AppConfig = {
  handlers?: string;
  store?: string;
};

export type AppProps = {
  publicHost: string;
};

export type ConfigProps = {};

export type StreamEvent =
  | {
      type: 'log';
      event: LogEvent;
    }
  | {
      type: 'connected';
    };

export type LogEvent = {
  _id?: string;
  event: string;
  requestId: string;
  date: string;
  message: string;
  data: object;
  type: LogType;
};

export type SearchParams = {
  filter?: object;
  limit?: number;
  sort?: string;
}
