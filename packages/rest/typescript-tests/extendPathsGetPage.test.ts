// Type-level regression tests for RestEndpoint extend(), paginated(), resource() and
// path parameters. Each @ts-expect-error line must keep erroring; plain lines must keep compiling.
import { useSuspense, useController } from '@data-client/react';

import {
  Entity,
  resource,
  RestEndpoint,
  RestGenerics,
  RestInstanceBase,
  PathArgs,
  PathKeys,
  ShortenPath,
  Collection,
} from '@data-client/rest';

export function useTypeProbes() {
  class User extends Entity {
    id = '';
    name = '';
    static key = 'User';
  }
  class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
    custom = 5;
    method2(x: number): string {
      return '';
    }

    optProp?: string;
  }
  const my = new MyEndpoint({ path: '/my/:id', schema: User });
  const ep = new RestEndpoint({ path: '/a/:b{/:c}/*d', schema: User });
  const epNo = new RestEndpoint({ path: '/a', schema: new Collection([User]) });

  // ---- extend(): options typing (RestEndpointExtendOptions / PartialPick of extra members)
  // @ts-expect-error extra member must keep its type
  my.extend({ custom: 'str' });
  my.extend({
    // @ts-expect-error
    method2(x: string) {
      return 5;
    },
  });
  // @ts-expect-error
  my.extend({ optProp: 5 });
  // @ts-expect-error chained keeps extra member type
  my.extend({ custom: 6 }).extend({ custom: 'x' });
  // @ts-expect-error
  ep.extend({ dataExpiryLength: 'x' });
  // @ts-expect-error ContentSchemaGuard
  ep.extend({ content: 'blob', schema: User });
  ep.extend({
    // @ts-expect-error
    getOptimisticResponse(snap, params: { zzz: number }) {
      return params;
    },
  });
  ep.extend({
    // @ts-expect-error
    key(params: { nope: string }) {
      return '';
    },
  });
  // @ts-expect-error
  ep.extend({ urlPrefix: 5 });

  // ---- extend(): result typing (RestExtendedEndpoint Omit<O>/Omit<E> parts)
  const x5 = ep.extend({ dataExpiryLength: 5, custom: 'hi' as const });
  // @ts-expect-error O's extra member kept with its type
  const n5: number = x5.custom;
  const my2 = my.extend({ dataExpiryLength: 1 });
  // @ts-expect-error E's extra member kept with its type
  const s2: string = my2.custom;
  // @ts-expect-error
  const m2: number = my2.method2(1);
  const my3 = my.extend({ path: '/z/:q', custom: 7 as const });
  // @ts-expect-error O overrides E member
  const c3: 8 = my3.custom;
  // @ts-expect-error
  const p1: '/wrong' = ep.extend({ path: '/z/:q' }).path;
  // @ts-expect-error new path params
  ep.extend({ path: '/z/:q' })({ b: '1' });
  ep.extend({ method: 'POST', body: {} as { a: number } })(
    { b: '1', d: ['x'] },
    // @ts-expect-error body type
    { a: 'x' },
  );
  const x6 = x5.extend({ path: '/p/:p' });
  // @ts-expect-error
  x6({ b: 'x' });
  // @ts-expect-error
  const n6: number = x6.custom;

  // ---- path parsing (PathKeys / PathArgs)
  // @ts-expect-error d required (string[])
  useSuspense(ep, { b: 'x' });
  // @ts-expect-error wildcard is string[]
  useSuspense(ep, { b: 'x', d: 'y' });
  // @ts-expect-error excess
  useSuspense(ep, { b: 'x', d: ['y'], zz: 1 });
  // @ts-expect-error escaped ':' is not a param
  const pa1: PathArgs<'/a\\:b/:c'> = { b: 1, c: 1 };
  // @ts-expect-error b required
  const pa2: PathArgs<'/a/:b{/:c}'> = { c: 1 };
  // @ts-expect-error '@' ends token
  const pa3: PathArgs<'/a/:b@c/:d'> = { b: 1, 'b@c': 1, d: 1 };
  // @ts-expect-error g required
  const pa4: PathArgs<'/a/:b;:c,:d!:e%:f&:g'> = {
    b: 1,
    c: 1,
    d: 1,
    e: 1,
    f: 1,
  };
  const pa5: PathArgs<'/files/*rest/:x{/*opt}'> = {
    rest: ['a'],
    x: 1,
    // @ts-expect-error opt is string[]
    opt: 'no',
  };
  // @ts-expect-error quotes stripped
  const pa6: PathArgs<'/a/:"quoted"'> = { '"quoted"': 1 };
  // @ts-expect-error
  const pk2: PathKeys<'/a/:b{/:c}/*d'> = 'c';
  // @ts-expect-error '.' is not a delimiter
  const pk3: PathKeys<'/x/:id.json'> = 'id';
  // @ts-expect-error
  const pk4: PathKeys<'::a'> = 'b';
  // @ts-expect-error keeps trailing '/'
  const sp1: ShortenPath<'/a/:b/:c'> = '/a/:b';
  const ctrl = useController();
  // @ts-expect-error GET endpoint takes no body
  ctrl.fetch(my2, { id: 5 }, {});
  // @ts-expect-error
  ctrl.fetch(epNo.push, { name: 5 });

  // ---- getPage (PaginationFieldEndpoint over F & {schema, sideEffect} & O)
  const PostResource = resource({
    path: '/groups/:group/posts/:id',
    schema: User,
    searchParams: {} as { q?: string } | undefined,
    paginationField: 'cursor',
  });
  // @ts-expect-error cursor required
  ctrl.fetch(PostResource.getList.getPage, { group: 'g' });
  // @ts-expect-error
  ctrl.fetch(PostResource.getList.getPage, { group: 'g', cursor: ['x'] });
  // @ts-expect-error group required
  ctrl.fetch(PostResource.getList.getPage, { cursor: 'x' });
  ctrl.fetch(
    PostResource.getList.getPage,
    // @ts-expect-error body is Partial<User>
    { group: 'g', cursor: 'x' },
    { name: 5 },
  );
  const ExtList = PostResource.extend(Base => ({
    getList: Base.getList.extend({ dataExpiryLength: 5 }),
  }));
  // @ts-expect-error
  ctrl.fetch(ExtList.getList.getPage, { group: 'g' });
  // @ts-expect-error returns User[]
  const sGet: string = useSuspense(PostResource.getList.getPage, {
    group: 'g',
    cursor: 'x',
  });
}
