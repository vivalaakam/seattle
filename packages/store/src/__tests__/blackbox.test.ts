import request, { SuperAgentTest } from 'supertest';
import { clear, close, connect, params } from './db';
import { seedApp } from './seed-app';

let agent: SuperAgentTest | null = null;
jest.setTimeout(30000);

describe('blackbox testing', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clear();
  });
  afterAll(async () => await close());

  [
    { name: 'work without basePath', basePath: '' },
    {
      name: 'work with basePath',
      basePath: '/basePath',
    },
  ].forEach(({ name, basePath }) => {
    describe(name, () => {
      beforeAll(() => {
        const dbParams = params();

        agent = request.agent(
          seedApp({ dbConnection: dbParams.dbConnection, dbName: dbParams.dbName, basePath })
        );
      });

      describe('POST /class/:className', () => {
        it('should create object', async () => {
          const res = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body).toEqual(
            expect.objectContaining({
              name: 'test-tag',
            })
          );
        });
      });

      describe('GET /class/:className/:id', () => {
        it('should return 200 and object', async () => {
          const create = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          const { _id } = create?.body;

          const res = await agent?.get(`${basePath}/class/test/${_id}`).send();

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body).toEqual(
            expect.objectContaining({
              name: 'test-tag',
            })
          );
        });

        it('should return 404 if object not found', async () => {
          const res = await agent?.get(`${basePath}/class/test/fake-id`).send();

          expect(res?.statusCode).toEqual(404);
        });
      });

      describe('PUT /class/:className/:id', () => {
        it('should update object', async () => {
          const create = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          const { _id } = create?.body;

          const res = await agent?.put(`${basePath}/class/test/${_id}`).send({ name: 'test-tag2' });

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body).toEqual(
            expect.objectContaining({
              name: 'test-tag2',
            })
          );
        });
      });

      describe('DELETE /class/:className/:id', () => {
        it('should remove object', async () => {
          const create = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          const { _id } = create?.body;

          const res = await agent?.delete(`${basePath}/class/test/${_id}`).send();

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();

          const get = await agent?.get(`${basePath}/class/test/${_id}`).send();

          expect(get?.statusCode).toEqual(404);
        });
      });

      describe('GET /class/:className', () => {
        it('should return all rows', async () => {
          await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag 1', filterProperty: '1' });
          await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag 2', filterProperty: '2' });

          const res = await agent?.get(`${basePath}/class/test`).send();
          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body.length).toEqual(2);
        });

        it('should return filter rows', async () => {
          await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag 1', filterProperty: '1' });
          await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag 2', filterProperty: '2' });

          const res = await agent
            ?.get(`${basePath}/class/test?filter=${JSON.stringify({ filterProperty: '1' })}`)
            .send();
          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body.length).toEqual(1);
        });
      });

      describe('POST /batch', () => {
        it('should create object', async () => {
          const res = await agent?.post(`${basePath}/batch`).send({
            requests: [
              {
                method: 'POST',
                path: `${basePath}/class/test`,
                body: {
                  name: 'test-tag',
                },
              },
            ],
          });

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body.length).toEqual(1);
          expect(res?.body[0]).toEqual(
            expect.objectContaining({
              name: 'test-tag',
            })
          );
        });

        it('should update object', async () => {
          const create = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          const { _id } = create?.body;

          const res = await agent?.post(`${basePath}/batch`).send({
            requests: [
              {
                method: 'PUT',
                path: `${basePath}/class/test/${_id}`,
                body: {
                  name: 'test-tag2',
                },
              },
            ],
          });

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();
          expect(res?.body.length).toEqual(1);
          expect(res?.body[0]).toEqual(
            expect.objectContaining({
              name: 'test-tag2',
            })
          );
        });

        it('should remove object', async () => {
          const create = await agent?.post(`${basePath}/class/test`).send({ name: 'test-tag' });

          const { _id } = create?.body;

          const res = await agent?.post(`${basePath}/batch`).send({
            requests: [
              {
                method: 'DELETE',
                path: `${basePath}/class/test/${_id}`,
                body: {},
              },
            ],
          });

          expect(res?.statusCode).toEqual(200);
          expect(res?.body).toBeTruthy();

          const get = await agent?.get(`${basePath}/class/test/${_id}`).send();

          expect(get?.statusCode).toEqual(404);
        });
      });
    });
  });

  it('should not prevent request if path not started with basePath', async () => {
    const dbParams = params();

    agent = request.agent(
      seedApp({ dbConnection: dbParams.dbConnection, dbName: dbParams.dbName, basePath: '/basePath' })
    );

    const res = await agent?.get(`/really-not-found-page`).send();

    expect(res?.statusCode).toEqual(200);
    expect(res?.body).toBeTruthy();
    expect(res?.body).toEqual(
      expect.objectContaining({
        page: 'really-not-found-page',
      })
    );
  });
});
