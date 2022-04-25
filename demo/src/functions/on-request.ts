import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log } from 'vivalaakam_seattle_client';

export type Params = {
  a: number;
  b: number;
};

export default new WorkerHandler<Params>(
  'onRequest',
  params =>
    new Promise(resolve => {
      setTimeout(() => {
        log(`result: ${params.a + params.b}`);
        resolve(params.a + params.b);
      });
    })
);
