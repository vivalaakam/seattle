import express from 'express';
import { MiddlewareProps } from '../types';
import { middleware } from '../middleware';

export const seedApp = ({ dbConnection, dbName, basePath = '/' }: MiddlewareProps) => {
  const app = express();
  app.use(middleware({ dbConnection, dbName, basePath }));

  app.get('/really-not-found-page', (req, res) => {
    res.json({ page: 'really-not-found-page' });
  });

  return app;
};
