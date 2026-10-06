// Generates extreme-case type-checking fixtures for @data-client public types.
// usage: node scripts/typeperf/gen.mjs [scenario...]  (N=2 scales every fixture up)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import patheq from './patheq/gen.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'scenarios');
const N = Number(process.env.N ?? 1);
const scen = {};
const fields = (n, p = 'f') =>
  Array.from(
    { length: n },
    (_, i) => `  ${p}${i} = ${["''", '0', 'false'][i % 3]};`,
  ).join('\n');

// M-member Union `Un` and BIG-field Entity `Big`, shared by several fixtures
const M = 30;
const BIG = 300;
const unionDefs = () =>
  Array.from(
    { length: M },
    (_, i) =>
      `export class U${i} extends Entity {\n  id = '';\n  readonly type = 'u${i}' as const;\n${fields(15, `m${i}_`)}\n  static key = 'U${i}';\n}\n`,
  ).join('') +
  `export const Un = new schema.Union({ ${Array.from({ length: M }, (_, i) => `u${i}: U${i}`).join(', ')} }, 'type');\n`;
const bigDefs = () =>
  `export class Big extends Entity {\n  id = '';\n${fields(BIG)}\n  static key = 'Big';\n}\n`;

// 1. many resources + react hooks
scen.resources = () => {
  let s = `import { Entity, resource } from '@data-client/rest';
import { useSuspense, useController, useCache, useQuery, useLive, useDLE, useFetch } from '@data-client/react';
`;
  const R = 40 * N;
  for (let i = 0; i < R; i++) {
    s += `export class E${i} extends Entity {\n  id = '';\n${fields(20)}\n  static key = 'E${i}';\n}\n`;
    s += `export const R${i} = resource({ path: '/e${i}/:id', schema: E${i}, searchParams: {} as { q?: string } | undefined, paginationField: 'cursor' });\n`;
  }
  s += `export function useAll() {\n  const ctrl = useController();\n`;
  for (let i = 0; i < R; i++) {
    s += `  {
    const one = useSuspense(R${i}.get, { id: '1' });
    const list = useSuspense(R${i}.getList, { q: 'x' });
    const c = useCache(R${i}.getList);
    const d = useDLE(R${i}.get, { id: '1' });
    useFetch(R${i}.get, { id: '1' });
    const l = useLive(R${i}.getList);
    const s0: string = one.f0; const n1: number = list[0].f1;
    ctrl.fetch(R${i}.update, { id: '1' }, { f0: 'x' });
    ctrl.fetch(R${i}.partialUpdate, { id: '1' }, { f1: 5 });
    ctrl.fetch(R${i}.getList.push, { f0: 'y' });
    ctrl.fetch(R${i}.create, { f0: 'y' });
    ctrl.fetch(R${i}.create, new FormData());
    ctrl.fetch(R${i}.getList.getPage, { cursor: '2' });
    ctrl.fetch(R${i}.delete, { id: '1' });
    ctrl.set(E${i}, { id: '1' }, { f0: 'z' });
    ctrl.invalidate(R${i}.get, { id: '1' });
    const q = useQuery(R${i}.getList.schema, { q: 'x' });
    void s0, n1, c, d, l, q;
  }\n`;
  }
  s += `}\n`;
  return s;
};

// 2. 300-field entity
scen.bigEntity = () => {
  let s = `import { Entity, resource } from '@data-client/rest';
import { useSuspense, useController } from '@data-client/react';
${bigDefs()}export const BigResource = resource({ path: '/big/:id', schema: Big });
export function useBig() {\n  const ctrl = useController();\n`;
  for (let i = 0; i < 100 * N; i++) {
    s += `  { const b = useSuspense(BigResource.get, { id: '${i}' }); const x: string = b.f${(i * 3) % BIG}; ctrl.fetch(BigResource.partialUpdate, { id: '${i}' }, { f${(i * 3) % BIG}: 'a' }); ctrl.set(Big, { id: '${i}' }, { f${(i * 3) % BIG}: 'b' }); void x; }\n`;
  }
  return s + '}\n';
};

// 3. 30-member Union, Collection of union, Values, nested
scen.union = () => {
  let s = `import { Entity, schema, Collection, RestEndpoint } from '@data-client/rest';
import { useSuspense, useController } from '@data-client/react';
${unionDefs()}export const getFeed = new RestEndpoint({ path: '/feed', schema: new Collection([Un]) });
export const getOne = new RestEndpoint({ path: '/feed/:id', schema: Un });
export const getVals = new RestEndpoint({ path: '/vals', schema: new schema.Values(Un) });
export const getObj = new RestEndpoint({ path: '/obj', schema: { feed: [Un], extra: new schema.Values(Un), nested: { a: Un } } });
export function useU() {\n  const ctrl = useController();\n`;
  for (let i = 0; i < 50 * N; i++)
    s += `  { const f = useSuspense(getFeed); const o = useSuspense(getOne, { id: '${i}' }); const v = useSuspense(getVals); const ob = useSuspense(getObj);
    const t: string = f[0].type; if (o.type === 'u${i % M}') { const z = o.m${i % M}_0; void z; } void v, ob, t;
    ctrl.fetch(getFeed.push, { type: 'u${i % M}', m${i % M}_0: 'x' } as any);
    ctrl.set(getFeed.schema, [{ id: '1', type: 'u${i % M}' }]); }\n`;
  return s + '}\n';
};

