import { WorkerHandler } from 'vivalaakam_seattle_scheduler';
import { publishEvent, log } from 'vivalaakam_seattle_client';

export default new WorkerHandler(
  'onCron15',
  () => {
    setTimeout(() => {
      log('call');
      publishEvent('onEvent', { currentTime: new Date() });
    }, 250);
  },
  {
    cronJob: ['0 */15 * * * *'],
  }
);
