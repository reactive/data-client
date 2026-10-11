# @data-client/vue

## 1.0.0

### Patch Changes

- [#4103](https://github.com/reactive/data-client/pull/4103) [`f343f9d`](https://github.com/reactive/data-client/commit/f343f9d42a12f3ad763fac96362166d3b3156b69) - Fix `controller.set()` types for Array schemas

  `controller.set([Entity], rows)` and `controller.set(new schema.Array(Entity), rows)` now typecheck. This writes every row in one store update: each row merges with its stored entity, and entities not in `rows` stay.

  Rows are typed by the Entity's fields. The schema holds one Entity, [Union](https://dataclient.io/rest/api/Union) (for mixed types) or [Invalidate](https://dataclient.io/rest/api/Invalidate) (to delete), in an Array or [Values](https://dataclient.io/rest/api/Values) (which takes an object keyed by id).

  Batch `set()` needs `@data-client/rest` (or `endpoint`/`graphql`) from this release, since older Entity classes don't type as `EntityInterface`.

  ```ts
  // Before: TypeScript error on [Ticker], so batches became one set() per row
  for (const row of rows) {
    ctrl.set(Ticker, { product_id: row.product_id }, row);
  }

  // After: one store update
  ctrl.set([Ticker], rows);

  // Mixed Entity types, batch deletes, and rows keyed by id
  const Message = new schema.Union({ ticker: Ticker, trade: Trade }, 'type');
  ctrl.set([Message], messages);
  ctrl.set([new schema.Invalidate(Ticker)], [{ product_id: 'BTC-USD' }]);
  ctrl.set(new schema.Values(Ticker), { 'BTC-USD': row });
  ```

- [#4230](https://github.com/reactive/data-client/pull/4230) [`46f1f24`](https://github.com/reactive/data-client/commit/46f1f24bcb04824805747ed2a1effe7baece337c) - Fix `controller.set()` types for a single [Invalidate](https://dataclient.io/rest/api/Invalidate)

  Deleting one entity with `set()` worked at runtime but failed to typecheck, since `Invalidate` isn't
  [Queryable](https://dataclient.io/rest/api/schema#queryable). Pass the schema and the row to delete; the row is typed
  by the Entity's fields.

  ```ts
  // Before: TypeScript error, so a one-row batch was the workaround
  ctrl.set([new Invalidate(Post)], [{ id: '5' }]);

  // After
  ctrl.set(new Invalidate(Post), { id: '5' });
  ```

  Like batch `set()`, it takes no `args` and no updater function.

- [#4133](https://github.com/reactive/data-client/pull/4133) [`a82758c`](https://github.com/reactive/data-client/commit/a82758cd1998e58d7ad280407db28bd84f5d7b18) - Fix `controller.set()` accepting any value

  Values are now typed by the schema: Entities take their fields, while [Collection](https://dataclient.io/rest/api/Collection)
  and [All](https://dataclient.io/rest/api/All) take a list of rows. [Query](https://dataclient.io/rest/api/Query) takes
  the input of the schema it wraps, not what its `process()` returns. Updater functions must return the same.

  ```ts
  // Before: these all typechecked, then failed or wrote nothing at runtime
  ctrl.set(new schema.All(Todo), 42);
  ctrl.set(TodoResource.getList.schema, 'anything');
  ctrl.set(Todo, { id: '5' }, { id: '5', completed: 'yes' });

  // After: TypeScript errors on the above; these typecheck
  ctrl.set(TodoResource.getList.schema, [{ id: '5', completed: true }]);
  ctrl.set(new schema.All(Todo), [{ id: '5', completed: true }]);
  ```

  When each member declares its discriminator as a literal (like `readonly type = 'post'`), a
  [Union](https://dataclient.io/rest/api/Union) row is checked against the member it selects. Only
  declared fields are accepted, so a key read by a `schemaAttribute` function must be declared on each member.

  ```ts
  const Feed = new schema.Union({ post: Post, comment: Comment }, 'type');
  // TypeScript error: commentBody is a Comment field, not a Post field
  ctrl.set(
    Feed,
    { id: '1', type: 'post' },
    { type: 'post', commentBody: 'hi' },
  );
  ```

- [#4228](https://github.com/reactive/data-client/pull/4228) [`b55696c`](https://github.com/reactive/data-client/commit/b55696c72ad3e73e0a2f50d3751c7104cd4ad9ee) - Fix TypeScript error passing a `Controller` subclass to `DataProvider` or `DataClientPlugin`

  A plain `class MyController extends Controller` failed to typecheck as the `Controller` option of [DataProvider](https://dataclient.io/docs/api/DataProvider#Controller), Vue's [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin#Controller), and the `@data-client/react/redux` `DataProvider`, so the documented example needed a cast. `MockController()` from `@data-client/core/mock` had the same error when wrapping your subclass. These now typecheck, and you can drop the casts.

  ```tsx
  class MyController extends Controller {
    doSomething = () => console.log('hi');
  }

  // Before: TypeScript error, so you had to cast
  <DataProvider Controller={MyController as typeof Controller}>
  app.use(DataClientPlugin, { Controller: MyController as typeof Controller });

  // After
  <DataProvider Controller={MyController}>
  app.use(DataClientPlugin, { Controller: MyController });
  ```

- [#4150](https://github.com/reactive/data-client/pull/4150) [`74e67fa`](https://github.com/reactive/data-client/commit/74e67fa2c4f9f104f5b7a49e877a48e5963e4bd2) - Fix `useCache()` and `useDLE()` returning a truthy `Symbol` for deleted entities

  After an entity was deleted and its refetch failed, `useCache()` and `useDLE()` (React and Vue) returned an internal
  `Symbol` instead of `undefined`. Since a `Symbol` is truthy, "not loaded" checks passed, and code went on to use it as
  the entity:

  ```tsx
  const todo = useCache(TodoResource.get, { id });
  if (!todo) return <TodoPlaceholder />;
  // Before: reached here with a Symbol; todo.title was undefined and todo.title.trim() threw
  // After: the placeholder renders
  return <TodoItem title={todo.title.trim()} />;
  ```

  [Controller.getResponse()](https://dataclient.io/docs/api/Controller#getResponse) and
  [Controller.fetchIfStale()](https://dataclient.io/docs/api/Controller#fetchIfStale) now also give `undefined` there,
  like [Controller.get()](https://dataclient.io/docs/api/Controller#get) already did.

- [#4163](https://github.com/reactive/data-client/pull/4163) [`159c963`](https://github.com/reactive/data-client/commit/159c9633679d95427fe4f626aec341c76e4578f8) - Fix slow updates in development while Redux DevTools is open

  With the [Redux DevTools](https://dataclient.io/docs/getting-started/debugging) extension open, every store update
  stalled the page while DevTools serialized the store: about 20ms with 50 entities, and 200ms with 500. Apps doing
  many `controller.set()` calls, polling, or live updates would stutter in development. Each update now serializes
  40-60x faster, and timestamps still show as readable times like `10:42:07.123 AM`.

- [#4227](https://github.com/reactive/data-client/pull/4227) [`47502c6`](https://github.com/reactive/data-client/commit/47502c664df913297fba3e5011a975dfd01c0d8d) - Type FETCH `action.meta.promise` as `Promise`

  Managers can now call `.finally()` and `.catch()` on a FETCH action's `meta.promise` without a TypeScript error. It was always a real `Promise` at runtime, but was typed `PromiseLike`, which only has `.then()`.

  ```ts
  // Before: TypeScript error on .finally(), so both callbacks went to .then()
  const track = () =>
    trackTiming(action.endpoint.name, performance.now() - start);
  action.meta.promise.then(track, track);

  // After
  action.meta.promise
    .finally(() => {
      trackTiming(action.endpoint.name, performance.now() - start);
    })
    // the fetch's caller handles errors; this only observes timing
    .catch(() => {});
  ```

- [#4250](https://github.com/reactive/data-client/pull/4250) [`fc4b015`](https://github.com/reactive/data-client/commit/fc4b015ca0899a2685af881d17f765dce27ffc1a) - Fixture `args` accept readonly tuples

  Fixtures written with `args: [...] as const` now type-check when passed to [MockResolver](https://dataclient.io/docs/api/MockResolver), `renderDataHook()`, Vue's `renderDataCompose()` or `mockInitialState()`. Before, TypeScript rejected them with "The type 'readonly [...]' is 'readonly' and cannot be assigned to the mutable type", so you had to drop `as const` or cast.

  ```ts
  const fixtures = [
    {
      endpoint: TodoResource.getList,
      args: [{ userId: 1 }] as const,
      response: [{ id: 1, title: 'Write tests', userId: 1 }],
    },
  ];

  // Before: type error on `fixtures`. After: works as written
  <MockResolver fixtures={fixtures}>
    <TodoList />
  </MockResolver>;
  ```

- [#4232](https://github.com/reactive/data-client/pull/4232) [`31b1820`](https://github.com/reactive/data-client/commit/31b182033106d5ce44352481577d3c321e39ebe9) - Fix `',' expected` errors on TypeScript 4.0 through 4.4

  Importing `@data-client/react/redux`, `@data-client/react/nextjs` or `@data-client/test` failed to compile on TypeScript before 4.5, even with `skipLibCheck` on, because their declaration files used syntax those versions can't parse. They now compile on TypeScript 4.0 and later.

  ```ts
  import { DataProvider } from '@data-client/react/nextjs';
  import { renderDataHook } from '@data-client/test';

  // Before (TypeScript 4.0 to 4.4):
  //   node_modules/@data-client/react/lib/server/nextjs/DataProvider/DataProvider.d.ts(1,15): error TS1005: ',' expected.
  //   node_modules/@data-client/test/lib/makeRenderDataClient/index.d.ts(3,33): error TS1005: ',' expected.
  // After: no errors
  ```

  `@data-client/vue/test` types now also resolve with `moduleResolution: "node"`.

- [#4122](https://github.com/reactive/data-client/pull/4122) [`b4b502d`](https://github.com/reactive/data-client/commit/b4b502d545aab0cf75bf030f3de4607a2e3ab7dc) - Fix types for TypeScript 4.x when `skipLibCheck` is off

  TypeScript 4.0 through 4.7 no longer report `Cannot find name 'NoInfer'` from `@data-client/endpoint` or `@data-client/normalizr`, and TypeScript 4.0 through 4.9 no longer report `Only named exports may use 'export type'` from `@data-client/normalizr`.

  ```ts
  import { Entity } from '@data-client/endpoint';
  import { normalize } from '@data-client/normalizr';

  // Before (TypeScript 4.7, skipLibCheck: false):
  //   error TS2304: Cannot find name 'NoInfer'.
  //   error TS1383: Only named exports may use 'export type'.
  // After: no errors
  ```

- [#4019](https://github.com/reactive/data-client/pull/4019) [`aa15f29`](https://github.com/reactive/data-client/commit/aa15f29f6b0a3b4ae655e2d114a419a3fc94ac7e) Thanks [@renovate](https://github.com/apps/renovate)! - Fix TypeScript 7 module resolution for package exports

  TypeScript 7 requires a `types` condition in `package.json` `exports`. Without it, imports resolved to runtime entrypoints like `node.mjs` and lost declaration files.

- [#4193](https://github.com/reactive/data-client/pull/4193) [`3e45adc`](https://github.com/reactive/data-client/commit/3e45adc831ead1923f0590d8b6ee316655610d69) - `createDataClient()` and `ProvidedDataClient` are deprecated

  They only exist to implement [DataClientPlugin](https://dataclient.io/vue/api/DataClientPlugin) and will stop being
  exported in a future release. Nothing changes at runtime. If you call `createDataClient()` directly, install the
  plugin instead and read the controller with [useController()](https://dataclient.io/vue/api/useController).

  ```ts title="main.ts"
  import { DataClientPlugin } from '@data-client/vue';

  app.use(DataClientPlugin, { managers, initialState });
  ```

- [#4148](https://github.com/reactive/data-client/pull/4148) [`c5e95d4`](https://github.com/reactive/data-client/commit/c5e95d46a8d68ef04ccbcdc7bf90f663357a8530) - `DataClientPlugin` garbage collects by default

  Previously, unused data was only removed from the store if you passed a `gcPolicy` yourself. It now defaults
  to `new GCPolicy()`, matching `DataProvider` in `@data-client/react`, so you can drop the option unless you
  customize it.

  Before

  ```ts
  import { DataClientPlugin, GCPolicy } from '@data-client/vue';

  app.use(DataClientPlugin, { gcPolicy: new GCPolicy() });
  ```

  After

  ```ts
  import { DataClientPlugin } from '@data-client/vue';

  app.use(DataClientPlugin);
  ```

- [#4221](https://github.com/reactive/data-client/pull/4221) [`76a50c8`](https://github.com/reactive/data-client/commit/76a50c853d863140122cecbeb141fb278853849d) - `waitForNextUpdate()` from `renderDataCompose()` is deprecated

  It gives up silently after 1 second, so a test could pass while the composable was still suspended. When the Promise
  had already resolved, it waited the full second for nothing, and under `jest.useFakeTimers()` it could hang. Await the
  result directly instead, and use `allSettled()` after changing props or calling the controller.

  `allSettled()` from `renderDataCompose()` and `mountDataClient()` now also waits for fetches that a prop change starts,
  and for the component to re-render, so you no longer need `nextTick()` around it. It also waits on a `NetworkManager`
  you pass in `managers`, instead of returning right away.

  #### Before

  ```ts
  import { reactive } from 'vue';

  const props = reactive({ id: 5 });
  const { result, waitForNextUpdate } = await renderDataCompose(
    (props: { id: number }) =>
      useSuspense(ArticleResource.get, () => ({ id: props.id })),
    { props, resolverFixtures },
  );
  await waitForNextUpdate();
  const article = await result;

  props.id = 6;
  await waitForNextUpdate();
  ```

  #### After

  ```ts
  import { reactive } from 'vue';

  const props = reactive({ id: 5 });
  const { result, allSettled } = await renderDataCompose(
    (props: { id: number }) =>
      useSuspense(ArticleResource.get, () => ({ id: props.id })),
    { props, resolverFixtures },
  );
  const article = await result;

  props.id = 6;
  await allSettled();
  ```

- [#4142](https://github.com/reactive/data-client/pull/4142) [`f5cc51b`](https://github.com/reactive/data-client/commit/f5cc51b2f77230f64ab24d91eca0072521a24ded) - Fix `useDLE()` and `useCache()` dropping expired `invalidIfStale` data on unrelated store updates

  After an `invalidIfStale` response expired, any unrelated store update switched these composables to empty data, and
  `useDLE()` stayed `loading` without starting a fetch. Expiry is now only re-checked when the response's expiry, the
  arguments, or a reset changes, matching `@data-client/react`.

  The `vue` peer dependency is now `^3.4.0`.

  ```ts
  const { data, loading } = useDLE(ArticleResource.get, { id: 5 });
  // ...after the response's dataExpiryLength passes
  await ctrl.setResponse(UserResource.get, { id: 1 }, user);
  // Before: loading.value === true, data.value === undefined, and no fetch starts
  // After: loading.value === false, data.value is still the article
  ```

- [#4143](https://github.com/reactive/data-client/pull/4143) [`743d8e3`](https://github.com/reactive/data-client/commit/743d8e3dcc5e69a0725616a3ffe2568dee5727e9) - Export `GCPolicy` from `@data-client/vue`

  ```ts
  // Before
  import { GCPolicy } from '@data-client/core';
  // After
  import { GCPolicy } from '@data-client/vue';

  app.use(DataClientPlugin, {
    gcPolicy: new GCPolicy({ intervalMS: 60 * 1000 * 10 }),
  });
  ```

- [#4115](https://github.com/reactive/data-client/pull/4115) [`e350950`](https://github.com/reactive/data-client/commit/e35095045ade70f8151202b357beef2a38ff8272) - Fix getter function arguments in Vue composables

  `useSuspense`, `useLive`, `useCache`, `useDLE`, `useFetch`, `useQuery` and `useSubscription`
  were typed to accept getter functions as arguments, but only resolved refs at runtime. Getters
  now work and are tracked reactively, just like refs and `computed`.

  ```ts
  const props = defineProps<{ id: number }>();

  // Before: getter was passed to the endpoint as-is
  // After: re-fetches when props.id changes
  const article = await useSuspense(ArticleResource.get, () => ({
    id: props.id,
  }));
  ```

- [#4270](https://github.com/reactive/data-client/pull/4270) [`1d693c6`](https://github.com/reactive/data-client/commit/1d693c6e26aa3774636844e5731c78ec9eabe86b) - Add `__INTERNAL__` export matching `@data-client/react`'s

  Tooling built on `@data-client/vue` can now use `createReducer`, `initialState` and friends without adding `@data-client/core` as a direct dependency.

- [#4146](https://github.com/reactive/data-client/pull/4146) [`a8da8c7`](https://github.com/reactive/data-client/commit/a8da8c725de0097aff8fa9bab2f0db8ccfe7047c) - Fix `app.use(DataClientPlugin)` throwing `app.onUnmount is not a function` on Vue versions before 3.5

  ```ts
  const app = createApp(App);
  // Before (Vue < 3.5): TypeError: app.onUnmount is not a function
  // After: installs, and stops the DataClient when the app unmounts
  app.use(DataClientPlugin);
  ```

- [#4134](https://github.com/reactive/data-client/pull/4134) [`bd419cd`](https://github.com/reactive/data-client/commit/bd419cde7897f240440475adf942c64e6418307c) - Fix `useSuspense()`, `useDLE()` and `useFetch()` refetching stale data on every store update

  Once data was stale, any store update (such as `controller.set()`) made these composables refetch, so the server
  response could overwrite the change. They now only refetch when the data's expiry, the arguments, or a reset changes,
  matching `@data-client/react`.

  ```ts
  const article = await useSuspense(ArticleResource.get, { id: 5 });
  // ...after the response's dataExpiryLength passes
  await ctrl.set(Article, { id: 5 }, { id: 5, title: 'edited' });
  // Before: triggers a refetch that reverts title to the server value
  // After: title stays 'edited'
  ```

- [#4135](https://github.com/reactive/data-client/pull/4135) [`f03332e`](https://github.com/reactive/data-client/commit/f03332ea9a4e3b24dc1554cb3a4ff2ebc1b117ad) - Fix `useSuspense()` and `useLive()` fetch errors after arguments change being unhandled

  When ref or computed arguments changed and the new fetch failed, the error became an unhandled promise rejection
  and the result became `undefined`. Reading the result now throws the error, like the first load does, so it reaches
  `onErrorCaptured()`.

  ```ts
  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(
    TodoResource.get,
    computed(() => ({ id: props.id })),
  );
  // Before: a failed fetch for a new id was an unhandled rejection; todo.value became undefined
  // After: reading todo.value throws the fetch error, caught by onErrorCaptured()
  ```

- [#4131](https://github.com/reactive/data-client/pull/4131) [`84b6766`](https://github.com/reactive/data-client/commit/84b67665f547bd52e7dc207af9ba768821041fac) - Fix `useSuspense()` and `useLive()` returning `undefined` while new arguments load

  When ref or computed arguments changed to data not yet in the store, the result became `undefined` until the
  new fetch resolved, crashing templates like `{{ todo.title }}`. It now keeps the previous data until the new data arrives.

  ```ts
  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(
    TodoResource.get,
    computed(() => ({ id: props.id })),
  );
  // Before: todo.value was undefined while the new id loaded
  // After: todo.value keeps the previous todo until the new one arrives
  ```

- [#4169](https://github.com/reactive/data-client/pull/4169) [`341e17c`](https://github.com/reactive/data-client/commit/341e17c087105b7cccd1609ad3df2cb15e10f1dc) - Fix Vue `useSuspense()` suspending on stale data instead of showing it while it refetches

  When a component mounted with cached data that was past its `dataExpiryLength` but still valid, `await useSuspense()`
  waited for the refetch, so users saw the `<Suspense>` fallback instead of the data already on hand. Now, like React,
  it renders the stale data right away and updates once the refetch resolves. Data that is missing, invalidated, or
  [invalidIfStale](https://dataclient.io/rest/api/Endpoint#invalidifstale) still waits for the fetch.

- [#4150](https://github.com/reactive/data-client/pull/4150) [`74e67fa`](https://github.com/reactive/data-client/commit/74e67fa2c4f9f104f5b7a49e877a48e5963e4bd2) - Vue `useFetch()` keeps its response from being garbage collected while mounted, like React `useFetch()` and Vue `useSuspense()`

- [#4114](https://github.com/reactive/data-client/pull/4114) [`7c24b70`](https://github.com/reactive/data-client/commit/7c24b706360208e167aff5d576ad679f7e8e2138) - Fix [useFetch()](https://dataclient.io/docs/api/useFetch) return type to be a read-only `Ref`

  `useFetch()` returns a read-only `Ref` holding the fetch promise, but was typed as returning the promise directly.

  ```ts
  const promise = useFetch(PostResource.get, { id });
  // Before: promise.resolved typechecked, but was always undefined at runtime
  // After:
  if (!promise.value.resolved) {
    // fetch is in-flight
  }
  ```

- Updated dependencies [[`f343f9d`](https://github.com/reactive/data-client/commit/f343f9d42a12f3ad763fac96362166d3b3156b69), [`46f1f24`](https://github.com/reactive/data-client/commit/46f1f24bcb04824805747ed2a1effe7baece337c), [`a82758c`](https://github.com/reactive/data-client/commit/a82758cd1998e58d7ad280407db28bd84f5d7b18), [`b55696c`](https://github.com/reactive/data-client/commit/b55696c72ad3e73e0a2f50d3751c7104cd4ad9ee), [`74e67fa`](https://github.com/reactive/data-client/commit/74e67fa2c4f9f104f5b7a49e877a48e5963e4bd2), [`159c963`](https://github.com/reactive/data-client/commit/159c9633679d95427fe4f626aec341c76e4578f8), [`4549122`](https://github.com/reactive/data-client/commit/4549122004244990a564781a61145ae9ea98370e), [`47502c6`](https://github.com/reactive/data-client/commit/47502c664df913297fba3e5011a975dfd01c0d8d), [`fc4b015`](https://github.com/reactive/data-client/commit/fc4b015ca0899a2685af881d17f765dce27ffc1a), [`aa15f29`](https://github.com/reactive/data-client/commit/aa15f29f6b0a3b4ae655e2d114a419a3fc94ac7e)]:
  - @data-client/core@1.0.0

## 0.18.1

### Patch Changes

- [#3960](https://github.com/reactive/data-client/pull/3960) [`dfa657e`](https://github.com/reactive/data-client/commit/dfa657eb419641845bc7c39abe52189905773190) - Endpoints that resolve to falsy values (`''`, `0`, `false`, or `null`) no longer trigger infinite refetches.

- Updated dependencies [[`dfa657e`](https://github.com/reactive/data-client/commit/dfa657eb419641845bc7c39abe52189905773190)]:
  - @data-client/core@0.18.1

## 0.18.0

### Minor Changes

- [#3931](https://github.com/reactive/data-client/pull/3931) [`959465a`](https://github.com/reactive/data-client/commit/959465a064db687176e483932987b083f19718eb) - Allow one `Collection` schema to be used both top-level and nested.

  Before:

  ```ts
  const getTodos = new Collection([Todo], { argsKey });
  const userTodos = new Collection([Todo], { nestKey });
  ```

  After:

  ```ts
  const userTodos = new Collection([Todo], { argsKey, nestKey });
  ```

- [#3887](https://github.com/reactive/data-client/pull/3887) [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32) - **BREAKING**: `Schema.denormalize()` is now `(input, delegate)` instead
  of the previous `(input, args, unvisit)` 3-parameter signature.

  ```ts
  // before
  denormalize(input, args, unvisit) {
    return unvisit(this.schema, input);
  }

  // after
  denormalize(input, delegate) {
    return delegate.unvisit(this.schema, input);
  }
  ```

  The new [`IDenormalizeDelegate`](https://dataclient.io/rest/api/SchemaSimple)
  exposes `unvisit`, `args`, and a new `argsKey(fn)` helper that registers
  a memoization dimension when output varies with endpoint args. Reading
  `delegate.args` directly does _not_ contribute to cache invalidation —
  schemas that branch on args must call `argsKey`. The `fn` reference
  doubles as the cache path key, so it must be **referentially stable**
  — define it on the instance or at module scope, not inline per call:

  ```ts
  class LensSchema {
    constructor({ lens }) {
      this.lensSelector = lens; // stable reference across calls
    }
    denormalize(input, delegate) {
      const portfolio = delegate.argsKey(this.lensSelector);
      return this.lookup(input, portfolio);
    }
  }
  ```

  All built-in schemas (`Array`, `Object`, `Values`, `Union`, `Query`,
  `Invalidate`, `Lazy`, `Collection`) have been updated. Custom schemas
  implementing `SchemaSimple` must update their `denormalize` signature.

  `Schema.normalize()` and the `visit()` callback also gain an optional
  trailing `parentEntity` argument tracking the nearest enclosing
  entity-like schema. This is additive — existing schemas don't need
  changes unless they want to use it.

- [#3887](https://github.com/reactive/data-client/pull/3887) [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32) - Add [Scalar](https://dataclient.io/rest/api/Scalar) schema for lens-dependent entity fields.

  `Scalar` models entity fields whose values vary by a runtime "lens" (such as the
  selected portfolio, currency, or locale). Multiple components can render the
  same entity through different lenses simultaneously — each sees the correct
  values without the entity itself ever being mutated. Lens-dependent values are
  stored in a separate cell table and joined at denormalize time from endpoint
  args.

  New exports: `Scalar`, `schema.Scalar`.

  A single `Scalar` instance can serve both as an `Entity.schema` field (parent
  entity inferred from the visit) and standalone — inside `Values(Scalar)`,
  `[Scalar]`, or `Collection([Scalar])` — for cheap column-only refreshes
  (entity bound explicitly via `entity`). Cell pks are derived from the map key
  or via `Scalar.entityPk()`, which defaults to `Entity.pk()` so custom and
  composite primary keys work with no override:

  ```ts
  import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

  class Company extends Entity {
    id = '';
    price = 0;
    pct_equity = 0;
    shares = 0;
  }
  const PortfolioScalar = new Scalar({
    lens: args => args[0]?.portfolio,
    key: 'portfolio',
    entity: Company,
  });
  Company.schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };

  // Full load — Company rows + scalar cells for the current portfolio
  export const getCompanies = new RestEndpoint({
    path: '/companies',
    searchParams: {} as { portfolio: string },
    schema: new Collection([Company], { argsKey: () => ({}) }),
  });
  // Lens-only refresh — writes to the same Scalar(portfolio) cell table
  export const getPortfolioColumns = new RestEndpoint({
    path: '/companies/columns',
    searchParams: {} as { portfolio: string },
    schema: new Collection([PortfolioScalar], {
      argsKey: ({ portfolio }) => ({ portfolio }),
    }),
  });
  ```

  `useSuspense(getCompanies, { portfolio: 'A' })` and
  `useSuspense(getCompanies, { portfolio: 'B' })` resolve to different
  `pct_equity` / `shares` while sharing the same `Company` row.

  `Scalar.queryKey` enumerates cells in its table for the current lens, so
  endpoints that use `Scalar` directly as their top-level schema reconstruct
  from cache without a network round-trip once the cells are present.

### Patch Changes

- Updated dependencies [[`959465a`](https://github.com/reactive/data-client/commit/959465a064db687176e483932987b083f19718eb), [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32), [`6e8e499`](https://github.com/reactive/data-client/commit/6e8e499441741b58ad35127b517e8d83fc7a58fd), [`84078d7`](https://github.com/reactive/data-client/commit/84078d7d36bf5cf0fd16a479ce16c48c5d804f32)]:
  - @data-client/core@0.18.0

## 0.16.1

### Patch Changes

- [`fd64b41`](https://github.com/reactive/data-client/commit/fd64b41a9de266af51708622ea8991060fd788a5) - Include `@data-client/normalizr@0.16.6` performance improvements:
  - [#3875](https://github.com/reactive/data-client/pull/3875) [`467a5f6`](https://github.com/reactive/data-client/commit/467a5f6f9d4cdaf0927fa7e22520c5d2c1462ff5) - Fix deepClone to only copy own properties

    `deepClone` in the immutable store path now uses `Object.keys()` instead of `for...in`, preventing inherited properties from being copied into cloned state.

  - [#3877](https://github.com/reactive/data-client/pull/3877) [`e9e96f1`](https://github.com/reactive/data-client/commit/e9e96f1751895c17e046461a1c38bb4bb093c141) - Replace megamorphic computed dispatch in getDependency with switch

    `getDependency` used `delegate[array[index]](...spread)` which creates a temporary array, a computed property lookup, and a spread call on every invocation — a megamorphic pattern that prevents V8 from inlining or type-specializing the call site. Replaced with a `switch` on `path.length` for monomorphic dispatch.

  - [#3876](https://github.com/reactive/data-client/pull/3876) [`7d28629`](https://github.com/reactive/data-client/commit/7d28629d07f6cade43e36f3cf1956f175f98d84f) - Improve denormalization performance by pre-allocating the dependency tracking slot

    Replace `Array.prototype.unshift()` in `GlobalCache.getResults()` with a pre-allocated slot at index 0, avoiding O(n) element shifting on every cache-miss denormalization.

  - [#3884](https://github.com/reactive/data-client/pull/3884) [`7df6a49`](https://github.com/reactive/data-client/commit/7df6a49ee9fcdac10f9f24ec48c4df0931efa0b0) - Move entity table POJO clone from getNewEntities to setEntity

    Lazy-clone entity and meta tables on first write per entity type instead of eagerly in getNewEntities. This keeps getNewEntities as a pure Map operation, eliminating its V8 Maglev bailout ("Insufficient type feedback for generic named access" on `this.entities`).

  - [#3878](https://github.com/reactive/data-client/pull/3878) [`98a7831`](https://github.com/reactive/data-client/commit/98a78318770feaa8433708693bec90b81cbcb1b2) - Avoid hidden class mutation in normalize() return object

    The normalize result object was constructed with `result: '' as any` then mutated via `ret.result = visit(...)`, causing a V8 hidden class transition when the property type changed from string to the actual result type. Restructured to compute the result first and construct the final object in a single step.

- Updated dependencies [[`fd64b41`](https://github.com/reactive/data-client/commit/fd64b41a9de266af51708622ea8991060fd788a5)]:
  - @data-client/core@0.16.7

## 0.16.0

### Minor Changes

- [#3752](https://github.com/reactive/data-client/pull/3752) [`3c3bfe8`](https://github.com/reactive/data-client/commit/3c3bfe81ff0c3a786d6804a61f9e7a4362947dcb) - BREAKING CHANGE: [useFetch()](/docs/api/useFetch) always returns a stable promise with a `.resolved` property, even when data is already cached.

  #### before

  ```tsx
  const promise = useFetch(MyResource.get, { id });
  if (promise) {
    // fetch was triggered
  }
  ```

  #### after

  ```tsx
  const promise = useFetch(MyResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  use(promise); // works with React.use()
  ```

### Patch Changes

- [#3753](https://github.com/reactive/data-client/pull/3753) [`e54c9b6`](https://github.com/reactive/data-client/commit/e54c9b6e6a48939263f41496a90387ee614d35f5) - Add `globalThis.__DC_CONTROLLERS__` Map in dev mode for programmatic store access from browser DevTools MCP, React Native debuggers, and other development tooling.

  Each [DataProvider](/docs/api/DataProvider) registers its [Controller](/docs/api/Controller) keyed by the devtools connection name, supporting multiple providers on the same page.

- [#3823](https://github.com/reactive/data-client/pull/3823) [`869f28f`](https://github.com/reactive/data-client/commit/869f28fc651ca5e8b0f935089fc0b8d8ce8585cb) - Fix stack overflow during denormalization of large bidirectional entity graphs.

  Add entity depth limit (64) to prevent `RangeError: Maximum call stack size exceeded`
  when denormalizing cross-type chains with thousands of unique entities
  (e.g., Department → Building → Department → ...). Entities beyond the depth limit
  are returned with unresolved ids instead of fully denormalized nested objects.

  The limit can be configured per-Entity with [`static maxEntityDepth`](/rest/api/Entity#maxEntityDepth):

  ```ts
  class Department extends Entity {
    static maxEntityDepth = 16;
  }
  ```

- Updated dependencies [[`e54c9b6`](https://github.com/reactive/data-client/commit/e54c9b6e6a48939263f41496a90387ee614d35f5), [`869f28f`](https://github.com/reactive/data-client/commit/869f28fc651ca5e8b0f935089fc0b8d8ce8585cb), [`0e0ff1a`](https://github.com/reactive/data-client/commit/0e0ff1ab49b1a58477b07dba3dfc73df6d4af3f5)]:
  - @data-client/core@0.16.0

## 0.15.4

### Patch Changes

- [#3738](https://github.com/reactive/data-client/pull/3738) [`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1) - Optimistic updates support FormData

- Updated dependencies [[`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1)]:
  - @data-client/core@0.15.7

## 0.15.3

### Patch Changes

- [`ad501b6`](https://github.com/reactive/data-client/commit/ad501b62ec231ff771da05d32053934960c8800c) - Add skill reference to readme

## 0.15.2

### Patch Changes

- [#3703](https://github.com/reactive/data-client/pull/3703) [`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57) Thanks [@ntucker](https://github.com/ntucker)! - Improve normalize/denormalize performance 10-15%
  - Replace `Object.keys().forEach()` with indexed for loops
  - Replace `reduce()` with spreading to direct object mutation
  - Cache getter results to avoid repeated property lookups
  - Centralize arg extraction with pre-allocated loop
  - Eliminate Map double-get pattern

  #### Microbenchmark Results

  | #   | Optimization                 | Before            | After             | Improvement      |
  | --- | ---------------------------- | ----------------- | ----------------- | ---------------- |
  | 1   | **forEach → forLoop**        | 7,164 ops/sec     | 7,331 ops/sec     | **+2.3%**        |
  | 2   | **reduce+spread → mutation** | 912 ops/sec       | 7,468 ops/sec     | **+719% (8.2x)** |
  | 3   | **getter repeated → cached** | 1,652,211 ops/sec | 4,426,994 ops/sec | **+168% (2.7x)** |
  | 4   | **slice+map → indexed**      | 33,221 ops/sec    | 54,701 ops/sec    | **+65% (1.65x)** |
  | 5   | **Map double-get → single**  | 23,046 ops/sec    | 23,285 ops/sec    | **+1%**          |

  #### Impact Summary by Codepath

  | Codepath                                   | Optimizations Applied | Expected Improvement |
  | ------------------------------------------ | --------------------- | -------------------- |
  | **normalize** (setResponse)                | 1, 2, 4               | 10-15%               |
  | **denormalize** (getResponse)              | 1, 2, 4               | 10-15%               |
  | **Controller queries** (get, getQueryMeta) | 5, 6                  | 5-10%                |

- [`09056b0`](https://github.com/reactive/data-client/commit/09056b0adf1375e0aa17df6c1db6f73f721c518f) Thanks [@ntucker](https://github.com/ntucker)! - Simplify endpoint.update() error message

- Updated dependencies [[`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57), [`09056b0`](https://github.com/reactive/data-client/commit/09056b0adf1375e0aa17df6c1db6f73f721c518f)]:
  - @data-client/core@0.15.4

## 0.15.1

### Patch Changes

- [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133) Thanks [@ntucker](https://github.com/ntucker)! - Fix image links in package README

- Updated dependencies [[`bf3ac79`](https://github.com/reactive/data-client/commit/bf3ac7966dc615b1dc6cc6c6d600148fdca4e354), [`ed4ec6d`](https://github.com/reactive/data-client/commit/ed4ec6dc516ac9e3977de7ec9018bff962626133)]:
  - @data-client/core@0.15.3

## 0.15.0

### Minor Changes

- [`733091f`](https://github.com/reactive/data-client/commit/733091f09b503ef7bb7d435a1d86dd7cbcfd96bb) Thanks [@ntucker](https://github.com/ntucker)! - Never wrap renderDataCompose().result in ref. Just passthrough the return value directly. Always.

  ### Before

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useSuspense(CoolerArticleResource.get, { id: payload.id }),
  );

  const articleRef = await result.value;
  expect(articleRef.value.title).toBe(payload.title);
  expect(articleRef.value.content).toBe(payload.content);
  ```

  ### After

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useSuspense(CoolerArticleResource.get, { id: payload.id }),
  );

  const articleRef = await result;
  expect(articleRef.value.title).toBe(payload.title);
  expect(articleRef.value.content).toBe(payload.content);
  ```

- [`354b44c`](https://github.com/reactive/data-client/commit/354b44ca60a95cca64619d19c3314090d8edb29e) Thanks [@ntucker](https://github.com/ntucker)! - @data-client/vue first release

- [#3591](https://github.com/reactive/data-client/pull/3591) [`aecd59b`](https://github.com/reactive/data-client/commit/aecd59becae7fb722eee4bd5035f2a654e75d5d8) Thanks [@ntucker](https://github.com/ntucker)! - `renderDataCompose()` awaits until the composable runs

  ### Before

  ```ts
  const { result, cleanup } = renderDataCompose(() =>
    useCache(CoolerArticleResource.get, { id: payload.id }),
  );

  // Wait for initial render
  await waitForNextUpdate();

  expect(result.current).toBeDefined();
  ```

  ### After

  ```ts
  const { result, cleanup } = await renderDataCompose(() =>
    useCache(CoolerArticleResource.get, { id: payload.id }),
  );

  expect(result.value).toBeDefined();
  ```

- [#3591](https://github.com/reactive/data-client/pull/3591) [`aecd59b`](https://github.com/reactive/data-client/commit/aecd59becae7fb722eee4bd5035f2a654e75d5d8) Thanks [@ntucker](https://github.com/ntucker)! - `renderDataCompose().result` is now simply passes the composable result if it's a ref, or wraps it as computable ref

- [#3592](https://github.com/reactive/data-client/pull/3592) [`4c9465b`](https://github.com/reactive/data-client/commit/4c9465bdcb139d79ca7205925e93fc45d37f3281) Thanks [@ntucker](https://github.com/ntucker)! - Add useDLE()

  ```ts
  const { date, loading, error } = useDLE(
    CoolerArticleResource.get,
    computed(() => (props.id !== null ? { id: props.id } : null)),
  );
  ```

### Patch Changes

- [`d52fa38`](https://github.com/reactive/data-client/commit/d52fa38115950db8d3f3fde2d364c9f0ad8aaf65) Thanks [@ntucker](https://github.com/ntucker)! - Fixed race condition in useSuspense() where args change while initial suspense is not complete

- [#3584](https://github.com/reactive/data-client/pull/3584) [`6809480`](https://github.com/reactive/data-client/commit/68094805498056ff3353507478908b87bb03209a) Thanks [@ntucker](https://github.com/ntucker)! - Only run manager start/stop for app lifecycle - not every component mount

- [#3622](https://github.com/reactive/data-client/pull/3622) [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042) Thanks [@ntucker](https://github.com/ntucker)! - Add MockPlugin

  Example usage:

  ```ts
  import { createApp } from 'vue';
  import { DataClientPlugin } from '@data-client/vue';
  import { MockPlugin } from '@data-client/vue/test';

  const app = createApp(App);
  app.use(DataClientPlugin);
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        args: [{ id: 1 }],
        response: { id: 1, name: 'Test' },
      },
    ],
  });
  app.mount('#app');
  ```

  Interceptors allow dynamic responses based on request arguments:

  ```ts
  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        response: (...args) => {
          const [{ id }] = args;
          return {
            id,
            name: `Dynamic ${id}`,
          };
        },
      },
    ],
  });
  ```

  Interceptors can also maintain state across calls:

  ```ts
  const interceptorData = { count: 0 };

  app.use(MockPlugin, {
    fixtures: [
      {
        endpoint: MyResource.get,
        response: function (this: { count: number }, ...args) {
          this.count++;
          const [{ id }] = args;
          return {
            id,
            name: `Call ${this.count}`,
          };
        },
      },
    ],
    getInitialInterceptorData: () => interceptorData,
  });
  ```

- [`eae4fe4`](https://github.com/reactive/data-client/commit/eae4fe4004ff506a020fac0ca7b322d7eda0aac2) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> renderDataCompose

  This keeps naming conventions closer to the React version

- [#3684](https://github.com/reactive/data-client/pull/3684) [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f) Thanks [@ntucker](https://github.com/ntucker)! - Optimize normalization performance with faster loops and Set-based cycle detection

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - renderDataClient -> mountDataClient
  renderDataComposable -> renderDataClient

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Make composables reactive to computed props

- [#3585](https://github.com/reactive/data-client/pull/3585) [`7408964`](https://github.com/reactive/data-client/commit/7408964419152da48cfb4ac13221aa1009796bea) Thanks [@ntucker](https://github.com/ntucker)! - Add useCache()

- [`1c945bb`](https://github.com/reactive/data-client/commit/1c945bbc4cd290a186914f16b9afd9e7501198ed) Thanks [@ntucker](https://github.com/ntucker)! - Update README with MockPlugin

- [`b03fa99`](https://github.com/reactive/data-client/commit/b03fa99f1327e91ffad840b90d4ac5ef05a358d3) Thanks [@ntucker](https://github.com/ntucker)! - Improve dependency injection console message

- Updated dependencies [[`a4092a1`](https://github.com/reactive/data-client/commit/a4092a14999bfe3aa5cf613bb009264ec723ff99), [`ad3964d`](https://github.com/reactive/data-client/commit/ad3964d65d245c459809f64afe17ebdf5fda5042), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d), [`d44d36a`](https://github.com/reactive/data-client/commit/d44d36a7de0a18817486c4f723bf2f0e86ac9677), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7)]:
  - @data-client/core@0.15.0
