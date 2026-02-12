import { Entity, schema, Collection } from '@data-client/endpoint';
import { useController, useSuspense } from '@data-client/react';
import { User, Article } from '__tests__/new';

import resource from '../src/resource';
import RestEndpoint, { GetEndpoint, MutateEndpoint } from '../src/RestEndpoint';

it('RestEndpoint construct and extend with typed options', () => {
  new RestEndpoint({
    path: '/todos/',
    getOptimisticResponse(snap, body) {
      return body;
    },
    schema: User,
    method: 'POST',
  });
  // variable/unknown number of args
  new RestEndpoint({
    path: '/todos/',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
    schema: User,
    method: 'POST',
  });
  new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, params, body) {
      return body;
    },
    schema: User,
    method: 'POST',
  });
  new RestEndpoint({
    path: '/todos/:id',
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, params, body) {
      return body;
    },
    schema: User,
    method: 'POST',
  });

  const nopath = new RestEndpoint({
    path: '/todos/',
    schema: User,
    method: 'POST',
  });
  const somepath = new RestEndpoint({
    path: '/todos/:id',
    schema: User,
    method: 'POST',
  });

  nopath.extend({
    getOptimisticResponse(snap, body) {
      return body;
    },
  });
  nopath.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
  });
  somepath.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, args, body) {
      return body;
    },
  });
});

it('should customize resources', () => {
  class Todo extends Entity {
    id = '';
    userId = 0;
    title = '';
    completed = false;

    static key = 'Todo';
    pk() {
      return this.id;
    }
  }

  const TodoResource = resource({
    path: '/todos/:id',
    schema: Todo,
  });
  TodoResource.create.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
  });
  const partial = TodoResource.partialUpdate.extend({
    getOptimisticResponse(snap, { id }, body) {
      return {
        id,
        ...body,
      };
    },
  });
  () => partial({ id: 5 }, { title: 'hi' });
  const a: MutateEndpoint<{
    path: '/todos/';
    body: Partial<Todo>;
    schema: typeof Todo;
  }> = TodoResource.create.extend({ schema: Todo }) as any;
  a.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
  });

  () => useSuspense(TodoResource.getList);
});

