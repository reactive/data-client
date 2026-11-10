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
the store holds. Endpoints use it to render data another request loaded before their own response arrives
([Queryable](/docs/concepts/queryable)).

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

### Uses

- [Endpoints](/docs/concepts/queryable#endpoints) - [useSuspense()](/docs/api/useSuspense), [useDLE()](/docs/api/useDLE), [useCache()](/docs/api/useCache) and [Controller.fetchIfStale()](/docs/api/Controller#fetchIfStale) render stored data until the endpoint has a response of its own
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