// 4. path params / endpoint extension chains
scen.paths = () => {
  let s = `import { RestEndpoint, Entity } from '@data-client/rest';
import { useSuspense, useController } from '@data-client/react';
export class P extends Entity { id = ''; a = ''; static key = 'P'; }
`;
  for (let i = 0; i < 150 * N; i++) {
    s += `export const ep${i} = new RestEndpoint({ path: '/org/:org${i}/repo/:repo/issues/:issue/comments/:comment{/:sub}/x/:y', schema: P, searchParams: {} as { page?: number } });
export const ep${i}b = ep${i}.extend({ path: '/other/:a/:b/:c', method: 'POST', body: {} as { a: string } }).extend({ dataExpiryLength: 5 });
export const ep${i}c = ep${i}.paginated('cursor');
`;
  }
  s += `export function useP() { const ctrl = useController();\n`;
  for (let i = 0; i < 150 * N; i++)
    s += `  useSuspense(ep${i}, { org${i}: 'a', repo: 'b', issue: 1, comment: 2, y: 'q', page: 1 }); ctrl.fetch(ep${i}b, { a: '1', b: '2', c: '3' }, { a: 'x' }); ctrl.fetch(ep${i}c, { org${i}: 'a', repo: 'b', issue: 1, comment: 2, y: 'q', cursor: 'n' });\n`;
  return s + '}\n';
};

// 5. deep nested relations + denormalize
scen.nested = () => {
  let s = `import { Entity, resource, schema, Collection } from '@data-client/rest';
import { useSuspense } from '@data-client/react';
import type { Denormalize, DenormalizeNullable, Normalize } from '@data-client/endpoint';
`;
  const D = 12;
  s += `export class L0 extends Entity { id = ''; v0 = ''; static key = 'L0'; }\n`;
  for (let d = 1; d < D; d++)
    s += `export class L${d} extends Entity { id = ''; v${d} = 0; child = L${d - 1}.fromJS(); kids: L${d - 1}[] = []; static key = 'L${d}'; static schema = { child: L${d - 1}, kids: [L${d - 1}], coll: new Collection([L${d - 1}]), map: new schema.Values(L${d - 1}) }; }\n`;
  s += `export const LR = resource({ path: '/l/:id', schema: L${D - 1} });
export function useL() {\n`;
  for (let i = 0; i < 60 * N; i++)
    s += `  { const x = useSuspense(LR.get, { id: '${i}' }); const v: string = x.${'child.'.repeat(D - 1)}v0; type A${i} = Denormalize<typeof LR.getList.schema>; type B${i} = Normalize<typeof LR.get.schema>; type C${i} = DenormalizeNullable<typeof L${(i % (D - 1)) + 1}.schema>; void v; }\n`;
  return s + '}\n';
};

// 6. vue composables
scen.vue = () => {
  let s = `import { Entity, resource } from '@data-client/rest';
import { useSuspense, useController, useCache, useQuery, useLive, useDLE, useFetch } from '@data-client/vue';
`;
  const R = 40 * N;
  for (let i = 0; i < R; i++) {
    s += `export class V${i} extends Entity {\n  id = '';\n${fields(20)}\n  static key = 'V${i}';\n}\n`;
    s += `export const VR${i} = resource({ path: '/v${i}/:id', schema: V${i}, searchParams: {} as { q?: string } | undefined });\n`;
  }
  s += `export async function setup() {\n  const ctrl = useController();\n`;
  for (let i = 0; i < R; i++)
    s += `  { const one = await useSuspense(VR${i}.get, { id: '1' }); const list = await useSuspense(VR${i}.getList, { q: 'x' }); const c = useCache(VR${i}.getList); const d = useDLE(VR${i}.get, { id: '1' }); useFetch(VR${i}.get, { id: '1' }); const l = await useLive(VR${i}.getList); const q = useQuery(VR${i}.getList.schema); ctrl.fetch(VR${i}.update, { id: '1' }, { f0: 'x' }); void one, list, c, d, l, q; }\n`;
  return s + '}\n';
};