// path: ['/todos', '/todos/:id', '/todos/:id?', string]
it('should precisely type function arguments', () => {
  // path: '/todos'
  () => {
    const optionalUndefSearch = new RestEndpoint({
      path: '/todos',
      searchParams: {} as
        | {
            userId?: string | number;
          }
        | undefined,
    });
    const optionalSearch = new RestEndpoint({
      path: '/todos',
      searchParams: {} as {
        userId?: string | number;
      },
    });
    const undef = new RestEndpoint({
      path: '/todos',
      searchParams: undefined,
    });
    const requiredSearch = new RestEndpoint({
      path: '/todos',
      searchParams: {} as {
        userId: string | number;
      },
    });
    const noSearch = new RestEndpoint({
      path: '/todos',
    });
    () => optionalUndefSearch();
    () => optionalUndefSearch({});
    () => optionalUndefSearch({ userId: 'hi' });
    // @ts-expect-error
    () => optionalUndefSearch(5);
    // @ts-expect-error
    () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

    () => optionalSearch();
    () => optionalSearch({});
    () => optionalSearch({ userId: 'hi' });
    // @ts-expect-error
    () => optionalSearch(5);
    // @ts-expect-error
    () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

    // @ts-expect-error
    () => requiredSearch();
    // @ts-expect-error
    () => requiredSearch({});
    () => requiredSearch({ userId: 'hi' });
    // @ts-expect-error
    () => requiredSearch(5);
    // @ts-expect-error
    () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

    () => undef();
    // @ts-expect-error
    () => undef({});
    // @ts-expect-error
    () => undef({ userId: 'hi' });
    // @ts-expect-error
    () => undef(5);

    () => noSearch();
    // @ts-expect-error
    () => noSearch({});
    // @ts-expect-error
    () => noSearch({ userId: 'hi' });
    // @ts-expect-error
    () => noSearch(5);
  };
  // path: '/todos/:id?'
  () => {
    const optionalUndefSearch = new RestEndpoint({
      path: '/todos/:id?',
      searchParams: {} as
        | {
            userId?: string | number;
          }
        | undefined,
    });
    const optionalSearch = new RestEndpoint({
      path: '/todos/:id?',
      searchParams: {} as {
        userId?: string | number;
      },
    });
    const undef = new RestEndpoint({
      path: '/todos/:id?',
      searchParams: undefined,
    });
    const requiredSearch = new RestEndpoint({
      path: '/todos/:id?',
      searchParams: {} as {
        userId: string | number;
      },
    });
    const noSearch = new RestEndpoint({
      path: '/todos/:id?',
    });
    () => optionalUndefSearch();
    () => optionalUndefSearch({});
    () => optionalUndefSearch({ id: '5' });
    () => optionalUndefSearch({ userId: 'hi' });
    () => optionalUndefSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => optionalUndefSearch(5);
    // @ts-expect-error
    () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

    () => optionalSearch();
    () => optionalSearch({});
    () => optionalSearch({ id: '5' });
    () => optionalSearch({ userId: 'hi' });
    () => optionalSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => optionalSearch(5);
    // @ts-expect-error
    () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

    // @ts-expect-error
    () => requiredSearch();
    // @ts-expect-error
    () => requiredSearch({});
    // @ts-expect-error
    () => requiredSearch({ id: '5' });
    () => requiredSearch({ userId: 'hi' });
    () => requiredSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => requiredSearch(5);
    // @ts-expect-error
    () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

    () => undef();
    () => undef({});
    () => undef({ id: '5' });
    // @ts-expect-error
    () => undef({ userId: 'hi' });
    // @ts-expect-error
    () => undef(5);

    () => noSearch();
    () => noSearch({});
    () => noSearch({ id: '5' });
    // @ts-expect-error
    () => noSearch({ userId: 'hi' });
    // @ts-expect-error
    () => noSearch(5);
  };
  // path: '/todos/:id'
  () => {
    const optionalUndefSearch = new RestEndpoint({
      path: '/todos/:id',
      searchParams: {} as
        | {
            userId?: string | number;
          }
        | undefined,
    });
    const optionalSearch = new RestEndpoint({
      path: '/todos/:id',
      searchParams: {} as {
        userId?: string | number;
      },
    });
    const undef = new RestEndpoint({
      path: '/todos/:id',
      searchParams: undefined,
    });
    const requiredSearch = new RestEndpoint({
      path: '/todos/:id',
      searchParams: {} as {
        userId: string | number;
      },
    });
    const noSearch = new RestEndpoint({
      path: '/todos/:id',
    });
    // @ts-expect-error
    () => optionalUndefSearch();
    () => optionalUndefSearch({ id: '5' });
    () => optionalUndefSearch({ id: '5', userId: 'hi' });
    // @ts-expect-error
    () => optionalUndefSearch(5);
    () =>
      // @ts-expect-error
      optionalUndefSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

    // @ts-expect-error
    () => optionalSearch();
    () => optionalSearch({ id: '5' });
    () => optionalSearch({ id: '5', userId: 'hi' });
    // @ts-expect-error
    () => optionalSearch(5);
    // @ts-expect-error
    () => optionalSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

    // @ts-expect-error
    () => requiredSearch();
    // @ts-expect-error
    () => requiredSearch({ id: '5' });
    () => requiredSearch({ id: '5', userId: 'hi' });
    // @ts-expect-error
    () => requiredSearch(5);
    // @ts-expect-error
    () => requiredSearch({ id: '5', userId: 'hi' }, { id: '5', userId: 'hi' });

    // @ts-expect-error
    () => undef();
    // @ts-expect-error
    () => undef({});
    // @ts-expect-error
    () => undef({ id: '5', userId: 'hi' });
    // @ts-expect-error
    () => undef(5);

    // @ts-expect-error
    () => noSearch();
    () => noSearch({ id: '5' });
    // @ts-expect-error
    () => noSearch({ id: '5', userId: 'hi' });
    // @ts-expect-error
    () => noSearch(5);
  };
  // path: string
  () => {
    const optionalUndefSearch = new RestEndpoint({
      path: '' as string,
      searchParams: {} as
        | {
            userId?: string | number;
          }
        | undefined,
    });
    const optionalSearch = new RestEndpoint({
      path: '' as string,
      searchParams: {} as {
        userId?: string | number;
      },
    });
    const undef = new RestEndpoint({
      path: '' as string,
      searchParams: undefined,
    });
    const requiredSearch = new RestEndpoint({
      path: '' as string,
      searchParams: {} as {
        userId: string | number;
      },
    });
    const noSearch = new RestEndpoint({
      path: '' as string,
    });
    () => optionalUndefSearch();
    () => optionalUndefSearch({});
    () => optionalUndefSearch({ id: '5' });
    () => optionalUndefSearch({ userId: 'hi' });
    () => optionalUndefSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => optionalUndefSearch(5);
    // @ts-expect-error
    () => optionalUndefSearch({ userId: 'hi' }, { userId: 'hi' });

    () => optionalSearch();
    () => optionalSearch({});
    () => optionalSearch({ id: '5' });
    () => optionalSearch({ userId: 'hi' });
    () => optionalSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => optionalSearch(5);
    // @ts-expect-error
    () => optionalSearch({ userId: 'hi' }, { userId: 'hi' });

    // @ts-expect-error
    () => requiredSearch();
    // @ts-expect-error
    () => requiredSearch({});
    // @ts-expect-error
    () => requiredSearch({ id: '5' });
    () => requiredSearch({ userId: 'hi' });
    () => requiredSearch({ userId: 'hi', id: '5' });
    // @ts-expect-error
    () => requiredSearch(5);
    // @ts-expect-error
    () => requiredSearch({ userId: 'hi' }, { userId: 'hi' });

    () => undef();
    () => undef({});
    () => undef({ id: '5' });
    // @ts-expect-error
    () => undef(5);

    () => noSearch();
    () => noSearch({});
    () => noSearch({ id: '5' });
    () => noSearch({ userId: 'hi' });
    // @ts-expect-error
    () => noSearch(5);
  };
});

