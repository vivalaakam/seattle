export enum LogType {
  error = 'error',
  info = 'info',
  debug = 'debug',
}

export type LogEvent = {
  event: string;
  requestId: string;
  date: Date;
  message: string;
  data: object;
  type: LogType;
};

export interface Emitter {
  emit(event: string, params: unknown): void;
}
