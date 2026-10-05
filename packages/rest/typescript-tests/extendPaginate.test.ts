// Type-level regression tests for RestEndpoint extend(), paginated(), resource() and
// path parameters. Each @ts-expect-error line must keep erroring; plain lines must keep compiling.
import { useSuspense, useController } from '@data-client/react';

import { RestEndpoint, Entity, resource } from '@data-client/rest';

export class P extends Entity {
  id = '';
  a = '';
  static key = 'P';
}

export const ep = new RestEndpoint({
  path: '/org/:org/repo/:repo{/:sub}',
  schema: P,
  searchParams: {} as { page?: number },
  custom: 5,
});
export const epPost = new RestEndpoint({
  path: '/org/:org',
  method: 'POST',
  body: {} as { a: string },
  schema: P,
});

/* ---------------- extend() ---------------- */
// result uses the NEW path
export const ex1 = ep.extend({ path: '/other/:a/:b' });
// literal path/method are preserved (these lines error only while the literal is kept)
// @ts-expect-error
export const lit1: string extends typeof ex1.path ? 1 : 2 = 1;
export const ex1m = ep.extend({ method: 'POST', body: {} as { a: string } });
// @ts-expect-error
export const lit2: string extends typeof ex1m.method ? 1 : 2 = 1;
// content guard: binary content must not carry a schema
// @ts-expect-error
export const ex2 = ep.extend({ content: 'blob', schema: P });
// option types still checked
// custom members from the original endpoint are typed (Partial<Omit<E,...>>)
export const ex4 = ep.extend({ custom: 'not a number' });
// process return type flows to the resolve type
export const ex5 = ep.extend({
  process(v, params) {
    return 5;
  },
});
// `this` constraint of extend still applies
// @ts-expect-error
export const ex7 = ep.extend.call({}, {});
// extend that only changes options keeps the original path arguments
export const ex8 = ep.extend({ dataExpiryLength: 5 });
// chained extend keeps the intermediate path/body
export const ex9 = ep
  .extend({ path: '/other/:a', method: 'POST', body: {} as { a: string } })
  .extend({ dataExpiryLength: 5 });

/* ---------------- paginated() ---------------- */
export const pg = ep.paginated('cursor');
// @ts-expect-error (only GET endpoints)
export const pgBad = epPost.paginated('cursor');
// @ts-expect-error
export const pgBad2 = ep.paginated(5);
export const pgFn = ep.paginated(
  ({
    cursor,
    ...rest
  }: {
    cursor: string;
    org: string;
    repo: string;
    sub?: string;
  }) => [rest] as const,
);
export const pgFnBad = ep.paginated(
  // @ts-expect-error
  ({ cursor }: { cursor: string }) => [{ nope: 1 }] as const,
);

export function useProbes() {
  const ctrl = useController();
  useSuspense(ex1, { a: '1', b: '2' });
  // @ts-expect-error
  useSuspense(ex1, { org: '1', repo: '2' });
  ctrl.fetch(ex1m, { org: '1', repo: '2' }, { a: 'x' });
  // @ts-expect-error
  ctrl.fetch(ex1m, { org: '1', repo: '2' }, { b: 'x' });
  // @ts-expect-error
  ctrl.fetch(ex1m, { org: '1', repo: '2' });
  // @ts-expect-error
  ctrl.fetch(ex8, { wrong: 1 });
  ctrl.fetch(ex9, { a: '1' }, { a: 'x' });
  // @ts-expect-error
  ctrl.fetch(ex9, { org: '1', repo: '2' }, { a: 'x' });
  // @ts-expect-error (cursor required)
  ctrl.fetch(pg, { org: '1', repo: '2' });
  ctrl.fetch(pg, { org: '1', repo: '2', cursor: 'c' });
  ctrl.fetch(pgFn, { org: '1', repo: '2', cursor: 'c' });
  // @ts-expect-error
  ctrl.fetch(pgFn, { org: '1', repo: '2' });
  const r5 = useSuspense(ex5, { org: '1', repo: '2' });
  // @ts-expect-error (process returned number)
  const s5: string = r5;
}

