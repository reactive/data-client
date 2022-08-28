import nock from 'nock';
import { schema } from '@rest-hooks/normalizr';

import GQLEndpoint from '../GQLEndpoint';
import GQLEntity from '../GQLEntity';

function onError(e: any) {
  e.preventDefault();
}
beforeEach(() => {
  if (typeof addEventListener === 'function')
    addEventListener('error', onError);
});
afterEach(() => {
  if (typeof removeEventListener === 'function')
    removeEventListener('error', onError);
});

describe('GQLEntity', () => {
  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200);
  });

  afterAll(() => {
    nock.cleanAll();
  });

  it('should implement schema.EntityInterface', () => {
    class A extends GQLEntity {}
    const a: schema.EntityInterface = A;
  });
});

describe('GQLEndpoint', () => {
  const gql = new GQLEndpoint('https://nosy-baritone.glitch.me');

  beforeEach(() => {
    nock('https://nosy-baritone.glitch.me')
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .post('/')
      .reply((uri, requestBody) => {
        let body = requestBody as any;
        if (typeof requestBody === 'string') {
          body = JSON.parse(requestBody);
        }
        if (body.variables.name === 'Fong')
          return [
            200,
            {
              data: { user: { id: '1', name: 'Fong', email: 'fong@test.com' } },
            },
            { 'content-type': 'application/json' },
          ];
        else
          return [
            400,
            {
              errors: [
                {
                  path: ['user'],
                  locations: [
                    {
                      line: 2,
                      column: 3,
                    },
                  ],
                  message: 'Generic failure',
                },
              ],
            },
            { 'content-type': 'application/json' },
          ];
      });
  });
  afterAll(() => {
    nock.cleanAll();
  });

  class User extends GQLEntity {
    readonly name: string | null = null;
    readonly email: string = '';
    readonly age: number = 0;
  }
  const userDetail = gql.query(
    (v: { name: string }) => `query UserDetail($name: String!) {
      user(name: $name) {
        id
        name
        email
      }
    }`,
    { user: User },
  );

  it('should query', async () => {
    const response = await userDetail({ name: 'Fong' });
    expect(response.user).toBeDefined();
    expect(response.user.name).toBeDefined();
    expect(response).toMatchInlineSnapshot(`
      {
        "user": {
          "email": "fong@test.com",
          "id": "1",
          "name": "Fong",
        },
      }
    `);
    // @ts-expect-error
    expect(response.slkd).toBeUndefined();
  });

  it('should deny bad types', () => {
    // @ts-expect-error
    () => userDetail({ name2: 'Fong' });
    // @ts-expect-error
    () => userDetail({ name: 5 });
  });

  describe('simple string', () => {
    const userDetailSimple = gql.query(
      `query UserDetail($name: String!) {
        user(name: $name) {
          id
          name
          email
        }
      }`,
      { user: User },
    );

    it('should query', async () => {
      const response = await userDetailSimple({ name: 'Fong' });
      expect(response.user).toBeDefined();
      expect(response.user.name).toBeDefined();
      expect(response).toMatchInlineSnapshot(`
        {
          "user": {
            "email": "fong@test.com",
            "id": "1",
            "name": "Fong",
          },
        }
      `);
      // @ts-expect-error
      expect(response.slkd).toBeUndefined();
    });
  });

  it('should throw on error', async () => {
    await expect(userDetail({ name: 'Fong2' })).rejects.toMatchInlineSnapshot(
      `[NetworkError: Generic failure]`,
    );
  });
});
