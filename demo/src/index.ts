import express from 'express';
import axios from 'axios';
import path from 'path';
import cors from 'cors';
import { middleware as storeMiddleware } from 'vivalaakam_seattle_store';
import { middleware as schedulerMiddleware } from 'vivalaakam_seattle_scheduler';
import { middleware as dashboardMiddleware } from 'vivalaakam_seattle_dashboard';
import { LogEvent } from 'vivalaakam_seattle_client';

import { DB_CONNECTION, DB_NAME, HANDLER_HOST, PORT, STORAGE_HOST } from './constants';

async function onLogEvent(event: LogEvent) {
  await axios.post(`${STORAGE_HOST}/class/logs`, event);

  console.log(
    `Log.apply: ${event.date}: ${event.event} (${event.type}): ${event.message} ${JSON.stringify(
      event.data
    )}`
  );
}

const app = express();
app.use(cors());
app.use(storeMiddleware({ dbConnection: DB_CONNECTION, dbName: DB_NAME, basePath: '/store', onLogEvent }));
app.use(
  dashboardMiddleware({ basePath: '/dashboard', handlersHost: HANDLER_HOST, storeHost: STORAGE_HOST })
);
app.use(
  schedulerMiddleware({
    functions: path.resolve(__dirname, './functions'),
    basePath: '/handler',
    onLogEvent,
  })
);

app.listen(PORT);