/* ---------------- resource() ---------------- */
export const R = resource({
  path: '/r/:id',
  schema: P,
  searchParams: {} as { q?: string },
});
export function useResourceProbes() {
  const ctrl = useController();
  useSuspense(R.get, { id: 1 });
  // @ts-expect-error
  useSuspense(R.get, { idx: 1 });
  useSuspense(R.getList, { q: 'x' });
  // @ts-expect-error
  useSuspense(R.getList, { z: 'x' });
  ctrl.fetch(R.update, { id: 1 }, { a: 'x' });
  // @ts-expect-error
  ctrl.fetch(R.update, { id: 1 }, { a: 5 });
  // @ts-expect-error
  ctrl.fetch(R.partialUpdate, { id: 1 }, { zz: 'x' });
  ctrl.fetch(R.getList.push, { a: 'x' });
  // @ts-expect-error
  ctrl.fetch(R.getList.push, { a: 5 });
  ctrl.fetch(R.delete, { id: 1 });
  // @ts-expect-error
  ctrl.fetch(R.delete, { id: 1 }, { a: 'x' });
  const ext = R.get.extend({ path: '/r/:id/:sub' });
  // @ts-expect-error (sub required)
  ctrl.fetch(ext, { id: 1 });
  ctrl.fetch(ext, { id: 1, sub: 'x' });
}

/* ---------------- path template parsing (PathKeys / KeysToArgs) ---------------- */
export const pth1 = new RestEndpoint({
  path: '/a/:id{/:sub}/*rest\\:lit/:x,:y;:z',
  schema: P,
});
export const pthEsc = new RestEndpoint({
  path: '/esc/\\:notkey/:key',
  schema: P,
});
export const pthWild = new RestEndpoint({ path: '/w/*rest/:tail', schema: P });
export function usePathProbes() {
  const ctrl = useController();
  // all keys present (sub optional), wildcard is a string[]
  ctrl.fetch(pth1, { id: 1, rest: ['a'], x: 'x', y: 'y', z: 'z' });
  ctrl.fetch(pth1, { id: 1, sub: 's', rest: ['a'], x: 'x', y: 'y', z: 'z' });
  // @ts-expect-error wildcard must be string[]
  ctrl.fetch(pth1, { id: 1, rest: 'a', x: 'x', y: 'y', z: 'z' });
  // @ts-expect-error missing z
  ctrl.fetch(pth1, { id: 1, rest: ['a'], x: 'x', y: 'y' });
  // @ts-expect-error escaped segment is not a key
  ctrl.fetch(pth1, { id: 1, rest: ['a'], x: 'x', y: 'y', z: 'z', lit: 1 });
  ctrl.fetch(pth1, {
    id: 1,
    rest: ['a'],
    x: 'x',
    y: 'y',
    z: 'z',
    sub: 5,
    // @ts-expect-error extra key
    extra: 1,
  });
  ctrl.fetch(pthEsc, { key: 'k' });
  // @ts-expect-error
  ctrl.fetch(pthEsc, { key: 'k', notkey: 'n' });
  // @ts-expect-error missing key
  ctrl.fetch(pthEsc, {});
  ctrl.fetch(pthWild, { rest: ['a', 'b'], tail: 't' });
  // @ts-expect-error missing tail
  ctrl.fetch(pthWild, { rest: ['a', 'b'] });
  // @ts-expect-error missing rest
  ctrl.fetch(pthWild, { tail: 't' });
  ctrl.fetch(ep, { org: 'o', repo: 'r' });
  ctrl.fetch(ep, { org: 'o', repo: 'r', sub: 's', page: 1 });
  // @ts-expect-error missing repo
  ctrl.fetch(ep, { org: 'o' });
  // @ts-expect-error sub must be string | number
  ctrl.fetch(ep, { org: 'o', repo: 'r', sub: true });
}
