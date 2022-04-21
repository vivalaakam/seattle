import express from 'express';
import path from 'path';
import { LogEvent, middleware } from 'vivalaakam_seattle_scheduler';
import { PORT } from './constants';

const onLogEvent = (event: LogEvent) => {
  console.log(
    `onLogEvent: ${event.date}: ${event.event} (${event.type}): ${event.message} ${JSON.stringify(
      event.data
    )}`
  );
};

const app = express();

app.use(middleware({ basePath: '/handler', functions: path.resolve(__dirname, './functions'), onLogEvent }));

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, '../events.html'));
});

app.listen(PORT);
