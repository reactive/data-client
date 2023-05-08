import { Entity, schema } from '@rest-hooks/endpoint';
import { User } from '__tests__/new';

import createResource from '../createResource';
import {
  KeysToArgs,
  PathArgs,
  PathArgsAndSearch,
  PathKeys,
  ShortenPath,
} from '../pathTypes';
import RestEndpoint, { GetEndpoint, NewGetEndpoint } from '../RestEndpoint';
import { RequiredKeys } from '../utiltypes';

describe('PathArgs', () => {
  it('should infer types', () => {
    type C =
      'http\\://test.com/groups/:group?/\\:blah/users/:id?:extra?/:next\\?bob/:last';
    function A(args: PathArgs<C>) {}
    // @ts-expect-error
    () => A({});
    () => A({ next: 'hi', last: 'ho' });
    // @ts-expect-error
    () => A({ next: 'hi', last: 'ho', doesnotexist: 'hi' });
    // @ts-expect-error
    () => A({ next: 'hi', last: 'ho', blah: 'hi' });
    () => A({ next: 'hi', last: 'ho', id: '5', group: 'whatever' });
    () => A({ next: 'hi', last: 'ho', extra: '5', group: 'whatever' });
  });

  it('should infer types2', () => {
    type C = 'http\\://test.com/article-cooler/:id?:title?';
    function A(args: PathArgs<C>) {}
    () => A({});
    () => A({ id: 'ho' });
    () => A({ title: 'ho' });
    () => A({ id: 'ho', title: 'ho' });
    // @ts-expect-error
    () => A({ idasd: 'ho' });
    // @ts-expect-error
    () => A({ next: 'hi', title: 'ho', id: 'hi' });
    // @ts-expect-error
    () => A(5);
  });

  it('should be flexible for string type', () => {
    class Parent {
      constructor() {}
      A(args: PathArgs<string>) {
        const b = args['hi'];
      }
    }
    class Child extends Parent {
      A(args: { item: string }) {}
    }
    const thing = new Parent();
    () => thing.A({});
    () => thing.A({ next: 'hi', last: 'ho' });
    const thing2 = new Child();
    //@ts-expect-error
    () => thing2.A({});
    () => thing2.A({ item: 'win' });
  });

  it('works with no arguments', () => {
    const a: GetEndpoint<PathArgs<'http\\://test.com/article-cooler/'>> =
      0 as any;
    () => a();
    //@ts-expect-error
    () => a({ page: '5' });
    //@ts-expect-error
    () => a({ sdf: '5' });
    //@ts-expect-error
    () => a(5);
  });

  it('works when combining with known types', () => {
    const a: GetEndpoint<
      PathArgs<ShortenPath<'/hi'>> & { page: string | number }
    > = 0 as any;
    () => a({ page: '5' });
    //@ts-expect-error
    () => a({ sdf: '5' });
    //@ts-expect-error
    () => a({ page: '5' }, { hi: '5' });
    //@ts-expect-error
    () => a();
  });

  it('works with unions of non-intersecting types', () => {
    const a: GetEndpoint<{ id: string | number } | { title: string | number }> =
      0 as any;
    () => a({ id: '5' });
    () => a({ title: '5' });
    // @ts-expect-error
    () => a({ id: '5', title: '5' });
    // @ts-expect-error
    () => a({ id: '5', sdfds: '5' });
    //@ts-expect-error
    () => a({ sdf: '5' });
    //@ts-expect-error
    () => a({ page: '5' }, { hi: '5' });
    //@ts-expect-error
    () => a();
  });

  it('works with optional positional args', () => {
    const a: GetEndpoint<undefined | { cursor?: string | number }> = 0 as any;
    () => a();
    () => a({});
    () => a({ cursor: 5 });
    // @ts-expect-error
    () => a({ id: '5' });
    //@ts-expect-error
    () => a({ cursor: '5' }, { cursor: '5' });
  });

  it('searchParams', () => {
    const a: GetEndpoint<undefined | { cursor?: string | number }> = 0 as any;
    () => a();
    () => a({});
    () => a({ cursor: 5 });
    // @ts-expect-error
    () => a({ id: '5' });
    //@ts-expect-error
    () => a({ cursor: '5' }, { cursor: '5' });
  });

  describe('PathArgsAndSearch', () => {
    it('works with required path member', () => {
      const a: GetEndpoint<
        PathArgsAndSearch<'http\\://test.com/groups/:group/users/'>
      > = 0 as any;
      () => a({ group: '5' });
      () => a({ group: '5', sdf: '5' });
      //@ts-expect-error
      () => a({ asdf: '5' });
      //@ts-expect-error
      () => a({});
      //@ts-expect-error
      () => a({ page: '5' }, { hi: '5' });
      //@ts-expect-error
      () => a();
    });
    it('works with no path members', () => {
      const a: NewGetEndpoint<{
        path: 'http\\://test.com/groups';
        searchParams: Record<string, number | string | boolean> | undefined;
      }> = 0 as any;
      /*const a: GetEndpoint<PathArgsAndSearch<'http\\://test.com/groups/'>> =
        0 as any;*/
      () => a({ group: '5' });
      () => a({ group: '5', sdf: '5' });
      () => a();
      () => a({ asdf: '5' });
      () => a({});
      //@ts-expect-error
      () => a({ page: '5' }, { hi: '5' });

      () => {
        const b = a.extend({
          searchParams: {} as { userId?: number | string } | undefined,
        });
        b({ userId: '5' });
        b();
        // @ts-expect-error
        b({ sdf: '5' });
      };
    });
  });
});

describe('RequiredKeys', () => {
  type Y = {
    opt?: string;
    bob: string;
    charles: number;
    [k: string]: string | number | undefined;
  };
  const a: Record<RequiredKeys<Y>, any> = 5 as any;
  () => a.bob;
  () => a.charles;
  // @ts-expect-error
  () => a.opt;
  // @ts-expect-error
  () => a.sdfsdf;
});

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

  const TodoResourceBase = createResource({
    path: '/todos/:id',
    schema: Todo,
  });
  TodoResourceBase.create.extend({
    searchParams: {} as { userId?: string | number } | undefined,
    getOptimisticResponse(snap, ...args) {
      return args[args.length - 1];
    },
  });
  TodoResourceBase.create
    .extend({
      schema: new schema.Collection([Todo], {
        argsKey(...args) {
          return { a: 5 };
        },
      }),
    })
    .extend({
      searchParams: {} as { userId?: string | number } | undefined,
      getOptimisticResponse(snap, ...args) {
        return args[args.length - 1];
      },
    });
});
