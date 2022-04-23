import { Filter } from 'mongodb';
import { MatchFunction } from 'path-to-regexp';
import { LogEvent } from 'vivalaakam_seattle_client';

export type MiddlewareProps = {
  dbConnection: string;
  dbName: string;
  basePath?: string;
  onLogEvent?: (event: LogEvent) => void;
};

export type StoreObject<T> = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
} & T;

export type Listener<T> = {
  path: string;
  regexp: RegExp;
  match: MatchFunction<Params>;
  handler: (
    keys: Params,
    body?: object,
    filter?: null | Filter<Partial<StoreObject<object>>>,
    options?: Options
  ) => Promise<StoreObject<T> | Array<StoreObject<T>>>;
  method: string;
};

export type Params = {
  collection: string;
  id?: string;
};

export type Options = {
  limit: string | null;
  sort: string | null;
};

export type BatchRequest = {
  method: string;
  path: string;
  body: object;
};
