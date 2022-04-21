import { isMainThread, parentPort, workerData } from 'worker_threads';
import EventEmitter from 'events';
import { log, setEmitter } from 'vivalaakam_seattle_client';

import { WorkerHandler } from './worker_handler';
import { LogType } from './types';

const emitter = new EventEmitter();
setEmitter(emitter);


emitter.on('message', (message) => {
  parentPort?.postMessage(message);
})

async function run(filename: string, params: unknown = {}) {
  const handler = await import(filename);

  if (handler.default instanceof WorkerHandler) {
    return handler.default.call(params);
  } else {
    throw new Error('wrong file');
  }
}

if (!isMainThread && parentPort) {
  log('started', {}, LogType.info);
  const start = performance.now();
  run(workerData.filename, workerData.params)
    .then(result => {
      parentPort?.postMessage({
        event: 'result',
        result,
      });
    })
    .then(() => {
      log('success', {}, LogType.info);
    })
    .catch(e => {
      log('error', { message: e.message }, LogType.error);
    })
    .finally(() => {
      const finish = performance.now();
      log('finished', {}, LogType.info);
      log('duration', { duration: finish - start }, LogType.info);
    });
}