// 7. Query/All/Scalar/Invalidate/Lazy grab bag, incl. Collections wrapped in Query/Lazy
scen.schemas = () => {
  let s = `import { Entity, resource, schema, Collection, Query, RestEndpoint } from '@data-client/rest';
import { useSuspense, useQuery, useController } from '@data-client/react';
`;
  for (let i = 0; i < 40 * N; i++) {
    s += `export class S${i} extends Entity { id = ''; a = 0; b = ''; static key = 'S${i}'; }
export const SR${i} = resource({ path: '/s${i}/:id', schema: S${i} });
export const all${i} = new schema.All(S${i});
export const q${i} = new Query(all${i}, (rows, { min }: { min?: number }) => rows.filter(r => r.a > (min ?? 0)));
export const inv${i} = new RestEndpoint({ path: '/s${i}/:id', method: 'DELETE', schema: new schema.Invalidate(S${i}) });
export const arr${i} = new RestEndpoint({ path: '/arr${i}', schema: new schema.Array(S${i}) });
export const obj${i} = new RestEndpoint({ path: '/obj${i}', schema: new schema.Object({ list: [S${i}], one: S${i}, coll: new Collection([S${i}], { argsKey: ({ g }: { g: string }) => ({ g }) }) }) });
export const sorted${i} = new RestEndpoint({ path: '/:g/sorted${i}', searchParams: {} as { by?: 'a' | 'b' }, schema: new Query(new Collection([S${i}], { nonFilterArgumentKeys: /by/ }), (rows, { by }: { by?: 'a' | 'b' } = {}) => (by ? [...rows].sort((x, y) => String(x[by]).localeCompare(String(y[by]))) : rows)) });
export const lazy${i} = new RestEndpoint({ path: '/lazy${i}', schema: new schema.Lazy(new Collection([S${i}])) });
`;
  }
  s += `export function useS() { const ctrl = useController();\n`;
  for (let i = 0; i < 40 * N; i++)
    s += `  { const r = useQuery(q${i}, { min: 2 }); const a = useQuery(all${i}); const o = useSuspense(obj${i}); const ar = useSuspense(arr${i}); ctrl.fetch(inv${i}, { id: '1' }); ctrl.set(all${i}, [{ id: '1', a: 1 }]); const so = useSuspense(sorted${i}, { g: 'x', by: 'a' }); ctrl.fetch(sorted${i}.push, { g: 'x' }, { a: 1 }); ctrl.fetch(sorted${i}.unshift, { g: 'x' }, { b: 'y' }); ctrl.fetch(sorted${i}.remove, { g: 'x' }, { id: '1' }); ctrl.fetch(lazy${i}.push, { a: 1 }); void r, a, o, ar, so; }\n`;
  return s + '}\n';
};

// 8. typical app: a handful of resources, extend/paginated, a plain Endpoint, components
scen.typical = () => {
  let s = `import { Entity, resource, RestEndpoint, Endpoint, schema } from '@data-client/rest';
import { useSuspense, useController, useCache, useDLE } from '@data-client/react';
export class User extends Entity { id = ''; name = ''; email = ''; static key = 'User'; }
export class Comment extends Entity { id = ''; body = ''; author = User.fromJS(); static key = 'Comment'; static schema = { author: User }; }
export class Article extends Entity { id = ''; title = ''; body = ''; author = User.fromJS(); comments: Comment[] = []; tags: string[] = []; static key = 'Article'; static schema = { author: User, comments: [Comment] }; }
export const UserResource = resource({ path: '/users/:id', schema: User });
export const ArticleResource = resource({ path: '/articles/:id', schema: Article, searchParams: {} as { tag?: string; page?: number } | undefined, paginationField: 'page' })
  .extend({ get: { dataExpiryLength: 60000 } })
  .extend('search', { path: '/articles/search', searchParams: {} as { q: string }, schema: new schema.Collection([Article]) });
export const CommentResource = resource({ path: '/articles/:articleId/comments/:id', schema: Comment, optimistic: true });
export const login = new RestEndpoint({ path: '/login', method: 'POST', body: {} as { email: string; password: string }, schema: User });
export const logout = login.extend({ path: '/logout', body: undefined, schema: undefined });
export const getStats = new Endpoint(async ({ id }: { id: string }) => ({ views: 1, id }), { key: ({ id }) => 'stats' + id });
export const slowStats = getStats.extend({ dataExpiryLength: 1000 });
export const paged = ArticleResource.getList.paginated('page');
`;
  for (let i = 0; i < 20 * N; i++) {
    s += `export function Comp${i}({ id }: { id: string }) {
  const ctrl = useController();
  const article = useSuspense(ArticleResource.get, { id });
  const list = useSuspense(ArticleResource.getList, { tag: 't${i}' });
  const found = useSuspense(ArticleResource.search, { q: 'x' });
  const cached = useCache(UserResource.get, { id: article.author.id });
  const { data } = useDLE(CommentResource.getList, { articleId: id });
  const st = useSuspense(getStats, { id });
  const t: string = article.title; const n: number = list.length + found.length + st.views;
  const onSave = () => ctrl.fetch(ArticleResource.partialUpdate, { id }, { title: 'x' });
  const onComment = () => ctrl.fetch(CommentResource.getList.push, { articleId: id }, { body: 'hi' });
  const onNext = () => ctrl.fetch(paged, { tag: 't${i}', page: 2 });
  const onLogin = () => ctrl.fetch(login, { email: 'a', password: 'b' });
  const onLogout = () => ctrl.fetch(logout);
  const onDel = () => ctrl.fetch(CommentResource.delete, { articleId: id, id: '1' });
  void t, n, cached, data, onSave, onComment, onNext, onLogin, onLogout, onDel;
  return null;
}
`;
  }
  return s;
};

