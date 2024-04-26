# Change Log

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
    static key = "Ticker";

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
    static key = "Ticker";

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
