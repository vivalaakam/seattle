import express from 'express';
import { middleware } from 'vivalaakam_seattle_store';
import { DB_CONNECTION, DB_NAME, PORT } from './constants';
import { LogEvent } from 'vivalaakam_seattle_client';

const onLogEvent = (event: LogEvent) => {
  console.log(
    `onLogEvent: ${event.date}: ${event.event} (${event.type}): ${event.message} ${JSON.stringify(
      event.data
    )}`
  );
};

const app = express();
app.use(middleware({ dbConnection: DB_CONNECTION, dbName: DB_NAME, basePath: '/store', onLogEvent }));

app.listen(PORT);
