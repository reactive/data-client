# @data-client/endpoint

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

## 0.14.19

### Patch Changes

- [`cb4fb92`](https://github.com/reactive/data-client/commit/cb4fb922e305502ba8ab99c99b6012e753a87a3a) Thanks [@ntucker](https://github.com/ntucker)! - Remove typing redundancy

- [#3371](https://github.com/reactive/data-client/pull/3371) [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6) Thanks [@ntucker](https://github.com/ntucker)! - Add react-native entry to package.json exports

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

## 0.14.17

### Patch Changes

- [#3281](https://github.com/reactive/data-client/pull/3281) [`99cd041`](https://github.com/reactive/data-client/commit/99cd04152532e13d8fb092ea800d381391d5aacd) Thanks [@ntucker](https://github.com/ntucker)! - Collections work with nested args

  This fixes [integration with qs library](https://dataclient.io/rest/api/RestEndpoint#using-qs-library) and more complex search parameters.

## 0.14.16

### Patch Changes

- [`4580e62`](https://github.com/reactive/data-client/commit/4580e628764ab43de3e4607f8584bc6cb4173021) Thanks [@ntucker](https://github.com/ntucker)! - Update docstring for EntityMixin

- [`1f7b191`](https://github.com/reactive/data-client/commit/1f7b1913e9301230d9fdae23baba9e3c582e005c) Thanks [@ntucker](https://github.com/ntucker)! - Update Entity docstring

- [#3243](https://github.com/reactive/data-client/pull/3243) [`43a955c`](https://github.com/reactive/data-client/commit/43a955c18684b4e0f5c1d79b2504e8ad2910816b) Thanks [@ntucker](https://github.com/ntucker)! - `schema.Entity` -> [EntityMixin](https://dataclient.io/rest/api/EntityMixin)

  ```ts
  import { EntityMixin } from '@data-client/rest';

  export class Article {
    id = '';
    title = '';
    content = '';
    tags: string[] = [];
  }

  export class ArticleEntity extends EntityMixin(Article) {}
  ```

  We keep `schema.Entity` for legacy, and add schema.EntityMixin and [EntityMixin](https://dataclient.io/rest/api/EntityMixin) as direct export

## 0.14.12

### Patch Changes

- [`3b337e7`](https://github.com/reactive/data-client/commit/3b337e74e3f22f2fe48f6eb37084bbf58859bbe1) Thanks [@ntucker](https://github.com/ntucker)! - Add schema table to README

- [`11d4ccf`](https://github.com/reactive/data-client/commit/11d4ccfb4c630c25b847bf59ca1028eed8c2369e) Thanks [@ntucker](https://github.com/ntucker)! - Fix: Collection adders (push/unshift) should _not_ be Queryable

## 0.14.11

### Patch Changes

- [`87a65ba`](https://github.com/reactive/data-client/commit/87a65ba8b5f266a299ac3d9c78b6605deee5f4e2) Thanks [@ntucker](https://github.com/ntucker)! - Fix Entity types for TS 4.0 and below

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Do not require [Entity.pk()](https://dataclient.io/rest/api/Entity#pk)

  Default implementation uses `this.id`

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

## 0.14.4

### Patch Changes

- [`0adad92`](https://github.com/reactive/data-client/commit/0adad9209265c388eb6d334afe681610bccfb877) Thanks [@ntucker](https://github.com/ntucker)! - Update debugging link

## 0.14.3

### Patch Changes

- [`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569) Thanks [@ntucker](https://github.com/ntucker)! - Remove name in toJSON() for Entities

- [`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569) Thanks [@ntucker](https://github.com/ntucker)! - Add toString() to Collection

- [`3058a8a`](https://github.com/reactive/data-client/commit/3058a8a7738eeea0a197c9ba2db2e8ee51e2fca3) Thanks [@ntucker](https://github.com/ntucker)! - Collection non-known (not Array/Values) key format improvement

  Now wraps in parens `()`: "(Todo)"

## 0.14.1

### Patch Changes

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - Collection.key is shorter and more readable

  `[Todo]` for Arrays or `{Todo}` for Values

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - fix: Collection.key robust against class name mangling

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - Collections now work with polymorhpic schemas like Union

  Collections.key on polymorphic types lists their possible Entity keys: `[PushEvent;PullRequestEvent]`

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

### Patch Changes

- [#3133](https://github.com/reactive/data-client/pull/3133) [`7bd322d`](https://github.com/reactive/data-client/commit/7bd322d585b0893561b3ffb3c5ad47b2764c18bd) Thanks [@ntucker](https://github.com/ntucker)! - Validate after marking cirucular reference loops

  This should not change any behavior as validate should be deterministic so if it fails
  it will fail again and failure measure throwing which exits the whole stack.
  This improves code grouping. (And possibly cache locality improvement - though didn't check.)

## 0.13.4

### Patch Changes

- [`720ff0c`](https://github.com/reactive/data-client/commit/720ff0c3d833ff4d1eb5020694131e87282b585d) Thanks [@ntucker](https://github.com/ntucker)! - Update keywords

## 0.12.7

### Patch Changes

- [`4bc9145`](https://github.com/reactive/data-client/commit/4bc914574116d285f81546ffe37ead3e8aa339dc) Thanks [@ntucker](https://github.com/ntucker)! - Improve readability of Collection generics by naming DefaultArgs

- [#3063](https://github.com/reactive/data-client/pull/3063) [`2080c87`](https://github.com/reactive/data-client/commit/2080c8751df147a839f03eade9804d57291d12fb) Thanks [@ntucker](https://github.com/ntucker)! - Polymorphic (Union) types should still denormalize when handling passthrough (non-normalized) data

  When denormalizing non-normalized (like return of ctrl.fetch), it is still expected to handle
  all steps like constructing class instances if possible. However, to do this for Polymorphic
  types we need to fallback to using part of the normalize process to find out _which_ schema
  to use for the remainder of denormalization.

- [`4bc9145`](https://github.com/reactive/data-client/commit/4bc914574116d285f81546ffe37ead3e8aa339dc) Thanks [@ntucker](https://github.com/ntucker)! - Add docstrings to schema constructors

## 0.12.6

### Patch Changes

- [`19832bc`](https://github.com/reactive/data-client/commit/19832bc1ee15805788697748b275c134ea81ebf6) Thanks [@ntucker](https://github.com/ntucker)! - Add docstrings to Collection methods

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

- [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259) Thanks [@ntucker](https://github.com/ntucker)! - Update SnapshotInterface to include improvements in getError type

## 0.11.4

### Patch Changes

- [#3020](https://github.com/reactive/data-client/pull/3020) [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d) Thanks [@ntucker](https://github.com/ntucker)! - Add NI<> utility type that is back-compat NoInfer<>

## 0.11.3

### Patch Changes

- [#3017](https://github.com/reactive/data-client/pull/3017) [`ce164d2`](https://github.com/reactive/data-client/commit/ce164d286c8afcb2593a86abbf23948a08aa40ba) Thanks [@ntucker](https://github.com/ntucker)! - Queries pass-through suspense rather than ever being undefined

  - [useSuspense()](https://dataclient.io/docs/api/useSuspense) return values will not be nullable
  - [useQuery()](https://dataclient.io/docs/api/useQuery) will still be nullable due to it handling `INVALID` as `undefined` return
  - [Query.process](https://dataclient.io/rest/api/Query#process) does not need to handle nullable cases

## 0.11.1

### Patch Changes

- [#3006](https://github.com/reactive/data-client/pull/3006) [`13c6466`](https://github.com/reactive/data-client/commit/13c64662bce3813869140bc709badffc59929c5e) Thanks [@ntucker](https://github.com/ntucker)! - Endpoint.sideEffect can be `false`

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
        return entries.filter(user => user.isAdmin === isAdmin).length;
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
        return entries.filter(user => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );

  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
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

  const bob = useCache(UserIndex, { username: 'bob' });
  ```

  #### After

  ```jsx
  const bob = useQuery(User, { username: 'bob' });
  ```

### Patch Changes

- [`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4) Thanks [@ntucker](https://github.com/ntucker)! - Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds

  - `unvisit()` always returns `undefined` with `undefined` as input.
  - `All` returns INVALID from `queryKey()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)

- [`73de27f`](https://github.com/reactive/data-client/commit/73de27fadb214c3c2995ca558daa9736312de7a9) Thanks [@ntucker](https://github.com/ntucker)! - Slight code reduction in EntitySchema.normalize

- [`8377e0a`](https://github.com/reactive/data-client/commit/8377e0a157419f0f4c237c392a895fec1772854d) Thanks [@ntucker](https://github.com/ntucker)! - Default Collection Args type is:

  ```ts
  | []
  | [urlParams: Record<string, any>]
  | [urlParams: Record<string, any>, body: any]
  ```

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

- [#2978](https://github.com/reactive/data-client/pull/2978) [`f68750f`](https://github.com/reactive/data-client/commit/f68750f8b0cafa66f6d50521e474db5e3d3c9cdd) Thanks [@ntucker](https://github.com/ntucker)! - More robustly handle Union queries when the schema cannot be found

## 0.10.0

### Minor Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object

  - `[]` and [schema.Array](https://dataclient.io/rest/api/Array) now behave in the same manner.
  - `null` values are now consistently handled everywhere (being retained).
    - These were already being retained in [nested Entities](https://dataclient.io/rest/guides/relational-data#nesting)
  - `undefined` is still filtered out.

### Patch Changes

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- [`bf9c79c`](https://github.com/reactive/data-client/commit/bf9c79cb42e3df091eafe63fee619764a7ae4350) Thanks [@ntucker](https://github.com/ntucker)! - docs: Fix Entity links

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

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

## 0.9.0

### Patch Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Improve Collection toJSON

## 0.8.2

### Patch Changes

- [`664d3eacff`](https://github.com/reactive/data-client/commit/664d3eacff08c3c75e8ed7c3ccc64ee21faa6f7f) Thanks [@ntucker](https://github.com/ntucker)! - Remove dev warning for old versions of client

- [#2799](https://github.com/reactive/data-client/pull/2799) [`26a3843d1b`](https://github.com/reactive/data-client/commit/26a3843d1b61900c385d8626d7062d6f0424c137) Thanks [@ntucker](https://github.com/ntucker)! - Removed some forms of automatic entity validation

  - Now allow missing schemas making it easier to declare partials
  - Removed logic for certain keys found out of defaults

  We are generally trying to be more lax and focus on catching
  clearly wrong signals. A lot of help comes from network response
  form detection.

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

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

## 0.2.8

### Patch Changes

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

## 0.2.7

### Patch Changes

- b60a4a558e: Change internal organization of some types

## 0.2.6

### Patch Changes

- 318df89bf7: Add nonFilterArgumentKeys argument to Collection

  `nonFilterArgumentKeys` defines a test to determine which argument keys
  are not used for filtering the results. For instance, if your API uses
  'orderBy' to choose a sort - this argument would not influence which
  entities are included in the response.

  This allows customizing `createCollectionFilter` for the
  most common case

- 1fcaeb1a7b: Fix some versions of RN not working with Collections

  (Array.sort() does not exist in all versions)

## 0.2.5

### Patch Changes

- 5a16f86668: Allowing Collection class override for createCollectionFilter default
- 4317adb94c: Collections with arguments in different orders now correctly mean the same Collection

  This could sometimes result in different instances of a Collection having different values.

## 0.2.4

### Patch Changes

- c8c5575e5a: Ignore 'undefined' parameters in collection matching
- 4e9d34ebc1: Optimistic creates no longer need a 'fake pk'

  e.g.,

  ```ts
  controller.fetch(TodoResource.getList.push, {
    // id: randomId(), THIS IS NO LONGER NEEDED
    userId,
    title: e.currentTarget.value,
  });
  ```

  This is achieved by computing a random id when a pk cannot be
  computed. In development mode non-create endpoints will
  still throw when pk fails.

## 0.2.3

### Patch Changes

- 8a71700644: Add EndpointToFunction type
- 8a71700644: scheam.push/unshift type denormalize to singular item (for now)
- 8a71700644: fix: Support Collections with boolean parameters

## 0.2.2

### Patch Changes

- f4b625df5a: schema.Entity.key should always be enumerable
- 8af1b5a8ef: Detect unusable pk when pk is serialized
- 6f3b39b585: Only warn about name mangling when using SSR and only once per type

## 0.2.1

### Patch Changes

- 69ce1f8b6b: docs: Add some more JSDoc links
- 12c2596453: fix: Ensure Entit.key can be set in v8 browsers
- 6c8f0be900: enhance: Include class/function in error message regarding name mangling

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- 011cc20732: Remove FetchShape compatibility.
  This removes support for the legacy hooks in 'rest-hooks' like useResource()

### Patch Changes

- 9788090c55: Fix Collection creates (like push, unshift) normalizing when no collections are in store
- 9788090c55: Fix Collections handling single item with Union schema
