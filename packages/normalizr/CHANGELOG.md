# Change Log

## 0.15.4

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

## 0.15.0

### Minor Changes

- [#3421](https://github.com/reactive/data-client/pull/3421) [`246cde6`](https://github.com/reactive/data-client/commit/246cde6dbeca59eafd10e59d8cd05a6f232fb219) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: Denormalize always transforms immutablejs entities into the class

  Previously using ImmutableJS structures when calling denormalize() would maintain
  nested schemas as immutablejs structures still. Now everything is converted to normal JS.
  This is how the types have always been specified.

- [#3468](https://github.com/reactive/data-client/pull/3468) [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: denormalize no longer detects ImmutableJS state

  Use `/imm` exports to handle ImmutableJS state

  #### Before

  ```ts
  import { MemoCache, denormalize } from '@data-client/normalizr';

  const memo = new MemoCache();
  ```

  #### After

  ```ts
  import { MemoCache } from '@data-client/normalizr';
  import { MemoPolicy, denormalize } from '@data-client/normalizr/imm';

  const memo = new MemoCache(MemoPolicy);
  ```

- [#3461](https://github.com/reactive/data-client/pull/3461) [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2) Thanks [@ntucker](https://github.com/ntucker)! - Add delegate.INVALID to queryKey

  This is used in schema.All.queryKey().

  #### Before

  ```ts
  queryKey(args: any, unvisit: any, delegate: IQueryDelegate): any {
    if (!found) return INVALID;
  }
  ```

  #### After

  ```ts
  queryKey(args: any, unvisit: any, delegate: IQueryDelegate): any {
    if (!found) return delegate.INVALID;
  }
  ```

- [#3686](https://github.com/reactive/data-client/pull/3686) [`269b45e`](https://github.com/reactive/data-client/commit/269b45e835251cff847776078e51c0a593b62715) Thanks [@ntucker](https://github.com/ntucker)! - Add `normalize()` to `@data-client/normalizr/imm` for ImmutableJS state

  New exports:
  - `normalize` - Normalizes data directly into ImmutableJS Map structures
  - `ImmNormalizeDelegate` - Delegate class for custom ImmutableJS normalization
  - `ImmutableStoreData`, `ImmutableNormalizedSchema`, `ImmutableJSMutableTable` - Types

  ```js
  import { normalize } from '@data-client/normalizr/imm';
  import { fromJS } from 'immutable';

  const result = normalize(Article, responseData, args, {
    entities: fromJS({}),
    indexes: fromJS({}),
    entitiesMeta: fromJS({}),
  });
  ```

- [#3461](https://github.com/reactive/data-client/pull/3461) [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2) Thanks [@ntucker](https://github.com/ntucker)! - Add delegate.invalidate() to normalization

  #### Before

  ```ts
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string {
    delegate.setEntity(this as any, pk, INVALID);
  }
  ```

  #### After

  ```ts
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string {
    delegate.invalidate(this as any, pk);
  }
  ```

- [#3454](https://github.com/reactive/data-client/pull/3454) [`66e1906`](https://github.com/reactive/data-client/commit/66e19064d21225c70639f3b4799e54c259ce6905) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: MemoCache.query() and MemoCache.buildQueryKey() take state as one argument

  #### Before

  ```ts
  this.memo.buildQueryKey(schema, args, state.entities, state.indexes, key);
  ```

  #### After

  ```ts
  this.memo.buildQueryKey(schema, args, state, key);
  ```

  #### Before

  ```ts
  this.memo.query(schema, args, state.entities, state.indexes);
  ```

  #### After

  ```ts
  this.memo.query(schema, args, state);
  ```

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: schema.normalize(...args, addEntity, getEntity, checkLoop) -> schema.normalize(...args, delegate)

  We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

  ```ts
  /** Helpers during schema.normalize() */
  export interface INormalizeDelegate {
    /** Action meta-data for this normalize call */
    readonly meta: { fetchedAt: number; date: number; expiresAt: number };
    /** Gets any previously normalized entity from store */
    getEntity: GetEntity;
    /** Updates an entity using merge lifecycles when it has previously been set */
    mergeEntity(
      schema: Mergeable & { indexes?: any },
      pk: string,
      incomingEntity: any,
    ): void;
    /** Sets an entity overwriting any previously set values */
    setEntity(
      schema: { key: string; indexes?: any },
      pk: string,
      entity: any,
      meta?: { fetchedAt: number; date: number; expiresAt: number },
    ): void;
    /** Returns true when we're in a cycle, so we should not continue recursing */
    checkLoop(key: string, pk: string, input: object): boolean;
  }
  ```

  #### Before

  ```ts
  addEntity(this, processedEntity, id);
  ```

  #### After

  ```ts
  delegate.mergeEntity(this, id, processedEntity);
  ```

- [#3468](https://github.com/reactive/data-client/pull/3468) [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895) Thanks [@ntucker](https://github.com/ntucker)! - delegate.getEntity(key) -> delegate.getEntities(this.key)

  Return value is a restricted interface with keys() and entries() iterator methods.
  This applies to both schema.queryKey and schema.normalize method delegates.

  ```ts
  const entities = delegate.getEntities(key);

  // foreach on keys
  for (const key of entities.keys()) {
  }
  // Object.keys() (convert to array)
  return [...entities.keys()];
  // foreach on full entry
  for (const [key, entity] of entities.entries()) {
  }
  ```

  #### Before

  ```ts
  const entities = delegate.getEntity(this.key);
  if (entities)
    Object.keys(entities).forEach(collectionPk => {
      if (!filterCollections(JSON.parse(collectionPk))) return;
      delegate.mergeEntity(this, collectionPk, normalizedValue);
    });
  ```

  #### After

  ```ts
  const entities = delegate.getEntities(this.key);
  if (entities)
    for (const collectionKey of entities.keys()) {
      if (!filterCollections(JSON.parse(collectionKey))) continue;
      delegate.mergeEntity(this, collectionKey, normalizedValue);
    }
  ```

- [#3451](https://github.com/reactive/data-client/pull/3451) [`4939456`](https://github.com/reactive/data-client/commit/4939456598c213ee81c1abef476a1aaccd19f82d) Thanks [@ntucker](https://github.com/ntucker)! - state.entityMeta -> state.entitiesMeta

- [#3372](https://github.com/reactive/data-client/pull/3372) [`25b153a`](https://github.com/reactive/data-client/commit/25b153a9d80db1bcd17ab5558dfa13b333f112b8) Thanks [@ntucker](https://github.com/ntucker)! - MemoCache.query returns `{ data, paths }` just like denormalize. `data` could be INVALID

  #### Before

  ```ts
  return this.memo.query(schema, args, state);
  ```

  #### After

  ```ts
  const { data } = this.memo.query(schema, args, state);
  return typeof data === 'symbol' ? undefined : (data as any);
  ```

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: schema.queryKey(args, queryKey, getEntity, getIndex) -> schema.queryKey(args, unvisit, delegate)
  BREAKING CHANGE: delegate.getIndex() returns the index directly, rather than object.

  We consolidate all 'callback' functions during recursion calls into a single 'delegate' argument.

  Our recursive call is renamed from queryKey to unvisit, and does not require the last two arguments.

  ```ts
  /** Accessors to the currently processing state while building query */
  export interface IQueryDelegate {
    getEntity: GetEntity;
    getIndex: GetIndex;
  }
  ```

  #### Before

  ```ts
  queryKey(args, queryKey, getEntity, getIndex) {
    getIndex(schema.key, indexName, value)[value];
    getEntity(this.key, id);
    return queryKey(this.schema, args, getEntity, getIndex);
  }
  ```

  #### After

  ```ts
  queryKey(args, unvisit, delegate) {
    delegate.getIndex(schema.key, indexName, value);
    delegate.getEntity(this.key, id);
    return unvisit(this.schema, args);
  }
  ```

### Patch Changes

- [#3468](https://github.com/reactive/data-client/pull/3468) [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895) Thanks [@ntucker](https://github.com/ntucker)! - Add /imm exports path for handling ImmutableJS state

  #### MemoCache

  ```ts
  import { MemoCache } from '@data-client/normalizr';
  import { MemoPolicy } from '@data-client/normalizr/imm';

  const memo = new MemoCache(MemoPolicy);

  // entities is an ImmutableJS Map
  const value = MemoCache.denormalize(Todo, '1', entities);
  ```

  #### denormalize

  non-memoized denormalize

  ```ts
  import { denormalize } from '@data-client/normalizr/imm';

  // entities is an ImmutableJS Map
  const value = denormalize(Todo, '1', entities);
  ```

- [#3684](https://github.com/reactive/data-client/pull/3684) [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f) Thanks [@ntucker](https://github.com/ntucker)! - Optimize normalization performance with faster loops and Set-based cycle detection

- [#3558](https://github.com/reactive/data-client/pull/3558) [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f) Thanks [@ntucker](https://github.com/ntucker)! - Normalize delegate.invalidate() first argument only has `key` param.

  `indexes` optional param no longer provided as it was never used.

  ```ts
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string {
    delegate.invalidate({ key: this._entity.key }, pk);
    return pk;
  }
  ```

- [#3468](https://github.com/reactive/data-client/pull/3468) [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance of get/denormalize for small responses
  - 10-20% performance improvement due to removing immutablejs check for every call

## 0.14.22

### Patch Changes

- [#3390](https://github.com/reactive/data-client/pull/3390) [`32cccdb`](https://github.com/reactive/data-client/commit/32cccdb921cd8d7643b641a9e8872aa89782a94a) Thanks [@ntucker](https://github.com/ntucker)! - Improve performance by using Map() instead of Object for unbounded keys

## 0.14.21

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

## 0.14.19

### Patch Changes

- [#3371](https://github.com/reactive/data-client/pull/3371) [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6) Thanks [@ntucker](https://github.com/ntucker)! - Add react-native entry to package.json exports

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

## 0.14.17

### Patch Changes

- [`25be07f`](https://github.com/reactive/data-client/commit/25be07f51c501003330d758993542bee3bd804e1) Thanks [@ntucker](https://github.com/ntucker)! - Update README to not say 'mixin' twice

## 0.14.16

### Patch Changes

- [#3243](https://github.com/reactive/data-client/pull/3243) [`43a955c`](https://github.com/reactive/data-client/commit/43a955c18684b4e0f5c1d79b2504e8ad2910816b) Thanks [@ntucker](https://github.com/ntucker)! - Update README to link to [EntityMixin](https://dataclient.io/rest/api/EntityMixin)

## 0.14.12

### Patch Changes

- [`3b337e7`](https://github.com/reactive/data-client/commit/3b337e74e3f22f2fe48f6eb37084bbf58859bbe1) Thanks [@ntucker](https://github.com/ntucker)! - Add schema table to README

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Update README to remove Entity.pk() when it is default ('id')

## 0.14.6

### Patch Changes

- [#3165](https://github.com/reactive/data-client/pull/3165) [`3fa9eb9`](https://github.com/reactive/data-client/commit/3fa9eb907d8760171da065168796b87e802d6666) Thanks [@ntucker](https://github.com/ntucker)! - [Query](https://dataclient.io/rest/api/Query) can take [Object Schemas](https://dataclient.io/rest/api/Object)

  This enables joining arbitrary objects (whose pk works with the same arguments.)

  ```ts
  class Ticker extends Entity {
    product_id = '';
    price = 0;

    pk(): string {
      return this.product_id;
    }
  }
  class Stats extends Entity {
    product_id = '';
    last = 0;

    pk(): string {
      return this.product_id;
    }
  }
  const queryPrice = new schema.Query(
    { ticker: Ticker, stats: Stats },
    ({ ticker, stats }) => ticker?.price ?? stats?.last,
  );
  ```

## 0.14.1

### Patch Changes

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - Make normalize and memo arguments accept more valid types

## 0.14.0

### Minor Changes

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.normalize `visit()` interface; removing non-contextual arguments.

  ```ts
  /** Visits next data + schema while recurisvely normalizing */
  export interface Visit {
    (schema: any, value: any, parent: any, key: any, args: readonly any[]): any;
    creating?: boolean;
  }
  ```

  This results in a 10% normalize performance boost.

  ```ts title="Before"
  processedEntity[key] = visit(
    processedEntity[key],
    processedEntity,
    key,
    this.schema[key],
    addEntity,
    visitedEntities,
    storeEntities,
    args,
  );
  ```

  ```ts title="After"
  processedEntity[key] = visit(
    this.schema[key],
    processedEntity[key],
    processedEntity,
    key,
    args,
  );
  ```

  The information needed from these arguments are provided by [closing](<https://en.wikipedia.org/wiki/Closure_(computer_programming)>) `visit()` around them.

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.normalize interface from direct data access, to using functions like `getEntity`

  ```ts
  interface SchemaSimple {
    normalize(
      input: any,
      parent: any,
      key: any,
      args: any[],
      visit: (
        schema: any,
        value: any,
        parent: any,
        key: any,
        args: readonly any[],
      ) => any,
      addEntity: (...args: any) => any,
      getEntity: (...args: any) => any,
      checkLoop: (...args: any) => any,
    ): any;
  }
  ```

  We also add `checkLoop()`, which moves some logic in [Entity](https://dataclient.io/rest/api/Entity)
  to the core normalize algorithm.

  ```ts
  /** Returns true if a circular reference is found */
  export interface CheckLoop {
    (entityKey: string, pk: string, input: object): boolean;
  }
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change Schema.denormalize `unvisit` to have [schema](https://dataclient.io/rest/api/schema) argument first.

  ```ts
  interface SchemaSimple {
    denormalize(
      input: {},
      args: readonly any[],
      unvisit: (schema: any, input: any) => any,
    ): T;
  }
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change normalize() interface

  ```ts
  function normalize(
    schema,
    input,
    args,
    { entities, indexes, entityMeta },
    { date, expiresAt, fetchedAt },
  );
  ```

  #### Usage

  ```ts
  const { result, entities, indexes, entityMeta } = normalize(
    action.endpoint.schema,
    payload,
    action.args,
    state,
    action.meta,
  );
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change denormalize() interface

  ```ts
  function denormalize(schema, input, entities, args);
  ```

  #### Usage

  ```ts
  const value = denormalize(endpoint.schema, input, state.entities, args);
  ```

- [#3134](https://github.com/reactive/data-client/pull/3134) [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36) Thanks [@ntucker](https://github.com/ntucker)! - Change MemoCache methods interface

  ```ts
  class MemoCache {
    denormalize(schema, input, entities, args): { data; paths };
    query(schema, args, entities, indexes): data;
    buildQueryKey(schema, args, entities, indexes): normalized;
  }
  ```

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

## 0.11.4

### Patch Changes

- [#3020](https://github.com/reactive/data-client/pull/3020) [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d) Thanks [@ntucker](https://github.com/ntucker)! - Add NI<> utility type that is back-compat NoInfer<>

## 0.11.0

[Release notes and migration guide](https://dataclient.io/blog/2024/04/08/v0.11-queries-querable-usequery)

### Minor Changes

- [`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4) Thanks [@ntucker](https://github.com/ntucker)! - Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds
  - `unvisit()` always returns `undefined` with `undefined` as input.
  - `All` returns INVALID from `queryKey()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: new AbortOptimistic() -> [snapshot.abort](https://dataclient/docs/api/Snapshot#abort)

  #### Before

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw new AbortOptimistic();
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

  #### After

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2978](https://github.com/reactive/data-client/pull/2978) [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: buildQueryKey() -> memo.buildQueryKey()

  ```ts title="Before"
  const results = buildQueryKey(schema, args, state.indexes, state.entities);
  ```

  ```ts title="After"
  const memo = new MemoCached();
  memo.buildQueryKey(key, schema, args, state.entities, state.indexes);
  ```

- [#2978](https://github.com/reactive/data-client/pull/2978) [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd) Thanks [@ntucker](https://github.com/ntucker)! - Add MemoCache

  `MemoCache` is a singleton to store the memoization cache for denormalization methods

  ```ts
  const memo = new MemoCache();
  const data = memo.query(key, schema, args, state.entities, state.indexes);
  const { data, paths } = memo.denormalize(input, schema, state.entities, args);
  const queryKey = memo.buildQueryKey(
    key,
    schema,
    args,
    state.entities,
    state.indexes,
  );
  ```

- [#2977](https://github.com/reactive/data-client/pull/2977) [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Schema.infer -> Schema.queryKey

  ```ts title="Before"
  class MyEntity extends Entity {
    // highlight-next-line
    static infer(
      args: readonly any[],
      indexes: NormalizedIndex,
      recurse: any,
      entities: any,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.infer(args, indexes, recurse, entities);
    }
  }
  ```

  ```ts title="After"
  class MyEntity extends Entity {
    // highlight-next-line
    static queryKey(
      args: readonly any[],
      queryKey: (...args: any) => any,
      getEntity: GetEntity,
      getIndex: GetIndex,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.queryKey(args, queryKey, getEntity, getIndex);
    }
  }
  ```

- [#2971](https://github.com/reactive/data-client/pull/2971) [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161) Thanks [@ntucker](https://github.com/ntucker)! - type ResultCache -> EndpointCache

- [#2978](https://github.com/reactive/data-client/pull/2978) [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: WeakEntityMap -> WeakDependencyMap

  We generalize this data type so it can be used with other dependencies.

  ```ts title="Before"
  new WeakEntityMap();
  ```

  ```ts title="After"
  new WeakDependencyMap<EntityPath>();
  ```

- [#2978](https://github.com/reactive/data-client/pull/2978) [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: denormalizeCached() -> new MemoCache().denormalize()

  ```ts title="Before"
  const endpointCache = new WeakEntityMap();
  const entityCache = {};
  denormalizeCached(
    input,
    schema,
    state.entities,
    entityCache,
    endpointCache,
    args,
  );
  ```

  ```ts title="After"
  const memo = new MemoCached();
  memo.denormalize(input, schema, state.entities, args);
  ```

- [#2957](https://github.com/reactive/data-client/pull/2957) [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a) Thanks [@ntucker](https://github.com/ntucker)! - Add [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2977](https://github.com/reactive/data-client/pull/2977) [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: inferResults() -> buildQueryKey()

### Patch Changes

- [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0) Thanks [@ntucker](https://github.com/ntucker)! - Update description in package.json

- [`73de27f`](https://github.com/reactive/data-client/commit/73de27fadb214c3c2995ca558daa9736312de7a9) Thanks [@ntucker](https://github.com/ntucker)! - Use same state meta for each entity, rather than duplicating

- [#2961](https://github.com/reactive/data-client/pull/2961) [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1) Thanks [@ntucker](https://github.com/ntucker)! - fix: Missing nested entities should appear once they are present (When nesting pk was a number type)

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- [#2961](https://github.com/reactive/data-client/pull/2961) [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1) Thanks [@ntucker](https://github.com/ntucker)! - Always normalize pk to string type

  Warning: This will affect contents of the store state (some numbers will appear as strings)

  Before:

  ```json
  {
    "Article": {
      "123": {
        "author": 8472,
        "id": 123,
        "title": "A Great Article"
      }
    },
    "User": {
      "8472": {
        "id": 8472,
        "name": "Paul"
      }
    }
  }
  ```

  After:

  ```json
  {
    "Article": {
      "123": {
        "author": "8472",
        "id": 123,
        "title": "A Great Article"
      }
    },
    "User": {
      "8472": {
        "id": 8472,
        "name": "Paul"
      }
    }
  }
  ```

- [#2956](https://github.com/reactive/data-client/pull/2956) [`10432b7`](https://github.com/reactive/data-client/commit/10432b7eeab8f1e31ed764d46b0775e36ea74041) Thanks [@ntucker](https://github.com/ntucker)! - fix: Missing nested entities should appear once they are present

## 0.10.0

### Minor Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object
  - `[]` and [schema.Array](https://dataclient.io/rest/api/Array) now behave in the same manner.
  - `null` values are now consistently handled everywhere (being retained).
    - These were already being retained in [nested Entities](https://dataclient.io/rest/guides/relational-data#nesting)
  - `undefined` is still filtered out.

### Patch Changes

- [`67f4e0b`](https://github.com/reactive/data-client/commit/67f4e0b45068da32d20e250267cb1cd2cea51226) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- [`053e823`](https://github.com/reactive/data-client/commit/053e82377bd29f200cd7dfbc700da7a3ad7fa8d7) Thanks [@ntucker](https://github.com/ntucker)! - Update NextJS Demo link

## 0.9.5

### Patch Changes

- [`bb4b9583c5`](https://github.com/reactive/data-client/commit/bb4b9583c52e2b2fe45765af10b385b571901ee7) Thanks [@ntucker](https://github.com/ntucker)! - docs: Update readme

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

## 0.9.3

### Patch Changes

- [#2818](https://github.com/reactive/data-client/pull/2818) [`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles and update names
  - Client packages namespace into RDC
    - @data-client/react - RDC
    - @data-client/core - RDC.Core
    - @data-client/redux - RDC.Redux
  - Definition packages namespace top level
    - @data-client/rest - Rest
    - @data-client/graphql - GraphQL
    - @data-client/img - Img
    - @data-client/endpoint - Endpoint
  - Utility
    - @data-client/normalizr - normalizr
    - @data-client/use-enhanced-reducer - EnhancedReducer

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

## 0.8.0

### Minor Changes

- [#2784](https://github.com/reactive/data-client/pull/2784) [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGES:
  - DELETE removed -> INVALIDATE
  - drop all support for legacy schemas
    - entity.expiresAt removed
    - Collections.infer does entity check
    - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation

- [#2795](https://github.com/reactive/data-client/pull/2795) [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) _must_ support function calls

  This means Date will no longer work like before. Possible migrations:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: Temporal.Instant.from,
    };
  }
  ```

  or to continue using Date:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = 'Ticker';

    static schema = {
      price: Number,
      time: (iso: string) => new Date(iso),
    };
  }
  ```

- [#2792](https://github.com/reactive/data-client/pull/2792) [`35ccedceb5`](https://github.com/reactive/data-client/commit/35ccedceb53d91dd54dd996990c7c75719be2b85) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Serializer schemas are only processed during denormalization

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

## 0.2.2

### Patch Changes

- 7b835f113a: Improve package tags

## 0.2.1

### Patch Changes

- 954e06e839: docs: Update README

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse

### Patch Changes

- 87475a0cae: Mark expiresAt and useIncoming as deprecated in the public interface (still fine internally)
