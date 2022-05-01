import { IncomingMessage } from 'http';
import * as net from 'net';
import { Socket } from 'net';
import { Router } from '../router';
import { CustomResponse } from '../types';

describe('Router', () => {
  it('should works with get request', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.get('/getPath', handler);

    const incomingMessage = new IncomingMessage(new net.Socket());
    incomingMessage.url = '/getPath';
    incomingMessage.method = 'GET';

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
  });

  it('should works with keys params', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.get('/:a/:b', handler);

    const incomingMessage = new IncomingMessage(new net.Socket());
    incomingMessage.url = '/get/path';
    incomingMessage.method = 'GET';

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
    expect(handler.mock.calls[0][0].params).toEqual(
      expect.objectContaining({
        a: 'get',
        b: 'path',
      })
    );
  });

  it('should works with search params', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.get('/getPath', handler);

    const incomingMessage = new IncomingMessage(new net.Socket());
    incomingMessage.url = '/getPath?a=b';
    incomingMessage.method = 'GET';

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
    expect(handler.mock.calls[0][0].search).toEqual(
      expect.objectContaining({
        a: 'b',
      })
    );
  });

  it('should works with post request', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.post('/postPath', handler);

    const incomingMessage = new IncomingMessage(new Socket());
    incomingMessage.url = '/postPath';
    incomingMessage.method = 'POST';

    incomingMessage.push('{ "a": "b" }');
    incomingMessage.push(null);

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
    expect(handler.mock.calls[0][0].body).toEqual(
      expect.objectContaining({
        a: 'b',
      })
    );
  });

  it('should works with put request', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.put('/putPath', handler);

    const incomingMessage = new IncomingMessage(new Socket());
    incomingMessage.url = '/putPath';
    incomingMessage.method = 'PUT';

    incomingMessage.push('{ "a": "b" }');
    incomingMessage.push(null);

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
    expect(handler.mock.calls[0][0].body).toEqual(
      expect.objectContaining({
        a: 'b',
      })
    );
  });

  it('should works with delete request', async () => {
    const router = new Router();
    const handler = jest.fn();

    router.delete('/deletePath', handler);

    const incomingMessage = new IncomingMessage(new Socket());
    incomingMessage.url = '/deletePath';
    incomingMessage.method = 'DELETE';

    await router.handle(incomingMessage, {} as CustomResponse);

    expect(handler).toBeCalled();
  });
});
