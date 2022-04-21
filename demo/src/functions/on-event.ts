import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { publishEvent, log } from 'vivalaakam_seattle_client';

export default new WorkerHandler<object>('onEvent', async params => {
  log('data', params);

  if (Math.random() < 0.5) {
    await publishEvent('onBook');
  } else {
    await publishEvent('onFramework');
  }
});