it('should handle POST getter endpoints', () => {
  () => {
    const getUsers = new RestEndpoint({
      path: '/users',
      method: 'POST',
      sideEffect: false,
      body: {} as {
        page?: number;
        jsonrpc: string;
        id: number;
        method: string;
        params: any[];
      },
      paginationField: 'page',
      schema: new Collection([User]),
    });
    getUsers({ jsonrpc: '2.0', id: 1, method: 'users.get', params: [] });
    useSuspense(getUsers, {
      jsonrpc: '2.0',
      id: 1,
      method: 'users.get',
      params: [],
    });
    // @ts-expect-error
    getEth({ id: 1, method: 'users.get', params: [] });
    // @ts-expect-error
    useSuspense(getUsers, { id: 1, method: 'users.get', params: [] });

    // getPage tests
    getUsers.getPage({
      page: 2,
      jsonrpc: '2.0',
      id: 1,
      method: 'users.get',
      params: [],
    });
    getUsers.getPage({
      // @ts-expect-error page is not a number | string
      page: { bob: 'hi' },
      jsonrpc: '2.0',
      id: 1,
      method: 'users.get',
      params: [],
    });
    getUsers.getPage({
      // @ts-expect-error page is not a number | string
      page: undefined,
      jsonrpc: '2.0',
      id: 1,
      method: 'users.get',
      params: [],
    });
    // @ts-expect-error
    getUsers.getPage({
      jsonrpc: '2.0',
      id: 1,
      method: 'users.get',
      params: [],
    });
    // @ts-expect-error
    getUsers.getPage({
      page: 2,
      id: 1,
      method: 'users.get',
      params: [],
    });
    getUsers.getPage(
      { page: 2 },
      // @ts-expect-error
      { jsonrpc: '2.0', id: 1, method: 'users.get', params: [] },
    );
  };
  () => {
    const getArticles = new RestEndpoint({
      path: '/articles',
      method: 'POST',
      sideEffect: false,
      searchParams: {} as {
        page_number?: number;
        groupId?: string | number;
      },
      body: {} as
        | {
            authorId?: string | number;
            createdAt?: string;
          }
        | undefined,
      schema: new Collection([Article]),
      paginationField: 'page_number',
    });
    getArticles({ authorId: 1, createdAt: '2025-01-01' });
    useSuspense(getArticles, { authorId: 1, createdAt: '2025-01-01' });
    // @ts-expect-error
    getArticles({ authorId: 1, createdAt: '2025-01-01', page: 2 });
    // @ts-expect-error
    useSuspense(getArticles, { authorId: 1, createdAt: '2025-01-01', page: 2 });
    getArticles();
    getArticles({ page_number: 2 });
    getArticles({ page_number: 2 }, { authorId: 5 });

    getArticles.getPage({ page_number: 2 });
    getArticles.getPage({ page_number: 2, groupId: 5 });
    getArticles.getPage({ page_number: 2 }, { authorId: 5 });
    getArticles.getPage(
      { page_number: 2 },
      { authorId: 5, createdAt: '2025-01-01' },
    );

    // @ts-expect-error requires page_number
    getArticles.getPage();
    // @ts-expect-error requires page_number
    getArticles.getPage({});
    // @ts-expect-error requires page_number
    getArticles.getPage({ groupId: 5 });
    // @ts-expect-error page_number is not a valid search param
    getArticles.getPage({ page: 5 });
    // @ts-expect-error page is not page_number
    getArticles.getPage({ page: 5 });
    // @ts-expect-error adsdf is not a valid search param
    getArticles.getPage({ page_number: 2, adsdf: 5 });
  };
  () => {
    const getArticles = new RestEndpoint({
      path: '/articles/:groupId?',
      method: 'POST',
      sideEffect: false,
      body: {} as
        | {
            authorId?: string | number;
            createdAt?: string;
          }
        | undefined,
      schema: new Collection([Article]),
      paginationField: 'page_number',
    });
    getArticles({ authorId: 1, createdAt: '2025-01-01' });
    useSuspense(getArticles, { authorId: 1, createdAt: '2025-01-01' });
    // @ts-expect-error
    getArticles({ authorId: 1, createdAt: '2025-01-01', page: 2 });
    // @ts-expect-error
    useSuspense(getArticles, { authorId: 1, createdAt: '2025-01-01', page: 2 });
    getArticles();

    getArticles.getPage({ page_number: 2 });
    getArticles.getPage({ page_number: 2, groupId: 5 });
    getArticles.getPage({ page_number: 2 }, { authorId: 5 });
    getArticles.getPage(
      { page_number: 2 },
      { authorId: 5, createdAt: '2025-01-01' },
    );

    // @ts-expect-error requires page_number
    getArticles.getPage();
    // @ts-expect-error requires page_number
    getArticles.getPage({});
    // @ts-expect-error requires page_number
    getArticles.getPage({ groupId: 5 });
    // @ts-expect-error page_number is not a valid search param
    getArticles.getPage({ page: 5 });
    // @ts-expect-error page is not page_number
    getArticles.getPage({ page: 5 });
    // @ts-expect-error adsdf is not a valid search param
    getArticles.getPage({ page_number: 2, adsdf: 5 });
  };
});

