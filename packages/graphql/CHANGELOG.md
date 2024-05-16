# @data-client/graphql

## 0.12.7

### Patch Changes

- [#3063](https://github.com/reactive/data-client/pull/3063) [`2080c87`](https://github.com/reactive/data-client/commit/2080c8751df147a839f03eade9804d57291d12fb) Thanks [@ntucker](https://github.com/ntucker)! - Polymorphic (Union) types should still denormalize when handling passthrough (non-normalized) data

  When denormalizing non-normalized (like return of ctrl.fetch), it is still expected to handle
  all steps like constructing class instances if possible. However, to do this for Polymorphic
  types we need to fallback to using part of the normalize process to find out _which_ schema
  to use for the remainder of denormalization.

- Updated dependencies [[`4bc9145`](https://github.com/reactive/data-client/commit/4bc914574116d285f81546ffe37ead3e8aa339dc), [`2080c87`](https://github.com/reactive/data-client/commit/2080c8751df147a839f03eade9804d57291d12fb), [`4bc9145`](https://github.com/reactive/data-client/commit/4bc914574116d285f81546ffe37ead3e8aa339dc)]:
  - @data-client/endpoint@0.12.7

## 0.12.6

### Patch Changes

- [`19832bc`](https://github.com/reactive/data-client/commit/19832bc1ee15805788697748b275c134ea81ebf6) Thanks [@ntucker](https://github.com/ntucker)! - Add docstrings to Collection methods

- Updated dependencies [[`19832bc`](https://github.com/reactive/data-client/commit/19832bc1ee15805788697748b275c134ea81ebf6)]:
  - @data-client/endpoint@0.12.6

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

- [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259) Thanks [@ntucker](https://github.com/ntucker)! - Update SnapshotInterface to include improvements in getError type

- Updated dependencies [[`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d), [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259)]:
  - @data-client/endpoint@0.12.3

## 0.11.3

### Patch Changes

- [#3017](https://github.com/reactive/data-client/pull/3017) [`ce164d2`](https://github.com/reactive/data-client/commit/ce164d286c8afcb2593a86abbf23948a08aa40ba) Thanks [@ntucker](https://github.com/ntucker)! - Queries pass-through suspense rather than ever being undefined

  - [useSuspense()](https://dataclient.io/docs/api/useSuspense) return values will not be nullable
  - [useQuery()](https://dataclient.io/docs/api/useQuery) will still be nullable due to it handling `INVALID` as `undefined` return
  - [Query.process](https://dataclient.io/rest/api/Query#process) does not need to handle nullable cases

- Updated dependencies [[`ce164d2`](https://github.com/reactive/data-client/commit/ce164d286c8afcb2593a86abbf23948a08aa40ba)]:
  - @data-client/endpoint@0.11.3

## 0.11.1

### Patch Changes

- [#3006](https://github.com/reactive/data-client/pull/3006) [`13c6466`](https://github.com/reactive/data-client/commit/13c64662bce3813869140bc709badffc59929c5e) Thanks [@ntucker](https://github.com/ntucker)! - Endpoint.sideEffect can be `false`

- Updated dependencies [[`13c6466`](https://github.com/reactive/data-client/commit/13c64662bce3813869140bc709badffc59929c5e)]:
  - @data-client/endpoint@0.11.1

## 0.11.0

[Release notes and migration guide](https://dataclient.io/blog/2024/04/08/v0.11-queries-querable-usequery)

### Minor Changes

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

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: new Query -> [new schema.Query](https://dataclient.io/rest/api/Query)

  #### Before

  ```jsx
  const getUserCount = new Query(
    new schema.All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter((user) => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );

  const userCount = useCache(getUserCount);
  const adminCount = useCache(getUserCount, { isAdmin: true });
  ```

  #### After

  ```jsx
  const getUserCount = new schema.Query(
    new schema.All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter((user) => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );

  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
  ```

- [#2957](https://github.com/reactive/data-client/pull/2957) [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: Remove new AbortOptimistic() in favor of [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)

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

- [#2972](https://github.com/reactive/data-client/pull/2972) [`bb24601`](https://github.com/reactive/data-client/commit/bb24601e5ca5b0d92b8db75f115fcfb99fb97563) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Entity.useIncoming → [Entity.shouldUpdate](https://dataclient.io/rest/api/Entity#shouldupdate))

  ```ts title="Before"
  class MyEntity extends Entity {
    // highlight-next-line
    static useIncoming(
      existingMeta: { date: number },
      incomingMeta: { date: number },
      existing: any,
      incoming: any,
    ) {
      return !deepEquals(existing, incoming);
    }
  }
  ```

  ```ts title="After"
  class MyEntity extends Entity {
    // highlight-next-line
    static shouldUpdate(
      existingMeta: { date: number },
      incomingMeta: { date: number },
      existing: any,
      incoming: any,
    ) {
      return !deepEquals(existing, incoming);
    }
  }
  ```

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: useCache(new Index(MyEntity)) -> useQuery(MyEntity)

  #### Before

  ```jsx
  const UserIndex = new Index(User);

  const bob = useCache(UserIndex, { username: "bob" });
  ```

  #### After

  ```jsx
  const bob = useQuery(User, { username: "bob" });
  ```

### Patch Changes

- [#2961](https://github.com/reactive/data-client/pull/2961) [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1) Thanks [@ntucker](https://github.com/ntucker)! - Allow pk() to return numbers

  Before:

  ```ts
  class MyEntity extends Entity {
    id = 0;
    pk() {
      return `${this.id}`;
    }
  }
  ```

  After:

  ```ts
  class MyEntity extends Entity {
    id = 0;
    pk() {
      return this.id;
    }
  }
  ```

- Updated dependencies [[`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`73de27f`](https://github.com/reactive/data-client/commit/73de27fadb214c3c2995ca558daa9736312de7a9), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`8377e0a`](https://github.com/reactive/data-client/commit/8377e0a157419f0f4c237c392a895fec1772854d), [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1), [`bb24601`](https://github.com/reactive/data-client/commit/bb24601e5ca5b0d92b8db75f115fcfb99fb97563), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`446f0b9`](https://github.com/reactive/data-client/commit/446f0b905f57c290e120c6f11a6b4708554283d1), [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd)]:
  - @data-client/endpoint@0.11.0

## 0.10.0

### Patch Changes

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474), [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae), [`bf9c79c`](https://github.com/reactive/data-client/commit/bf9c79cb42e3df091eafe63fee619764a7ae4350)]:
  - @data-client/endpoint@0.10.0

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- Updated dependencies [[`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8)]:
  - @data-client/endpoint@0.9.9

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/endpoint@0.9.4

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

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95)]:
  - @data-client/endpoint@0.9.3

## 0.9.2

### Patch Changes

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/endpoint@0.9.2

## 0.9.0

### Patch Changes

- Updated dependencies [[`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7)]:
  - @data-client/endpoint@0.9.0

## 0.8.2

### Patch Changes

- [`664d3eacff`](https://github.com/reactive/data-client/commit/664d3eacff08c3c75e8ed7c3ccc64ee21faa6f7f) Thanks [@ntucker](https://github.com/ntucker)! - Remove dev warning for old versions of client

- [#2799](https://github.com/reactive/data-client/pull/2799) [`26a3843d1b`](https://github.com/reactive/data-client/commit/26a3843d1b61900c385d8626d7062d6f0424c137) Thanks [@ntucker](https://github.com/ntucker)! - Removed some forms of automatic entity validation

  - Now allow missing schemas making it easier to declare partials
  - Removed logic for certain keys found out of defaults

  We are generally trying to be more lax and focus on catching
  clearly wrong signals. A lot of help comes from network response
  form detection.

- Updated dependencies [[`664d3eacff`](https://github.com/reactive/data-client/commit/664d3eacff08c3c75e8ed7c3ccc64ee21faa6f7f), [`26a3843d1b`](https://github.com/reactive/data-client/commit/26a3843d1b61900c385d8626d7062d6f0424c137)]:
  - @data-client/endpoint@0.8.2

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

## 0.8.0

### Patch Changes

- Updated dependencies [[`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1)]:
  - @data-client/endpoint@0.8.0

## 0.2.3

### Patch Changes

- a8936f5e6d: Entity.process() now gets an addition argument of 'args' (sent from endpoint)

  ```ts
  class Stream extends Entity {
    username = "";
    title = "";
    game = "";
    currentViewers = 0;
    live = false;

    pk() {
      return this.username;
    }
    static key = "Stream";

    process(value, parent, key, args) {
      const processed = super.process(value, parent, key, args);
      processed.username = args[0]?.username;
      return processed;
    }
  }
  ```

- Updated dependencies [a8936f5e6d]
  - @data-client/endpoint@0.2.8

## 0.2.2

### Patch Changes

- 318df89bf7: Add nonFilterArgumentKeys argument to Collection

  `nonFilterArgumentKeys` defines a test to determine which argument keys
  are not used for filtering the results. For instance, if your API uses
  'orderBy' to choose a sort - this argument would not influence which
  entities are included in the response.

  This allows customizing `createCollectionFilter` for the
  most common case

- Updated dependencies [318df89bf7]
- Updated dependencies [1fcaeb1a7b]
  - @data-client/endpoint@0.2.6

## 0.2.1

### Patch Changes

- 8af1b5a8ef: Detect unusable pk when pk is serialized
- Updated dependencies [f4b625df5a]
- Updated dependencies [8af1b5a8ef]
- Updated dependencies [6f3b39b585]
  - @data-client/endpoint@0.2.2

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 011cc20732: Remove FetchShape compatibility.
  This removes support for the legacy hooks in 'rest-hooks' like useResource()

### Patch Changes

- 9788090c55: Fix Collection creates (like push, unshift) normalizing when no collections are in store
- 9788090c55: Fix Collections handling single item with Union schema
- Updated dependencies [bf141cb5a5]
- Updated dependencies [9788090c55]
- Updated dependencies [9788090c55]
- Updated dependencies [011cc20732]
  - @data-client/endpoint@0.2.0
