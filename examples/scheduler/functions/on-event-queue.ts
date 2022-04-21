import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log } from 'vivalaakam_seattle_client';

export default new WorkerHandler<object>('onEventQueue', async params => {
  log('data', params);
});