// 9. #4133's set() cases: values and updaters on a 30-member Union, a Collection of it, and a 300-field Entity;
// and #4230's Invalidate rows, single and batch
const setHeader =
  () => `import { Entity, schema, Collection } from '@data-client/rest';
import { useController } from '@data-client/react';
${unionDefs()}export const Feed = new Collection([Un]);
${bigDefs()}export function useS() {
  const ctrl = useController();
`;
scen.setValues = () => {
  let s = setHeader();
  for (let i = 0; i < 333 * N; i++)
    s += `  ctrl.set(Un, { id: '${i}', type: 'u${i % M}' }, { id: '${i}', type: 'u${i % M}', m${i % M}_0: 'x' });
  ctrl.set(Feed, [{ id: '${i}', type: 'u${i % M}', m${i % M}_0: 'x' }]);
  ctrl.set(Big, { id: '${i}' }, { f${(i * 3) % BIG}: '' });\n`;
  return s + '}\n';
};
scen.setInvalidate = () => {
  let s =
    setHeader() +
    `  const InvUn = new schema.Invalidate(Un);
  const InvBig = new schema.Invalidate(Big);
`;
  for (let i = 0; i < 333 * N; i++)
    s += `  ctrl.set(InvUn, { id: '${i}', type: 'u${i % M}' });
  ctrl.set([InvUn], [{ id: '${i}', type: 'u${i % M}' }]);
  ctrl.set(InvBig, { id: '${i}' });\n`;
  return s + '}\n';
};
scen.setUpdaters = () => {
  let s = setHeader();
  for (let i = 0; i < 1000 * N; i++)
    s += `  ctrl.set(Un, { id: '${i}', type: 'u${i % M}' }, prev => ({ ...prev, m${i % M}_0: 'x' }));\n`;
  return s + '}\n';
};

// 10. prepareStore()'s redux Store passed to react-redux's Provider and ExternalDataProvider
scen.redux = () => {
  let s = `import { Controller, getDefaultManagers } from '@data-client/react';
import { prepareStore, ExternalDataProvider, initialState } from '@data-client/react/redux';
import type { ProviderProps } from 'react-redux';
declare function provide<A extends { type: string }, S>(props: ProviderProps<A, S>): void;
`;
  for (let i = 0; i < 100 * N; i++)
    s += `export function store${i}() {
  const reducers = { r${i}: (s: { n${i}: number } = { n${i}: 0 }, a: { type: string }) => s, list: (s: string[] = []) => s };
  const { store, selector, controller } = prepareStore(initialState, getDefaultManagers(), Controller, reducers);
  const n: number = store.getState().r${i}.n${i} + store.getState().list.length;
  store.dispatch({ type: 'a${i}' });
  provide({ store, children: null });
  ExternalDataProvider({ store, selector, controller, children: null });
  return n;
}
`;
  return s;
};

// 11. path types vs their frozen pre-#4173 implementation (a type error is a mismatch)
scen.patheq = patheq;

/** Writes scenarios/<name>/ for the named fixtures (all when empty); returns the names */
export function generate(only = []) {
  const names = Object.keys(scen).filter(n => !only.length || only.includes(n));
  if (!only.length) fs.rmSync(out, { recursive: true, force: true });
  for (const name of names) {
    const fn = scen[name];
    const d = path.join(out, name);
    fs.rmSync(d, { recursive: true, force: true });
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'index.ts'), fn());
    fs.writeFileSync(
      path.join(d, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'esnext',
            module: 'esnext',
            lib: ['dom', 'esnext'],
            strict: true,
            moduleResolution: 'bundler',
            skipLibCheck: true,
            noEmit: true,
            types: [],
          },
          files: ['index.ts'],
        },
        null,
        2,
      ),
    );
  }
  return names;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log('generated', generate(process.argv.slice(2)).join(' '));
