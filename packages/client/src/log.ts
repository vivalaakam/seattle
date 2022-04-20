import { LogType } from './types';
import { getEmitter } from './events';

export function log(message: string, data?: object, type?: LogType) {
  getEmitter()?.emit('message', {
    event: 'log',
    message,
    data,
    type,
  });
}
