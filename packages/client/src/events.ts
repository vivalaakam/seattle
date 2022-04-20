import { Emitter } from './types';

let _emitter: Emitter | null = null;

export const getEmitter = (): Emitter | null => {
  return _emitter;
};

export const setEmitter = (emitter: Emitter) => {
  _emitter = emitter;
};
