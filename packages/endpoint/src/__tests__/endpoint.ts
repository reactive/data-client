import nock from 'nock';

import Entity from '../schemas/Entity';
import Endpoint, { EndpointInstance } from '../endpoint';
import { EndpointInterface } from '../interface';

describe('Endpoint', () => {
  const payload = { id: '5', username: 'bobber' };
  const payload2 = { id: '6', username: 'tomm' };
  const assetPayload = { symbol: 'btc', price: '5.0' };
  const fetchUsers = function (this: any, { id }: { id: string }) {
    return fetch(`/${this.root || 'users'}/${id}`).then(res =>
      res.json(),
    ) as Promise<typeof payload>;
  };
  const fetchUsersIdParam = function (this: any, id: string) {
    return fetch(`/${this.root || 'users'}/${id}`).then(res =>
      res.json(),
    ) as Promise<typeof payload>;
  };
  const fetchUserList = function (this: any) {
    return fetch(`/${this.root || 'users'}/`).then(res =>
      res.json(),
    ) as Promise<typeof payload[]>;
  };
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
      .get(`/users/`)
      .reply(200, [payload])
      .get(`/moreusers/${payload.id}`)
      .reply(200, { ...payload, username: 'moreusers' })
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
        `"fetchUsers [{"id":"5"}]"`,
      );
      // @ts-expect-error
      expect(UserDetail.notexist).toBeUndefined();
      // @ts-expect-error
      const a: 'mutate' = UserDetail.type;

      // these are all meant to fail - are typescript tests
      await expect(async () => {
        // @ts-expect-error
        await UserDetail({ id: 5 });
        // @ts-expect-error
        await UserDetail();
      }).rejects.toBeDefined();
    });

    it('should have a name', () => {
      const UserDetail = new Endpoint(fetchUsersIdParam);
      expect(UserDetail.name).toBe('fetchUsersIdParam');
      const Next = new Endpoint(fetchUsersIdParam, { name: 'specialName' });
      expect(Next.name).toBe('specialName');
      const Another = Next.extend({ name: 'new' });
      expect(Another.name).toBe('new');
      const Third = Another.extend({ method: 'POST' }).extend({ extra: 5 });
      expect(Third.name).toBe('new');
      expect(Third.key('5')).toMatchInlineSnapshot(`"new ["5"]"`);
      const Fourth = Third.extend({ fetch: fetchUserList });
      expect(Fourth.name).toBe('fetchUserList');
      const Weird = new Endpoint(fetchUsersIdParam, { fetch: fetchUserList });
      expect(Weird.name).toBe(`fetchUsersIdParam`);
    });

    it('should work when called with string parameter', async () => {
      const UserDetail = new Endpoint(fetchUsersIdParam);

      // check return type and call params
      const response = await UserDetail(payload.id);
      expect(response).toEqual(payload);
      expect(response.username).toBe(payload.username);
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();

      // check additional properties defaults
      expect(UserDetail.sideEffect).toBe(undefined);
      //expect(UserDetail.schema).toBeUndefined(); TODO: re-enable once we don't care about FetchShape compatibility
      expect(UserDetail.key(payload.id)).toMatchInlineSnapshot(
        `"fetchUsersIdParam ["5"]"`,
      );
      // @ts-expect-error
      expect(UserDetail.notexist).toBeUndefined();
      // @ts-expect-error
      const a: 'mutate' = UserDetail.type;

      // these are all meant to fail - are typescript tests
      await expect(async () => {
        // @ts-expect-error
        await UserDetail({ id: payload.id });
        // @ts-expect-error
        UserDetail.key({ id: payload.id });
        // @ts-expect-error
        await UserDetail(5);
        // @ts-expect-error
        await UserDetail();
      }).rejects.toBeDefined();
    });

    it('should work when called with zero parameters', async () => {
      const UserList = new Endpoint(fetchUserList);

      // check return type and call params
      const response = await UserList();
      expect(response).toEqual([payload]);
      expect(response[0].username).toBe(payload.username);
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();

      // check additional properties defaults
      expect(UserList.sideEffect).toBe(undefined);
      //expect(UserList.schema).toBeUndefined(); TODO: re-enable once we don't care about FetchShape compatibility
      expect(UserList.key()).toMatchInlineSnapshot(`"fetchUserList []"`);
      // @ts-expect-error
      expect(UserList.notexist).toBeUndefined();
      // @ts-expect-error
      const a: 'mutate' = UserList.type;

      // these are all meant to fail - are typescript tests
      await expect(async () => {
        // @ts-expect-error
        await UserList({ id: payload.id });
        // @ts-expect-error
        UserList.key({ id: payload.id });
        // @ts-expect-error
        await UserList(5);
      }).resolves;
    });
  });

  describe('Function.bind', () => {
    it('should work when called as function', async () => {
      const UserDetail = new Endpoint(fetchUsers, { root: 'moreusers' });

      // @ts-expect-error
      UserDetail.bind(undefined, { id: { fiver: 5 } });

      const boundDetail = UserDetail.bind(undefined, { id: payload.id });

      // @ts-expect-error
      boundDetail({ id: payload.id });

      const response = await boundDetail();
      expect(response).toEqual({ ...payload, username: 'moreusers' });
      expect(response.username).toBe('moreusers');
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();

      // check additional properties defaults
      expect(boundDetail.sideEffect).toBe(undefined);
      expect(boundDetail.key()).toMatchInlineSnapshot(`"fetch [{"id":"5"}]"`);
      expect(boundDetail.root).toBe('moreusers');
      // @ts-expect-error
      expect(boundDetail.notexist).toBeUndefined();
    });
  });

  it('should infer mutate types', () => {
    type T = undefined | 1;
    type B = NonNullable<T>;
    type A = undefined | 1 extends undefined ? true : false;
    const e = new Endpoint(() => Promise.resolve() as any, {
      sideEffect: undefined as any,
    });
    // should infer any
    const a: 'mutate' = e.type;
    const b: 'read' = e.type;

    const e2: EndpointInstance<any, any, undefined | true> = new Endpoint(
      () => Promise.resolve() as any,
      {
        sideEffect: undefined as undefined | true,
      },
    );
    const a2 = (a: 'mutate') => {};
    const b2 = (a: 'read') => {};
    const type2 = e2.type;
    // type descrimination to validate that this is union
    if (type2 !== ('mutate' as const)) {
      b2(type2);
    } else {
      a2(type2);
    }

    const e3 = new Endpoint(() => Promise.resolve() as any, {
      sideEffect: undefined,
    });
    // @ts-expect-error
    const a3: 'mutate' = e3.type;
    const b3: 'read' = e3.type;

    const e4 = new Endpoint(() => Promise.resolve() as any, {
      sideEffect: true,
    });
    const a4: 'mutate' = e4.type;
    // @ts-expect-error
    const b4: 'read' = e4.type;
  });

  it('should work when extended', async () => {
    const BaseFetch = new Endpoint(fetchUsers);
    // @ts-expect-error
    const aa: true = BaseFetch.sideEffect;
    const bb: undefined = BaseFetch.sideEffect;
    const UserDetail = new Endpoint(fetchUsers).extend({
      sideEffect: true,
      key: ({ id }: { id: string }) => `fetch my user ${id}`,
    });
    // @ts-expect-error
    const a: undefined = UserDetail.sideEffect;
    const b: true = UserDetail.sideEffect;

    // ts-expect-error
    //const c: undefined = UserDetail.extend({ dataExpiryLength: 5 }).sideEffect;
    //const d: true = UserDetail.extend({ dataExpiryLength: 5 }).sideEffect;

    function t(a: EndpointInterface<typeof fetchUsers, any, undefined>) {}
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
      // TODO: ts-expect-error
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
      `"fetchAsset [{"symbol":"doge"}]"`,
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
    const Extended = UserDetail.extend({
      schema: User2,
    });
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

    it('makes', async () => {
      const UserCurrent = new Endpoint(fetchAuthd, { token: 'password', key });

      const response = await UserCurrent();
      expect(response).toEqual(payload);
      expect(response.username).toBe(payload.username);

      expect(UserCurrent.key()).toMatchInlineSnapshot(
        `"current user password"`,
      );

      UserCurrent.key = function () {
        return Object.getPrototypeOf(UserCurrent).key.call(this) + 'never';
      };
    });

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
      // TODO: ts-expect-error new Endpoint(fetchAuthd, { token: 'hi', key: key2 });

      // @ts-expect-error
      new Endpoint(fetchAuthd, { token: 'hi', key: key3 });

      new Endpoint(fetchAuthd, { token: 'hi', key: key4 });
    });

    it('should not allow mismatched key when extending', () => {
      const UserCurrent = new Endpoint(fetchAuthd, { token: 'password', key });

      // TODO: ts-expect-error UserCurrent.extend({ key: key2 });

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

  describe('helper members', () => {
    it('url helper', async () => {
      const url = ({ id }: { id: string }) => `/users/${id}`;
      const fetchUsers = function (
        this: { url: (params: { id: string }) => string },
        { id }: { id: string },
      ) {
        return fetch(this.url({ id })).then(res => res.json()) as Promise<
          typeof payload
        >;
      };
      // @ts-expect-error
      new Endpoint(fetchUsers, { url: '', random: 5 });
      // @ts-expect-error
      new Endpoint(fetchUsers, { url }).extend({ url: 'hi' });

      const UserDetail = new Endpoint(
        function ({ id }: { id: string }) {
          this.random;
          // @ts-expect-error
          this.notexistant;
          return fetch(this.url({ id })).then(res => res.json()) as Promise<
            typeof payload
          >;
        },
        {
          url,
          random: 599,
          dataExpiryLength: 5000,
        },
      );
      const a: undefined = UserDetail.sideEffect;
      // @ts-expect-error
      const b: true = UserDetail.sideEffect;
      UserDetail.schema;
      UserDetail.random;
      // @ts-expect-error
      UserDetail.nonexistant;
      UserDetail.key({ id: 'hi' });
      // @ts-expect-error
      () => UserDetail.key({ nonexistant: 5 });
      // @ts-expect-error
      () => UserDetail.key({ id: 5 });

      let res = await UserDetail({ id: payload.id });
      expect(res).toEqual(payload);
      expect(res.username).toBe(payload.username);
      // @ts-expect-error
      expect(res.notexist).toBeUndefined();

      // test extending parts that aren't used in this
      const Extended = UserDetail.extend({ random: 100 });
      res = await Extended({ id: payload.id });
      expect(res).toEqual(payload);
      expect(res.username).toBe(payload.username);
      // @ts-expect-error
      expect(res.notexist).toBeUndefined();

      UserDetail.extend({
        url: function (params: { id: string }) {
          return this.constructor.prototype.url(params) + '/more';
        },
        // @ts-expect-error
        random: '600',
      });
      const Test = UserDetail.extend({
        random: 600,
      });

      // check return type and call params
      const response = await Test({ id: payload.id });
      expect(response).toEqual(payload);
      expect(response.username).toBe(payload.username);
      // @ts-expect-error
      expect(response.notexist).toBeUndefined();
    });

    it('should work with key', () => {
      const url = ({ id }: { id: string }) => `/users/${id}`;
      class User extends Entity {
        readonly id: string = '';
        pk() {
          return this.id;
        }
      }
      const UserDetail = new Endpoint(
        function ({ id }: { id: string }) {
          this.schema;
          this.random;
          // @ts-expect-error
          this.notexistant;
          return fetch(this.url({ id })).then(res => res.json()) as Promise<
            typeof payload
          >;
        },
        {
          url,
          random: 599,
          schema: [User],
          key: function (this: any, { id }: { id: string }) {
            this.random;
            this.schema;
            return id + 'hi';
          },
        },
      );
      const sch: typeof User[] = UserDetail.schema;
      const s: undefined = UserDetail.sideEffect;
      UserDetail.random;
      // @ts-expect-error
      UserDetail.nonexistant;
      UserDetail.key({ id: 'hi' });
      // @ts-expect-error
      () => UserDetail.key({ nonexistant: 5 });
      // @ts-expect-error
      () => UserDetail.key({ id: 5 });
    });
  });

  describe('AbortController', () => {
    const url = ({ id }: { id: string }) => `/users/${id}`;

    const UserDetail = new Endpoint(
      function ({ id }: { id: string }) {
        const init: RequestInit = {};
        if (this.signal) {
          init.signal = this.signal;
        }
        return fetch(this.url({ id }), init).then(res => res.json()) as Promise<
          typeof payload
        >;
      },
      {
        url,
        signal: undefined as AbortSignal | undefined,
      },
    );

    it('should work without signal', async () => {
      const user = await UserDetail({ id: payload.id });
      expect(user.username).toBe(payload.username);
    });

    it('should reject when aborted', async () => {
      const abort = new AbortController();
      const AbortUser = UserDetail.extend({ signal: abort.signal });
      await expect(async () => {
        const promise = AbortUser({ id: payload.id });
        abort.abort();
        return await promise;
      }).rejects.toMatchInlineSnapshot(`[AbortError: Aborted]`);
    });
  });

  describe('class', () => {
    /*class ResourceEndpoint<
      F extends (params?: any, body?: any) => Promise<any>,
      S extends Schema | undefined = undefined,
      M extends true | undefined = undefined
    > extends Endpoint<F, S, M> {
      constructor(
        fetchFunction: F,
        options?: EndpointOptions<
          (this: ThisParameterType<F>, ...args: Parameters<F>) => string,
          S,
          M
        > &
          ThisParameterType<F>,
      ) {
        super(fetchFunction, options);
      }

      fetch(...args: Parameters<F>) {
        return fetch(this.url(args[0]), this.init).then(res => res.json());
      }

      init: RequestInit = { method: 'GET' };
      key(params: { id: string }) {
        return `${this.init.method} ${this.url(params)}`;
      }
    }

    const init = this.getFetchInit({ method: 'GET' });
    const fetch = this.fetch.bind(this);

    return new Endpoint(
      function (
        this: { url: (p: any) => string; init: RequestInit },
        params: Readonly<object>,
      ) {
        return fetch(this.url(params), this.init);
      },
      {
        ...this.getEndpointExtra(),
        key: function (
          this: { url: (p: any) => string; init: RequestInit },
          params: Readonly<object>,
        ) {
          return `${this.init.method} ${this.url(params)}`;
        },
        url: this.url.bind(this),
        init,
      },
    );*/
    /* describe('auth patterns', () => {
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

      it('should use extended token', async () => {
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
    })*/
  });
});
