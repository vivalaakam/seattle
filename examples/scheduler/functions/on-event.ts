import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log, publishEvent } from 'vivalaakam_seattle_client';

export default new WorkerHandler<object>('onEvent', async params => {
  log('data', params);

  await publishEvent('onEventQueue');
});
