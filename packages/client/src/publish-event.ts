import { getEmitter } from './events';

export function publishEvent(event: string, data: object = {}) {
  getEmitter()?.emit('message', {
    event: 'event',
    name: event,
    data,
  });
}
