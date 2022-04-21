import { Filter } from 'mongodb';
import { MatchFunction } from 'path-to-regexp';

export type MiddlewareProps = {
  dbConnection: string;
  dbName: string;
  basePath?: string;
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
    filter?: null | Filter<Partial<StoreObject<object>>>
  ) => Promise<StoreObject<T> | Array<StoreObject<T>>>;
  method: string;
};

export type Params = {
  collection: string;
  id?: string;
};

export type BatchRequest = {
  method: string;
  path: string;
  body: object;
};
