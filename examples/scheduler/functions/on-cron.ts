import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { log, publishEvent } from 'vivalaakam_seattle_client';

export default new WorkerHandler(
  'onCron1',
  () => {
    log('called');
    setTimeout(() => {
      publishEvent('onEvent', { currentTime: new Date() });
    }, 250);
  },
  {
    cronJob: ['0 */1 * * * *'],
  }
);
