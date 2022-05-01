import { MatchFunction } from 'path-to-regexp';
import { IncomingMessage, ServerResponse } from 'http';

export type HandlerCallback<Body, Params, Search> = (
  req: CustomRequest<Body, Params, Search>,
  res: CustomResponse,
  next?: () => void
) => unknown;

export type Listener = {
  path: string;
  regexp: RegExp;
  match: MatchFunction<object>;
  handler: HandlerCallback<any, any, any>;
  method: string;
};

export interface RouterInterface {
  get<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void;

  post<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void;

  put<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void;

  delete<Body, Params, Search>(path: string, handler: HandlerCallback<Body, Params, Search>): void;
}

export interface CustomRequest<Body, Params, Search> extends IncomingMessage {
  body?: Body;
  params?: Params;
  search?: Search;
}

export type CustomResponse = ServerResponse;
