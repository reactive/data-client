import nock from 'nock';
import { Schema, Entity } from '@rest-hooks/normalizr';
import { camelCase, snakeCase } from 'lodash';

import Endpoint from '../endpoint';
import { EndpointInterface } from '../interface';

describe('Endpoint', () => {
  const payload = { id: '5', username: 'bobber' };
  const payload2 = { id: '6', username: 'tomm' };
  const assetPayload = { symbol: 'btc', price: '5.0' };
  const fetchUsers = ({ id }: { id: string }) =>
    fetch(`/users/${id}`).then(res => res.json()) as Promise<typeof payload>;
  const fetchAsset = ({ symbol }: { symbol: string }) =>
    fetch(`/asset/${symbol}`).then(res => res.json()) as Promise<
      typeof assetPayload
    >;

  beforeAll(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/users/${payload.id}`)
      .reply(200, payload)
      .get(`/asset/${assetPayload.symbol}`)
      .reply(200, assetPayload);
    nock(/.*/, { reqheaders: { Auth: 'password' } })
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/users/current`)
      .reply(200, payload);
    nock(/.*/, { reqheaders: { Auth: 'password2' } })
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/users/current`)
      .reply(200, payload2);
  });
  afterAll(() => {
    nock.cleanAll();
  });

  describe('Function', () => {
    it('should work when called as function', async () => {
      const UserDetail = new Endpoint(fetchUsers);

      // check return type and call params
      const response = await UserDetail({ id: payload.id });
      expect(response).toEqual(payload);
      expect(response.username).toBe(payload.username);
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();

      // check additional properties defaults
      expect(UserDetail.sideEffect).toBe(undefined);
      //expect(UserDetail.schema).toBeUndefined(); TODO: re-enable once we don't care about FetchShape compatibility
      expect(UserDetail.key({ id: payload.id })).toMatchInlineSnapshot(
        `"fetchUsers {\\"id\\":\\"5\\"}"`,
      );
      // @ts-expect-error
      expect(UserDetail.notexist).toBeUndefined();
      // @ts-expect-error
      const a: 'mutate' = UserDetail.type;

      // these are all meant to fail - are typescript tests
      expect(() => {
        // @ts-expect-error
        UserDetail({ id: 5 });
        // @ts-expect-error
        UserDetail();
      }).toThrow();
    });
  });

  it('should work when extended', async () => {
    const BaseFetch = new Endpoint(fetchUsers);
    const UserDetail = new Endpoint(fetchUsers).extend({
      sideEffect: true,
      key: ({ id }: { id: string }) => `fetch my user ${id}`,
    });
    // @ts-expect-error
    const a: undefined = UserDetail.sideEffect;

    function t(a: EndpointInterface<typeof fetchUsers>) {}
    // @ts-expect-error
    t(UserDetail);
    t(BaseFetch);

    expect(UserDetail.key({ id: '500' })).toMatchInlineSnapshot(
      `"fetch my user 500"`,
    );
    // @ts-expect-error
    expect(() => UserDetail.key()).toThrow();
    // @ts-expect-error
    expect(UserDetail.key({ not: 'five' })).toMatchInlineSnapshot(
      `"fetch my user undefined"`,
    );
    // @ts-expect-error
    expect(UserDetail.key({ id: 5 })).toMatchInlineSnapshot(
      `"fetch my user 5"`,
    );
    new Endpoint(fetchUsers).extend({
      sideEffect: true,
      // @ts-expect-error
      key: ({ a }: { a: number }) => `fetch my user ${a}`,
    });
    new Endpoint(fetchUsers).extend({
      sideEffect: true,
      fetch: fetchAsset,
      // @ts-expect-error
      key: ({ id }: { id: string }) => `fetch my user ${id}`,
    });

    const AssetDetail = new Endpoint(fetchUsers).extend({
      fetch: fetchAsset,
    });

    const response = await AssetDetail({ symbol: assetPayload.symbol });
    expect(response).toEqual(assetPayload);
    expect(response.price).toBe(assetPayload.price);
    // @ts-expect-error
    expect(response.notexist).toBeUndefined();

    expect(AssetDetail.key({ symbol: 'doge' })).toMatchInlineSnapshot(
      `"fetchAsset {\\"symbol\\":\\"doge\\"}"`,
    );
  });

  it('should infer return type when schema is specified but fetch function has no typing', async () => {
    class User extends Entity {
      readonly id: string = '';
      readonly username: string = '';
      pk() {
        return this.id;
      }
    }
    class User2 extends User {
      readonly extra: number = 0;
    }
    const UserDetail = new Endpoint(
      ({ id }: { id: string }) => fetch(`/users/${id}`).then(res => res.json()),
      { schema: User },
    );
    const user = await UserDetail({ id: payload.id });
    expect(user).toEqual(payload);
    expect(user.username).toBe(payload.username);

    // extends
    const Extended = UserDetail.extend({ schema: User2 });
    const user2 = await Extended({ id: payload.id });
    expect(user2).toEqual(payload);
    // doesn't actually generate class
    expect(user2.extra).toBe(undefined);
  });

  describe('auth patterns (usage with `this`)', () => {
    function fetchAuthd(this: { token: string }): Promise<typeof payload> {
      return fetch(`/users/current`, {
        headers: { Auth: this.token },
      }).then(res => res.json());
    }
    function key(this: { token: string }) {
      return `current user ${this.token}`;
    }

    it('should use provided context in fetch and key', async () => {
      const UserCurrent = new Endpoint(fetchAuthd, { token: 'password', key });

      const response = await UserCurrent();
      expect(response).toEqual(payload);
      expect(response.username).toBe(payload.username);
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();

      expect(UserCurrent.key()).toMatchInlineSnapshot(
        `"current user password"`,
      );
    });

    it('should typescript error when missing expected this members', () => {
      // @ts-expect-error
      new Endpoint(fetchAuthd, { key });
      // @ts-expect-error
      new Endpoint(fetchAuthd, { token: 5, key });
    });

    function key2(this: { token: number }) {
      return `current user ${this.token}`;
    }
    function key3(this: { token: string }, { id }: { id: string }) {
      return `current user ${this.token}`;
    }
    function key4() {
      return `current user`;
    }

    it('should not allow mismatched key', () => {
      // @ts-expect-error
      new Endpoint(fetchAuthd, { token: 'hi', key2 });

      // @ts-expect-error
      new Endpoint(fetchAuthd, { token: 'hi', key: key3 });

      new Endpoint(fetchAuthd, { token: 'hi', key: key4 });
    });

    it('should not allow mismatched key when extending', () => {
      const UserCurrent = new Endpoint(fetchAuthd, { token: 'password', key });

      // @ts-expect-error
      UserCurrent.extend({ key: key2 });

      // @ts-expect-error
      UserCurrent.extend({ key: key3 });

      const a = UserCurrent.extend({ key: key4 });

      expect(a.key()).toBe(key4());
    });

    it('should break when trying to use reserved `this` members', () => {
      function fetchAuthd(this: {
        token: string;
        sideEffect: number;
      }): Promise<typeof payload> {
        return fetch(`/users/current`, {
          headers: { Auth: this.token },
        }).then(res => res.json());
      }

      // @ts-expect-error TODO: make this error message actually readable
      new Endpoint(fetchAuthd, {
        token: 'password',
        key,
        sideEffect: 5,
      });
    });
  });

  /*describe('class', () => {
    describe('auth patterns', () => {
      class AuthEndpoint<
        F extends (
          this: AuthEndpoint<any, any, any>,
          params?: any,
          body?: any,
        ) => Promise<any>,
        S extends Schema | undefined = undefined,
        M extends true | undefined = undefined
      > extends Endpoint<F, S, M> {
        token = 'password';
        authdFetch(info: RequestInfo, init?: RequestInit) {
          return fetch(info, {
            ...init,
            headers: { ...init?.headers, Auth: this.token },
          });
        }
      }

      function fetchAuthd(
        this: AuthEndpoint<any, any, any>,
      ): Promise<typeof payload> {
        return this.authdFetch(`/users/current`).then(res => res.json());
      }

      it('should use provided context', async () => {
        const UserCurrent = new AuthEndpoint(fetchAuthd);

        const response = await UserCurrent();
        expect(response).toEqual(payload);
        expect(response.username).toBe(payload.username);
        // @ts-expect-error
        expect(response.notexist).toBeUndefined();

        expect(UserCurrent.key()).toMatchInlineSnapshot(
          `"fetchAuthd undefined"`,
        );
      });

      it.only('should use extended token', async () => {
        //sdf @ts-expect-error
        const UserCurrent = new AuthEndpoint(fetchAuthd, {
          token: 'password3',
        }).extend({
          token: 'password2',
          sideEffect: true,
        });
        console.log((UserCurrent as any).token);

        const response = await UserCurrent();
        expect(response).toEqual(payload2);
        expect(response.username).toBe(payload2.username);
        // @ts-expect-error
        expect(response.notexist).toBeUndefined();

        expect(UserCurrent.key()).toMatchInlineSnapshot(
          `"fetchAuthd undefined"`,
        );
      });
    });
  });*/

  /*describe('custom fetch for snakeCase', () => {
    function deeplyApplyKeyTransform(
      obj: any,
      transform: (key: string) => string,
    ) {
      const ret: Record<string, any> = Array.isArray(obj) ? [] : {};
      Object.keys(obj).forEach(key => {
        if (obj[key] != null && typeof obj[key] === 'object') {
          ret[transform(key)] = deeplyApplyKeyTransform(obj[key], transform);
        } else {
          ret[transform(key)] = obj[key];
        }
      });
      return ret;
    }

    async function fetch(input: RequestInfo, init: RequestInit) {
      // we'll need to do the inverse operation when sending data back to the server
      if (init.body) {
        init.body = deeplyApplyKeyTransform(init.body, snakeCase) as any;
      }
      // perform actual network request getting back json
      const jsonResponse: object = await fetch(input, init);
      // do the conversion!
      return deeplyApplyKeyTransform(jsonResponse, camelCase);
    }

    const BaseEndpoint = new Endpoint(fetch);

    it('should extends', () => {
      BaseEndpoint.extend({ fetch: })
    })
  });*/
});
