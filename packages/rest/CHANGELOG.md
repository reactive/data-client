# @data-client/rest

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
    entries => entries && entries.filter(todo => !todo.completed).length,
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
    urlPrefix: 'https://jsonplaceholder.typicode.com',
    path: '/todos',
    schema: new schema.Collection([Todo]),
    name: 'gettodos',
  });

  getTodos.getPage.name === 'gettodos.getPage';
  getTodos.push.name === 'gettodos.create';
  getTodos.unshift.name === 'gettodos.create';
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
    username = '';
    title = '';
    game = '';
    currentViewers = 0;
    live = false;

    pk() {
      return this.username;
    }
    static key = 'Stream';

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
    path: '/ratings/:id',
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
    path: '/todos/:id',
    schema: Todo,
    paginationField: 'page',
  }).getList.getPage({ page: '2' });
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
  Resource.extend('fieldName', { path: 'mypath/:id' });
  ```

  Override any of the provided endpoints with options:

  ```ts
  Resource.extend({
    getList: {
      path: 'mypath/:id',
    },
    update: {
      body: {} as Other,
    },
  });
  ```

  Function to compute derived endpoints:

  ```ts
  Resource.extend(base => ({
    getByComment: base.getList.extend({
      path: 'repos/:owner/:repo/issues/comments/:comment/reactions',
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
