# @data-client/rest

## 0.11.5

### Patch Changes

- [#3028](https://github.com/reactive/data-client/pull/3028) [`b173c52`](https://github.com/reactive/data-client/commit/b173c52aa00bc9d57337983f01b2ce5c8ee84f6f) Thanks [@ntucker](https://github.com/ntucker)! - Warn for capitalization mistakes when calling createResource()

  `Endpoint` and `Collection` are both capitalized because they
  are classes. However, this may not be intuitive since other arguments are lower-first. Let's add a console.warn() to help
  guide, since this may be intentional?

  ```ts
  export const UserResource = createResource({
    urlPrefix: CONFIG.API_ROOT,
    path: "/users/:id",
    schema: User,
    // this should be 'Endpoint:'
    endpoint: AuthedEndpoint,
  });
  ```

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

- [#3004](https://github.com/reactive/data-client/pull/3004) [`18ec81e`](https://github.com/reactive/data-client/commit/18ec81eaacd1ab6e860653fa23ea95a0f5889e36) Thanks [@ntucker](https://github.com/ntucker)! - Allow sideEffect overrides when using .extend()

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

- [`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4) Thanks [@ntucker](https://github.com/ntucker)! - Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds

  - `unvisit()` always returns `undefined` with `undefined` as input.
  - `All` returns INVALID from `queryKey()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)

- [#2962](https://github.com/reactive/data-client/pull/2962) [`f6f195d`](https://github.com/reactive/data-client/commit/f6f195d573c7c51dc63361a48b2ef804181a348b) Thanks [@ntucker](https://github.com/ntucker)! - Improve .extend() typing when using loose null checks and no body parameter

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- [`8377e0a`](https://github.com/reactive/data-client/commit/8377e0a157419f0f4c237c392a895fec1772854d) Thanks [@ntucker](https://github.com/ntucker)! - fix: Resource.getList.schema args types

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

### Minor Changes

- [#2919](https://github.com/reactive/data-client/pull/2919) [`44f9ec2`](https://github.com/reactive/data-client/commit/44f9ec2801fe389a5afb215553a3441143078803) Thanks [@ntucker](https://github.com/ntucker)! - Add exports getUrlBase, getUrlTokens used to construct URLs

  This enables custom [RestEndpoint.url()](https://dataclient.io/rest/api/RestEndpoint#url) implementations

- [#2919](https://github.com/reactive/data-client/pull/2919) [`44f9ec2`](https://github.com/reactive/data-client/commit/44f9ec2801fe389a5afb215553a3441143078803) Thanks [@ntucker](https://github.com/ntucker)! - Add [RestEndpoint.searchToString()](https://dataclient.io/rest/api/RestEndpoint#searchToString)

  For example:

  To encode complex objects in the searchParams, you can use the [qs](https://github.com/ljharb/qs) library.

  ```typescript
  import { RestEndpoint, RestGenerics } from "@data-client/rest";
  import qs from "qs";

  class MyEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
    searchToString(searchParams) {
      return qs.stringify(searchParams);
    }
  }
  ```

### Patch Changes

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474), [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae), [`bf9c79c`](https://github.com/reactive/data-client/commit/bf9c79cb42e3df091eafe63fee619764a7ae4350)]:
  - @data-client/endpoint@0.10.0

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- Updated dependencies [[`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8)]:
  - @data-client/endpoint@0.9.9

## 0.9.8

### Patch Changes

- [#2837](https://github.com/reactive/data-client/pull/2837) [`57d87d6d85`](https://github.com/reactive/data-client/commit/57d87d6d851c19b4fd22eb57c629a7f2cab01f87) Thanks [@ntucker](https://github.com/ntucker)! - Query works with any Schema - including Collections

  ```ts
  export const queryRemainingTodos = new Query(
    TodoResource.getList.schema,
    (entries) => entries && entries.filter((todo) => !todo.completed).length,
  );
  ```

  NOTE: Query.schema internals are laid out differently

- Updated dependencies [[`57d87d6d85`](https://github.com/reactive/data-client/commit/57d87d6d851c19b4fd22eb57c629a7f2cab01f87)]:
  - @data-client/endpoint@0.9.8

## 0.9.5

### Patch Changes

- [`bb4b9583c5`](https://github.com/reactive/data-client/commit/bb4b9583c52e2b2fe45765af10b385b571901ee7) Thanks [@ntucker](https://github.com/ntucker)! - docs: Update readme

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

### Minor Changes

- [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Remove all /next exports

- [#2790](https://github.com/reactive/data-client/pull/2790) [`3f36f56939`](https://github.com/reactive/data-client/commit/3f36f5693961fe2c38af172fe192bd57bda488cb) Thanks [@ntucker](https://github.com/ntucker)! - Remove support for non-Collection [pagination](https://dataclient.io/rest/guides/pagination)

  BREAKING CHANGE: [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint) with Arrays no longer support [.paginated()](https://dataclient.io/rest/api/RestEndpoint#paginated)

- [#2789](https://github.com/reactive/data-client/pull/2789) [`440d415bc8`](https://github.com/reactive/data-client/commit/440d415bc81f1d44db2f192ff9634d2144403c61) Thanks [@ntucker](https://github.com/ntucker)! - getPage,push,unshift,assign should not match name of parent

  ```ts
  const getTodos = new RestEndpoint({
    urlPrefix: "https://jsonplaceholder.typicode.com",
    path: "/todos",
    schema: new schema.Collection([Todo]),
    name: "gettodos",
  });

  getTodos.getPage.name === "gettodos.getPage";
  getTodos.push.name === "gettodos.create";
  getTodos.unshift.name === "gettodos.create";
  ```

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

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

- Updated dependencies [[`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1)]:
  - @data-client/endpoint@0.8.0

## 0.7.6

### Patch Changes

- 8d9f6fe15c: fix: Export types needed for Resource.extend

  ```
  cannot be named without a reference to '../../node_modules/@data-client/rest/lib/resourceExtensionTypes'. This is likely not portable. A type annotation is necessary.ts(2742)
  ```

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

## 0.7.5

### Patch Changes

- b60a4a558e: Change internal organization of some types
- Updated dependencies [b60a4a558e]
  - @data-client/endpoint@0.2.7

## 0.7.4

### Patch Changes

- 7436b43f78: Fix Resource.extend() for builtin endpoints with zero typing options

  ```ts
  const RatingResource = createResource({
    path: "/ratings/:id",
    schema: Rating,
  }).extend({
    getList: {
      dataExpiryLength: 10 * 60 * 1000, // 10 minutes
    },
  });
  ```

  This would previously break the types of RatingResource.getList.
  This would only occur because dataExpiryLength is not a type-influencing option.

## 0.7.3

### Patch Changes

- e934b53551: Add [Collection](https://dataclient.io/rest/api/createResource#collection) option to [createResource](https://dataclient.io/rest/api/createResource)

## 0.7.2

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

## 0.7.1

### Patch Changes

- 4317adb94c: Collection based pagination now replaces the non-list members on page

  This allows members like nextPage or 'cursor' to be updated when
  each page is fetched making it easier to know which page to fetch next.

- Updated dependencies [5a16f86668]
- Updated dependencies [4317adb94c]
  - @data-client/endpoint@0.2.5

## 0.7.0

### Minor Changes

- c8c5575e5a: Add 'paginationField' parameter to [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint#paginationfield) and [createResource](https://dataclient.io/rest/api/createResource#paginationfield)

  This adds a '[getPage](https://dataclient.io/rest/api/RestEndpoint#getPage)' member; similar to getList.push/unshift but for [pagination](https://dataclient.io/rest/guides/pagination).

  ```ts
  const TodoResource = createResource({
    path: "/todos/:id",
    schema: Todo,
    paginationField: "page",
  }).getList.getPage({ page: "2" });
  ```

### Patch Changes

- c8c5575e5a: Fix case where sometimes paginating would not update a collection

  This was due to the comparison not using string serialization (canonical form for collection comparisons)

- c8c5575e5a: Ignore 'undefined' parameters in collection matching
- Updated dependencies [c8c5575e5a]
- Updated dependencies [4e9d34ebc1]
  - @data-client/endpoint@0.2.4

## 0.6.0

### Minor Changes

- af8b76079f: Support FormData in Resource updates and creates

## 0.5.0

### Minor Changes

- 51b4b0d188: Deprecate Resource.create
- 51b4b0d188: Add Resource.extend()

  This is polymorphic, and has three forms

  Set any field based on arguments:

  ```ts
  Resource.extend("fieldName", { path: "mypath/:id" });
  ```

  Override any of the provided endpoints with options:

  ```ts
  Resource.extend({
    getList: {
      path: "mypath/:id",
    },
    update: {
      body: {} as Other,
    },
  });
  ```

  Function to compute derived endpoints:

  ```ts
  Resource.extend((base) => ({
    getByComment: base.getList.extend({
      path: "repos/:owner/:repo/issues/comments/:comment/reactions",
    }),
  }));
  ```

  Idea credits: @Dav3rs

- 51b4b0d188: Remove createResource pagination field in favor of getList.paginated

### Patch Changes

- 51b4b0d188: Fix endpoint.push/unshift/assign method type

## 0.4.1

### Patch Changes

- 6e790725ae: Add more docstrings to RestEndpoint members
- 27274bcf21: Allow DELETE to have body if specified

## 0.4.0

### Minor Changes

- 8a71700644: push/unshift/assign inherit body type

### Patch Changes

- 8a71700644: scheam.push/unshift type denormalize to singular item (for now)
- 8a71700644: fix: Support Collections with boolean parameters
- Updated dependencies [8a71700644]
- Updated dependencies [8a71700644]
- Updated dependencies [8a71700644]
  - @data-client/endpoint@0.2.3

## 0.3.1

### Patch Changes

- 7b835f113a: Improve package tags
- 8af1b5a8ef: Detect unusable pk when pk is serialized
- Updated dependencies [f4b625df5a]
- Updated dependencies [8af1b5a8ef]
- Updated dependencies [6f3b39b585]
  - @data-client/endpoint@0.2.2

## 0.3.0

### Minor Changes

- ab9c805a6c: Add createResource() paginationField argument
  When supplied, will enable Resource.getNextPage

### Patch Changes

- 1efd401bef: fix(types): RestEndpoint.push/unshift/assign return type is no longer nested Promises
- 12c2596453: fix: Ensure Entit.key can be set in v8 browsers
- 1efd401bef: enhance: createResource() throws with path not containing any :path
- Updated dependencies [69ce1f8b6b]
- Updated dependencies [12c2596453]
- Updated dependencies [6c8f0be900]
  - @data-client/endpoint@0.2.1

## 0.2.0

### Minor Changes

BREAKING: Calling super.getRequestInit() will return a promise - so you must resolve it:

```ts
class AuthdEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  getRequestInit(body: any): RequestInit {
    return {
      ...super.getRequestInit(body),
      credentials: "same-origin",
    };
  }
}
```

->

```ts
class AuthdEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: "same-origin",
    };
  }
}
```

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 9788090c55: RestEndpoint's getRequestInit and getHeaders optionally return a promise
- 9788090c55: GetEndpoint and MutateEndpoint parameters changed to what NewXEndpoint was.
- 9788090c55: createResource() generics changed to O extends ResourceGenerics
  This allows customizing the Resource type with body and searchParams
- 9788090c55: createResource().getList uses a Collection, which .create appends to
  Remove any Endpoint.update as it is not necessary and will not work
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