it('should allow sideEffect overrides', () => {
  () => {
    const getEth = new RestEndpoint({
      urlPrefix: 'https://rpc.ankr.com',
      path: '/eth',
      method: 'POST',
      body: {} as {
        jsonrpc: string;
        id: number;
        method: string;
        params: any[];
      },
      pollFrequency: 30 * 1000,
      sideEffect: undefined,
    });
    const getEthExtend = new RestEndpoint({
      urlPrefix: 'https://rpc.ankr.com',
      path: '/eth',
      method: 'POST',
      body: {} as {
        jsonrpc: string;
        id: number;
        method: string;
        params: any[];
      },
      pollFrequency: 30 * 1000,
    }).extend({ sideEffect: undefined });

    const a: undefined = getEth.sideEffect;
    const b: undefined = getEthExtend.sideEffect;
    () => {
      const ctrl = useController();
      ctrl.fetch(getEth, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      useSuspense(getEth, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      ctrl.fetch(getEth, {
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      useSuspense(getEth, {
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      useSuspense(getEth, {
        jsonrpc: '2.0',
        id: 1,
        method: 6,
        params: ['latest', true],
      });
      useSuspense(
        getEth,
        // @ts-expect-error
        {},
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
        },
      );
    };
    () => {
      const ctrl = useController();
      ctrl.fetch(getEthExtend, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      useSuspense(getEthExtend, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      ctrl.fetch(getEthExtend, {
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      useSuspense(getEthExtend, {
        id: 1,
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
      });
      // @ts-expect-error
      useSuspense(getEthExtend, {
        jsonrpc: '2.0',
        id: 1,
        method: 6,
        params: ['latest', true],
      });
      useSuspense(
        getEthExtend,
        // @ts-expect-error
        {},
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
        },
      );
    };
  };
});

it('should preserve sideEffect: false when overriding method: POST', () => {
  () => {
    // Test constructor with sideEffect: false and method: POST
    const postGetter = new RestEndpoint({
      path: '/api/search',
      method: 'POST',
      sideEffect: false,
      body: {} as {
        query: string;
        filters?: Record<string, any>;
      },
      schema: new Collection([User]),
    });

    // sideEffect is explicitly false, not true or undefined
    const sideEffectType: false = postGetter.sideEffect;
    // @ts-expect-error
    const notTrue: true = postGetter.sideEffect;
    // @ts-expect-error
    const notUndef: undefined = postGetter.sideEffect;

    // Should work with useSuspense (requires sideEffect: false | undefined)
    useSuspense(postGetter, {
      query: 'test',
      filters: { status: 'active' },
    });
    useSuspense(postGetter, {
      query: 'test',
    });

    // Test extend preserves sideEffect: false
    const extended = postGetter.extend({
      path: '/api/search/:category',
    });
    const extendedSideEffectType: false = extended.sideEffect;
    // @ts-expect-error
    const extendedNotTrue: true = extended.sideEffect;
    // @ts-expect-error
    const extendedNotUndef: undefined = extended.sideEffect;

    // Extended endpoint should also work with useSuspense
    useSuspense(extended, { category: 'users' }, { query: 'test' });

    // Test extend with additional options preserves sideEffect: false
    const extendedWithOptions = postGetter.extend({
      searchParams: {} as { page?: number },
      body: {} as {
        query: string;
        filters?: Record<string, any>;
        sort?: string;
      },
    });
    const extendedWithOptionsSideEffectType: false =
      extendedWithOptions.sideEffect;
    // @ts-expect-error
    const extendedWithOptionsNotTrue: true = extendedWithOptions.sideEffect;

    // Should work with useSuspense
    useSuspense(extendedWithOptions, {
      query: 'test',
      sort: 'name',
    });
    useSuspense(extendedWithOptions, { page: 1 }, { query: 'test' });

    // Test chained extend preserves sideEffect: false
    const chainedExtended = postGetter
      .extend({
        path: '/api/search/:category',
      })
      .extend({
        searchParams: {} as { page?: number },
      });
    const chainedSideEffectType: false = chainedExtended.sideEffect;
    // @ts-expect-error
    const chainedNotTrue: true = chainedExtended.sideEffect;

    // Should work with useSuspense
    useSuspense(
      chainedExtended,
      { category: 'users', page: 1 },
      { query: 'test' },
    );
  };
  () => {
    // Test constructor with sideEffect: false and method: POST, no body
    const postGetterNoBody = new RestEndpoint({
      path: '/api/ping',
      method: 'POST',
      sideEffect: false,
      schema: User,
    });

    const sideEffectType: false = postGetterNoBody.sideEffect;
    useSuspense(postGetterNoBody);

    // Test extend preserves sideEffect: false
    const extendedNoBody = postGetterNoBody.extend({
      path: '/api/ping/:id',
    });
    const extendedNoBodySideEffectType: false = extendedNoBody.sideEffect;
    useSuspense(extendedNoBody, { id: '123' });
  };
  () => {
    // Test that sideEffect: false can be set via extend on a POST endpoint
    const basePost = new RestEndpoint({
      path: '/api/data',
      method: 'POST',
      body: {} as { data: string },
      schema: User,
    });

    // Base POST should have sideEffect: true
    const baseSideEffectType: true = basePost.sideEffect;
    // @ts-expect-error - useSuspense requires sideEffect: false | undefined
    useSuspense(basePost, { data: 'test' });

    // Extend with sideEffect: false should override
    const overridden = basePost.extend({
      sideEffect: false,
    });
    const overriddenSideEffectType: false = overridden.sideEffect;
    // @ts-expect-error
    const overriddenNotTrue: true = overridden.sideEffect;

    // Should now work with useSuspense
    useSuspense(overridden, { data: 'test' });

    // Test that further extends preserve sideEffect: false
    const furtherExtended = overridden.extend({
      path: '/api/data/:id',
    });
    const furtherExtendedSideEffectType: false = furtherExtended.sideEffect;
    useSuspense(furtherExtended, { id: '123' }, { data: 'test' });
  };
});

it('should handle more open ended type definitions', () => {
  () => {
    const unknownParams = new RestEndpoint({
      path: '' as `${string}:${string}`,
    });

    unknownParams({ hi: 5 });
    unknownParams();
    // @ts-expect-error
    unknownParams(5);

    const explicit: GetEndpoint<{
      path: `${string}:${string}`;
      schema: schema.Collection<[typeof User]>;
    }> = new RestEndpoint({
      path: '' as `${string}:${string}`,
      schema: new Collection([User]),
    });
    explicit({ hi: 5 });
    explicit.push.process({} as any, { hi: 5 });
    explicit.push();
  };
});

() => {
  const getThing = new RestEndpoint({
    path: '/:id*:bob',
  });

  getThing({ id: 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ id: 'hi' });
  // @ts-expect-error
  getThing({ bob: 'hi' });
  // @ts-expect-error
  getThing(5);
};
() => {
  const getThing = new RestEndpoint({
    path: '/:id+:bob',
  });

  getThing({ id: 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ 'id+': 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ id: 'hi' });
  // @ts-expect-error
  getThing({ bob: 'hi' });
  // @ts-expect-error
  getThing(5);
};
() => {
  const getThing = new RestEndpoint({
    path: '/:id\\+:bob',
  });

  getThing({ id: 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ 'id+': 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ id: 'hi' });
  // @ts-expect-error
  getThing({ bob: 'hi' });
  // @ts-expect-error
  getThing(5);
};
() => {
  const getThing = new RestEndpoint({
    path: '/:id:bob+',
  });

  getThing({ id: 5, bob: 'hi' });
  // @ts-expect-error
  getThing({ id: 5, 'bob+': 'hi' });
  // @ts-expect-error
  getThing({ id: 'hi' });
  // @ts-expect-error
  getThing({ bob: 'hi' });
  // @ts-expect-error
  getThing(5);
};
() => {
  const getThing = new RestEndpoint({
    path: '/:foo/(.*)',
  });

  getThing({ foo: 'hi' });
  // @ts-expect-error
  getThing({});
  // @ts-expect-error
  getThing({ id: 'hi' });
  // @ts-expect-error
  getThing(5);
};
() => {
  const getThing = new RestEndpoint({
    path: '/:attr1?{-:attr2}?{-:attr3}?',
  });

  getThing({ attr1: 'hi' });
  getThing({ attr2: 'hi' });
  getThing({ attr3: 'hi' });
  getThing({ attr1: 'hi', attr3: 'ho' });
  getThing({ attr2: 'hi', attr3: 'ho' });
  getThing({});
  // @ts-expect-error
  getThing({ random: 'hi' });
  // @ts-expect-error
  getThing(5);
};
