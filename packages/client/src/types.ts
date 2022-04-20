export enum LogType {
  error = 'error',
  info = 'info',
  debug = 'debug',
}

export interface Emitter {
  emit(event: string, params: unknown): void;
}
