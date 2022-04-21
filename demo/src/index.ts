import express from 'express';
import axios from 'axios';
import path from 'path';
import { middleware as storeMiddleware } from 'vivalaakam_seattle_store';
import { middleware as schedulerMiddleware } from 'vivalaakam_seattle_scheduler';
import { LogEvent, } from 'vivalaakam_seattle_client';

import { DB_CONNECTION, DB_NAME, PORT, STORAGE_HOST } from './constants';

async function onLogEvent(event: LogEvent) {
  await axios.post(`${STORAGE_HOST}/class/logs`, event);

  console.log(
    `Log.apply: ${event.date}: ${event.event} (${event.type}): ${event.message} ${JSON.stringify(
      event.data
    )}`
  );
}

const app = express();
app.use(storeMiddleware({ dbConnection: DB_CONNECTION, dbName: DB_NAME, basePath: '/store', onLogEvent }));
app.use(
  schedulerMiddleware({
    functions: path.resolve(__dirname, './functions'),
    basePath: '/handler',
    onLogEvent,
  })
);

app.listen(PORT);
