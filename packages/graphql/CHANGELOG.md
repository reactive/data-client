# @data-client/graphql

## 0.15.7

### Patch Changes

- [#3738](https://github.com/reactive/data-client/pull/3738) [`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1) - Add `Collection.move` schema and `RestEndpoint.move` extender for moving entities between collections.

  `move` removes from collections matching the entity's existing state and adds to collections
  matching the new values (from the body/last arg). Works for both Array and Values collections.

  Path parameters filter collections by URL segments:

  ```ts
  const UserResource = resource({
    path: '/groups/:group/users/:id',
    schema: User,
  });

  // PATCH /groups/five/users/2 - moves user 2 from 'five' group to 'ten' group
  await ctrl.fetch(
    UserResource.getList.move,
    { group: 'five', id: '2' },
    { id: '2', group: 'ten' },
  );
  ```

  Search parameters filter collections by query args:

  ```ts
  const TaskResource = resource({
    path: '/tasks/:id',
    searchParams: {} as { status: string },
    schema: Task,
  });

  // PATCH /tasks/3 - moves task 3 from 'backlog' to 'in-progress'
  await ctrl.fetch(
    TaskResource.getList.move,
    { id: '3' },
    { id: '3', status: 'in-progress' },
  );
  ```

- Updated dependencies [[`4425a37`](https://github.com/reactive/data-client/commit/4425a371484d3eaed66240ea8c9c1c8874e220f1)]:
  - @data-client/endpoint@0.15.7

## 0.15.5

### Patch Changes

- [`e571bda`](https://github.com/reactive/data-client/commit/e571bdabd136fddee7aa414c91a775c5f66ce094) Thanks [@ntucker](https://github.com/ntucker)! - Add direct exports for schema classes from `@data-client/endpoint`

  Schema classes (`Union`, `Invalidate`, `Collection`, `Query`, `Values`, `All`) can now be imported directly instead of requiring the `schema` namespace.

  #### Before

  ```ts
  import { schema } from '@data-client/endpoint';
  const myUnion = new schema.Union({ users: User, groups: Group }, 'type');
  ```

  #### After

  ```ts
  import { Union } from '@data-client/endpoint';
  const myUnion = new Union({ users: User, groups: Group }, 'type');
  ```

  The `schema` namespace export remains available for backward compatibility.

- Updated dependencies [[`e571bda`](https://github.com/reactive/data-client/commit/e571bdabd136fddee7aa414c91a775c5f66ce094)]:
  - @data-client/endpoint@0.15.5

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

- Updated dependencies [[`4fe8779`](https://github.com/reactive/data-client/commit/4fe8779706cb14d9018b3375d07b486a758ccb57)]:
  - @data-client/endpoint@0.15.4

## 0.15.2

### Patch Changes

- [`243219c`](https://github.com/reactive/data-client/commit/243219ccc1acc8ffcbfe54e8cc4a9027819eb66a) Thanks [@ntucker](https://github.com/ntucker)! - Patch bump due to publishing mishap

- Updated dependencies [[`243219c`](https://github.com/reactive/data-client/commit/243219ccc1acc8ffcbfe54e8cc4a9027819eb66a)]:
  - @data-client/endpoint@0.15.2

## 0.15.0

### Minor Changes

- [#3685](https://github.com/reactive/data-client/pull/3685) [`56d575e`](https://github.com/reactive/data-client/commit/56d575e0219d5455df74321aee7bf85c2d490a61) Thanks [@ntucker](https://github.com/ntucker)! - Add [Union](https://dataclient.io/rest/api/Union) support to [schema.Invalidate](https://dataclient.io/rest/api/Invalidate)
  and [resource().delete](https://dataclient.io/rest/api/resource#delete) for polymorphic delete operations.

  [resource()](https://dataclient.io/rest/api/resource) with Union schema now automatically
  wraps the delete endpoint schema in Invalidate:

  ```ts
  const FeedResource = resource({
    path: '/feed/:id',
    schema: FeedUnion, // Union of Post, Comment, etc.
  });
  // FeedResource.delete automatically uses Invalidate(FeedUnion)
  await ctrl.fetch(FeedResource.delete, { id: '123' });
  ```

  For standalone endpoints, use `schema.Invalidate` directly:

  ```ts
  new schema.Invalidate(MyUnionSchema);
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

- [#3461](https://github.com/reactive/data-client/pull/3461) [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2) Thanks [@ntucker](https://github.com/ntucker)! - Remove `INVALID` symbol export

  Schemas can use delegate.invalidate() in normalize() or return delegate.INVALID in queryKey().

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

- [#3449](https://github.com/reactive/data-client/pull/3449) [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7) Thanks [@ntucker](https://github.com/ntucker)! - Fix: ensure string id in Entity set when process returns undefined (meaning INVALID)

- [`e2fff91`](https://github.com/reactive/data-client/commit/e2fff911e21864620dba8d9470142af9130aafed) Thanks [@ntucker](https://github.com/ntucker)! - fix: Collection.remove with Unions

- [#3684](https://github.com/reactive/data-client/pull/3684) [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f) Thanks [@ntucker](https://github.com/ntucker)! - Optimize normalization performance with faster loops and Set-based cycle detection

- [#3560](https://github.com/reactive/data-client/pull/3560) [`ba31c9b`](https://github.com/reactive/data-client/commit/ba31c9b2d3c4ec5620bb64e49daf9b18994b9290) Thanks [@ntucker](https://github.com/ntucker)! - Add Collection.remove

  ```ts
  ctrl.set(MyResource.getList.schema.remove, { id });
  ```

  ```ts
  const removeItem = MyResource.delete.extend({
    schema: MyResource.getList.schema.remove,
  });
  ```

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

- [#3558](https://github.com/reactive/data-client/pull/3558) [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f) Thanks [@ntucker](https://github.com/ntucker)! - Unions can query() without type discriminator

  #### Before

  ```tsx
  // @ts-expect-error
  const event = useQuery(EventUnion, { id });
  // event is undefined
  const newsEvent = useQuery(EventUnion, { id, type: 'news' });
  // newsEvent is found
  ```

  #### After

  ```tsx
  const event = useQuery(EventUnion, { id });
  // event is found
  const newsEvent = useQuery(EventUnion, { id, type: 'news' });
  // newsEvent is found
  ```

- Updated dependencies [[`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`56d575e`](https://github.com/reactive/data-client/commit/56d575e0219d5455df74321aee7bf85c2d490a61), [`e2fff91`](https://github.com/reactive/data-client/commit/e2fff911e21864620dba8d9470142af9130aafed), [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2), [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2), [`53de2ee`](https://github.com/reactive/data-client/commit/53de2eefb891a4783e3f1c7724dc25dc9e6a8e1f), [`ba31c9b`](https://github.com/reactive/data-client/commit/ba31c9b2d3c4ec5620bb64e49daf9b18994b9290), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`4dde1d6`](https://github.com/reactive/data-client/commit/4dde1d616e38d59b645573b12bbaba2f9cac7895), [`bab907c`](https://github.com/reactive/data-client/commit/bab907ce824c0f7da961d74c9fb8b64ce7c95141), [`5699005`](https://github.com/reactive/data-client/commit/5699005700206306bc70ff8237bf7ceaac241b82), [`939a4b0`](https://github.com/reactive/data-client/commit/939a4b01127ea1df9b4653931593487e4b0c23a2), [`fcb7d7d`](https://github.com/reactive/data-client/commit/fcb7d7db8061c2a7e12632071ecb9c6ddd8d154f), [`1f491a9`](https://github.com/reactive/data-client/commit/1f491a9e0082dca64ad042aaf7d377e17f459ae7), [`35552c7`](https://github.com/reactive/data-client/commit/35552c716e3b688d69212654f9f95a05ea26a7f8)]:
  - @data-client/endpoint@0.15.0

## 0.14.25

### Patch Changes

- [#3417](https://github.com/reactive/data-client/pull/3417) [`a6af54c`](https://github.com/reactive/data-client/commit/a6af54c1bc2193de47c96938df74b243cb82bfe6) Thanks [@ntucker](https://github.com/ntucker)! - Update getOptimisticResponse snapshot types to include getResponseMeta

- [#3407](https://github.com/reactive/data-client/pull/3407) [`d84899d`](https://github.com/reactive/data-client/commit/d84899de4fb784375ab7a34fff6fe23a2ed98037) Thanks [@ntucker](https://github.com/ntucker)! - Support dynamic invalidation/deletes

  Returning `undefined` from [Entity.process](https://dataclient.io/rest/api/Entity#process)
  will cause the [Entity](https://dataclient.io/rest/api/Entity) to be [invalidated](https://dataclient.io/docs/concepts/expiry-policy#invalidate-entity).
  This this allows us to invalidate dynamically; based on the particular response data.

  ```ts
  class PriceLevel extends Entity {
    price = 0;
    amount = 0;

    pk() {
      return this.price;
    }

    static process(
      input: [number, number],
      parent: any,
      key: string | undefined,
    ): any {
      const [price, amount] = input;
      if (amount === 0) return undefined;
      return { price, amount };
    }
  }
  ```

- Updated dependencies [[`a6af54c`](https://github.com/reactive/data-client/commit/a6af54c1bc2193de47c96938df74b243cb82bfe6), [`d84899d`](https://github.com/reactive/data-client/commit/d84899de4fb784375ab7a34fff6fe23a2ed98037)]:
  - @data-client/endpoint@0.14.25

## 0.14.21

### Patch Changes

- [#3384](https://github.com/reactive/data-client/pull/3384) [`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3) Thanks [@ntucker](https://github.com/ntucker)! - Reduce bundle sizes by 30% by removing unneeded polyfills

- Updated dependencies [[`24ad679`](https://github.com/reactive/data-client/commit/24ad679f58c7eb0d0e6917790b4ebb5ee234e1d3)]:
  - @data-client/endpoint@0.14.21

## 0.14.20

### Patch Changes

- [`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de) Thanks [@ntucker](https://github.com/ntucker)! - Remove unnecessary polyfills in build

- Updated dependencies [[`c3514c6`](https://github.com/reactive/data-client/commit/c3514c6afa2cd76dafa02adcfad6f6481a34b5de)]:
  - @data-client/endpoint@0.14.20

## 0.14.19

### Patch Changes

- [#3371](https://github.com/reactive/data-client/pull/3371) [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6) Thanks [@ntucker](https://github.com/ntucker)! - Add react-native entry to package.json exports

- [#3353](https://github.com/reactive/data-client/pull/3353) [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6) Thanks [@renovate](https://github.com/apps/renovate)! - Polyfills no longer pollute global scope

- Updated dependencies [[`cb4fb92`](https://github.com/reactive/data-client/commit/cb4fb922e305502ba8ab99c99b6012e753a87a3a), [`679d76a`](https://github.com/reactive/data-client/commit/679d76a36234dcf5993c0358f94d7e1db0505cc6), [`165afed`](https://github.com/reactive/data-client/commit/165afed083c0c63e9356bc8d1ee30dee8b916ed6)]:
  - @data-client/endpoint@0.14.19

## 0.14.17

### Patch Changes

- [#3281](https://github.com/reactive/data-client/pull/3281) [`99cd041`](https://github.com/reactive/data-client/commit/99cd04152532e13d8fb092ea800d381391d5aacd) Thanks [@ntucker](https://github.com/ntucker)! - Collections work with nested args

  This fixes [integration with qs library](https://dataclient.io/rest/api/RestEndpoint#using-qs-library) and more complex search parameters.

- [`25be07f`](https://github.com/reactive/data-client/commit/25be07f51c501003330d758993542bee3bd804e1) Thanks [@ntucker](https://github.com/ntucker)! - Update README to not say 'mixin' twice

- Updated dependencies [[`99cd041`](https://github.com/reactive/data-client/commit/99cd04152532e13d8fb092ea800d381391d5aacd)]:
  - @data-client/endpoint@0.14.17

## 0.14.16

### Patch Changes

- [`4580e62`](https://github.com/reactive/data-client/commit/4580e628764ab43de3e4607f8584bc6cb4173021) Thanks [@ntucker](https://github.com/ntucker)! - Update docstring for EntityMixin

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

- Updated dependencies [[`4580e62`](https://github.com/reactive/data-client/commit/4580e628764ab43de3e4607f8584bc6cb4173021), [`1f7b191`](https://github.com/reactive/data-client/commit/1f7b1913e9301230d9fdae23baba9e3c582e005c), [`43a955c`](https://github.com/reactive/data-client/commit/43a955c18684b4e0f5c1d79b2504e8ad2910816b)]:
  - @data-client/endpoint@0.14.16

## 0.14.12

### Patch Changes

- [`3b337e7`](https://github.com/reactive/data-client/commit/3b337e74e3f22f2fe48f6eb37084bbf58859bbe1) Thanks [@ntucker](https://github.com/ntucker)! - Add schema table to README

- [`11d4ccf`](https://github.com/reactive/data-client/commit/11d4ccfb4c630c25b847bf59ca1028eed8c2369e) Thanks [@ntucker](https://github.com/ntucker)! - Fix: Collection adders (push/unshift) should _not_ be Queryable

- Updated dependencies [[`3b337e7`](https://github.com/reactive/data-client/commit/3b337e74e3f22f2fe48f6eb37084bbf58859bbe1), [`11d4ccf`](https://github.com/reactive/data-client/commit/11d4ccfb4c630c25b847bf59ca1028eed8c2369e)]:
  - @data-client/endpoint@0.14.12

## 0.14.11

### Patch Changes

- [`87a65ba`](https://github.com/reactive/data-client/commit/87a65ba8b5f266a299ac3d9c78b6605deee5f4e2) Thanks [@ntucker](https://github.com/ntucker)! - Fix Entity types for TS 4.0 and below

- Updated dependencies [[`87a65ba`](https://github.com/reactive/data-client/commit/87a65ba8b5f266a299ac3d9c78b6605deee5f4e2)]:
  - @data-client/endpoint@0.14.11

## 0.14.10

### Patch Changes

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Do not require [Entity.pk()](https://dataclient.io/rest/api/Entity#pk)

  Default implementation uses `this.id`

- [#3188](https://github.com/reactive/data-client/pull/3188) [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab) Thanks [@ntucker](https://github.com/ntucker)! - Update README to remove Entity.pk() when it is default ('id')

- Updated dependencies [[`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab), [`cde7121`](https://github.com/reactive/data-client/commit/cde71212706a46bbfd13dd76e8cfc478b22fe2ab)]:
  - @data-client/endpoint@0.14.10

## 0.14.8

### Patch Changes

- [`bad1fb9`](https://github.com/reactive/data-client/commit/bad1fb909f8d60f19450bbf40df00d90e03a61c2) Thanks [@ntucker](https://github.com/ntucker)! - Update package description

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

- Updated dependencies [[`3fa9eb9`](https://github.com/reactive/data-client/commit/3fa9eb907d8760171da065168796b87e802d6666)]:
  - @data-client/endpoint@0.14.6

## 0.14.4

### Patch Changes

- [`0adad92`](https://github.com/reactive/data-client/commit/0adad9209265c388eb6d334afe681610bccfb877) Thanks [@ntucker](https://github.com/ntucker)! - Update debugging link

- Updated dependencies [[`0adad92`](https://github.com/reactive/data-client/commit/0adad9209265c388eb6d334afe681610bccfb877)]:
  - @data-client/endpoint@0.14.4

## 0.14.3

### Patch Changes

- [`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569) Thanks [@ntucker](https://github.com/ntucker)! - Remove name in toJSON() for Entities

- [`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569) Thanks [@ntucker](https://github.com/ntucker)! - Add toString() to Collection

- [`3058a8a`](https://github.com/reactive/data-client/commit/3058a8a7738eeea0a197c9ba2db2e8ee51e2fca3) Thanks [@ntucker](https://github.com/ntucker)! - Collection non-known (not Array/Values) key format improvement

  Now wraps in parens `()`: "(Todo)"

- Updated dependencies [[`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569), [`501cb82`](https://github.com/reactive/data-client/commit/501cb82c999030fd269b40eb760ae0dda568c569), [`3058a8a`](https://github.com/reactive/data-client/commit/3058a8a7738eeea0a197c9ba2db2e8ee51e2fca3)]:
  - @data-client/endpoint@0.14.3

## 0.14.1

### Patch Changes

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - Collection.key is shorter and more readable

  `[Todo]` for Arrays or `{Todo}` for Values

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - fix: Collection.key robust against class name mangling

- [#3151](https://github.com/reactive/data-client/pull/3151) [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f) Thanks [@ntucker](https://github.com/ntucker)! - Collections now work with polymorhpic schemas like Union

  Collections.key on polymorphic types lists their possible Entity keys: `[PushEvent;PullRequestEvent]`

- Updated dependencies [[`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f), [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f), [`428d618`](https://github.com/reactive/data-client/commit/428d618ce057d4eef23592a64ec9d1c6fb82f43f)]:
  - @data-client/endpoint@0.14.1

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

- Updated dependencies [[`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`2ad1811`](https://github.com/reactive/data-client/commit/2ad1811149cdc419f6462ace08efdb7766195b36), [`7bd322d`](https://github.com/reactive/data-client/commit/7bd322d585b0893561b3ffb3c5ad47b2764c18bd)]:
  - @data-client/endpoint@0.14.0

## 0.13.4

### Patch Changes

- Updated dependencies [[`720ff0c`](https://github.com/reactive/data-client/commit/720ff0c3d833ff4d1eb5020694131e87282b585d)]:
  - @data-client/endpoint@0.13.4

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
