import express from 'express';
import { middleware } from 'vivalaakam_seattle_store';
import { DB_CONNECTION, DB_NAME, PORT } from './constants';

const app = express();
app.use(middleware({ dbConnection: DB_CONNECTION, dbName: DB_NAME, basePath: '/store' }));

app.listen(PORT);
