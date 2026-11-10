---
title: Thinking in Schemas
sidebar_label: Schema
description: Declarative TypeScript data definitions. Mutable dynamic data applications without state management code.
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import SchemaTable from '../../core/shared/\_schema_table.mdx';

Consider a typical blog post. The API response for a single post might look something like this:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "createdAt": "2013-05-29T00:00:00-04:00",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    },
    {
      "id": "544",
      "createdAt": "2013-05-30T00:00:00-04:00",
      "commenter": {
        "id": "1",
        "name": "Paul"
      }
    }
  ]
}
```

## Declarative definitions

We have two nested [entity](./Entity.md) types within our `article`: `users` and `comments`. Using various [schema](./Entity.md#schema), we can normalize all three entity types down:

<LanguageTabs>

```typescript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity {
  id = '';
  name = '';
}

class Comment extends Entity {
  id = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  commenter = User.fromJS();

  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  id = '';
  title = '';
  author = User.fromJS();
  comments: Comment[] = [];

  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

```javascript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from 'temporal-polyfill';

class User extends Entity { }

class Comment extends Entity {
  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

</LanguageTabs>

## Normalize

```js
import { normalize } from '@data-client/normalizr';

const args = [{ id: '123' }];
const normalizedData = normalize(Article, originalData, args);
```

Now, `normalizedData` will create a single serializable source of truth for all entities:

```js
{
  result: "123",
  entities: {
    articles: {
      "123": {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: [ "324", "544" ]
      }
    },
    users: {
      "1": { "id": "1", "name": "Paul" },
      "2": { "id": "2", "name": "Nicole" }
    },
    comments: {
      "324": {
        id: "324",
        createdAt: "2013-05-29T00:00:00-04:00",
        commenter: "2"
      },
      "544": {
        id: "544",
        createdAt: "2013-05-30T00:00:00-04:00",
        commenter: "1"
      }
    }
  },
  // contents excluded for brevity
  indexes,
  entitiesMeta,
}
```

## Denormalize

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
```

Now, `denormalizedData` will instantiate the classes, ensuring all instances of the same member (like `Paul`) are referentially equal:

```js
Article {
  id: '123',
  title: 'My awesome blog post',
  author: User { id: '1', name: 'Paul' },
  comments: [
    Comment {
      id: '324',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '2', name: 'Nicole' }]
    },
    Comment {
      id: '544',
      createdAt: Instant [Temporal.Instant] {},
      commenter: [User { id: '1', name: 'Paul' }]
    }
  ]
}
```

### MemoCache

`MemoCache` is a singleton that can be used to maintain referential equality between calls as well
as potentially improved performance by 2000%. Its methods are memoized.

#### memo.denormalize

```js
import { MemoCache } from '@data-client/normalizr';

// you can construct a new memo anytime you want to reset the cache
const memo = new MemoCache();

const { data, paths } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);
const { data: data2 } = memo.denormalize(
  Article,
  normalizedData.result,
  normalizedData.entities,
  args,
);

// referential equality maintained between calls
assert(data === data2);
```

`memo.denormalize()` is just like [denormalize()](#denormalize) above but includes `paths` as part of the return value. `paths`
is an Array of paths of all entities included in the result.

#### memo.query

`memo.query()` allows denormalizing [Queryable](#queryable) based on args alone, rather than a normalized input.

```ts
const data = memo.query(
  Article,
  args,
  normalizedData,
);
```

## Queryable

A `Queryable` schema can produce its data from the store using only args, without a response. Its
[queryKey](./Entity.md#queryKey) method returns what a response would have normalized to, and returns it only for data
the store holds.

| Schema | `queryKey(args)` returns |
| --- | --- |
| [Entity](./Entity.md) | Its `pk`, when the store holds that Entity. By default, args with the fields `pk()` reads, like `{ id }`, find it ([how, and how to customize](./Entity.md#pk-args)) |
| [Collection](./Collection.md) | Its `pk` for those args, when the store holds that Collection |
| [Object](./Object.md) | Each member's `queryKey` with the same args |
| [Union](./Union.md) | The first member Entity the args find |
| [All](./All.md) | Every stored Entity of its type |
| [Query](./Query.md) | Its inner schema's result |

[Scalar](./Scalar.md) is Queryable too, and [Lazy](./Lazy.md) fields produce a Queryable via their
[`.query`](./Lazy.md#query) accessor. [Array](./Array.md), [Values](./Values.md) and [Invalidate](./Invalidate.md) are
not: their `queryKey` returns `undefined`. Wrap a list in a [Collection](./Collection.md) to make it Queryable.

### Endpoints query the store {#queryable-endpoints}

An endpoint reads its own response when it has one. Until then, an endpoint with a Queryable schema queries the store
with its args, and uses the result when it is complete: no part of it is `undefined`. Queryability is what lets a page
render data another request loaded, such as a detail page opened from a list
([Lists to details](/docs/getting-started/data-dependency#list-detail)).

A complete result is treated like a response. It expires when the first Entity in it expires, and the
[expiry policy](/docs/concepts/expiry-policy) applies as usual: stale data renders while it refetches, an
[invalidIfStale](/docs/concepts/expiry-policy#endpointinvalidifstale) or invalidated endpoint suspends, and an Entity
that fails [validate()](./Entity.md#validate) counts as missing. An incomplete result is missing data, so the endpoint
fetches.

The rest follows from these two rules:

- An Entity stored by any response is found by every endpoint whose args produce its `pk`.
- Args `queryKey` doesn't read, like `expand` in `{ id, expand: 'comments' }`, don't affect the result.
- An object schema like `{ data: Post }` is complete when every member is: an Array member never is, a Collection member
  is when the store holds it for those args, and two Entities must both be found by the same args. The result holds only
  the schema's members, so other values render as the schema's defaults until the endpoint's own response arrives.
- Once the endpoint has a response of its own, it reads that, with that response's expiry.

This applies wherever an endpoint is read: [useSuspense()](/docs/api/useSuspense), [useDLE()](/docs/api/useDLE),
[useCache()](/docs/api/useCache) and [Controller.fetchIfStale()](/docs/api/Controller#fetchIfStale).
[Controller.fetch()](/docs/api/Controller#fetch) always requests. [useQuery()](/docs/api/useQuery) runs the same
`queryKey` but ignores expiry, and returns an object schema even with a member missing.

### Other uses

- [useQuery()](/docs/api/useQuery) - Rendering in :react[React]:vue[Vue]
- [schema.Query()](./Query.md) - As input to produce a computed memoization.
- [ctrl.get](/docs/api/Controller#get)/[snap.get](/docs/api/Snapshot#get)
  - [Managers](/docs/concepts/managers)
  - :react[React]:vue[Vue] with [useController()](/docs/api/useController)
  - [RestEndpoint.getOptimisticResponse](./RestEndpoint.md#getoptimisticresponse)
  - :react[[Unit testing hooks](/docs/guides/unit-testing-hooks) with [renderDataHook()](/docs/api/renderDataHook)]:vue[[Unit testing composables](/docs/guides/unit-testing-composables) with `renderDataCompose()`]
- [memo.query()](#memoquery)

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    unvisit: (schema: any, args: readonly any[]) => any,
    delegate: IQueryDelegate,
    // Must be non-void
  ): {};
}
```

## Schema Overview

<SchemaTable/>
