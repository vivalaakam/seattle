import { Response, Router } from 'express';
import { CustomRequest } from './types';
import { makeId } from './utils';

export const router = Router();

router.post('/:event', (req: CustomRequest, res: Response) => {
  req.scheduler
    ?.handler(req.params.event, req.body)
    .then(data => res.json(data))
    .catch(() => res.status(404));
});

router.get('/events', (req: CustomRequest, res: Response) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };
  res.writeHead(200, headers);

  const connection = {
    type: 'connected',
    id: makeId(10),
  };

  res.write(`data: ${JSON.stringify(connection)}\n\n`);

  req.scheduler?.on('log', event => {
    const data = {
      type: 'log',
      event,
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });

  req.on('close', () => {
    console.log(`${connection.id} Connection closed`);
  });
});
