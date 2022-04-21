import { MiddlewareProps } from '../types';
import express from 'express';
import { middleware } from '../middleware';

export const seedApp = ({ dbConnection, dbName, basePath = '/' }: MiddlewareProps) => {
  const app = express();
  app.use(middleware({ dbConnection, dbName, basePath }));

  return app;
};
