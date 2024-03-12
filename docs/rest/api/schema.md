---
title: Thinking in Schemas
sidebar_label: Schema
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
import { Temporal } from '@js-temporal/polyfill';

class User extends Entity {
  id = '';
  name = '';

  pk() {
    return this.id;
  }
}

class Comment extends Entity {
  id = '';
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  commenter = User.fromJS();

  pk() {
    return this.id;
  }

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

  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    comments: [Comment],
  };
}
```

```javascript
import { schema, Entity } from '@data-client/endpoint';
import { Temporal } from '@js-temporal/polyfill';

class User extends Entity {
  pk() {
    return this.id;
  }
}

class Comment extends Entity {
  pk() {
    return this.id;
  }

  static schema = {
    commenter: User,
    createdAt: Temporal.Instant.from,
  };
}

class Article extends Entity {
  pk() {
    return this.id;
  }

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
const normalizedData = normalize(originalData, Article, args);
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
}
```

## Denormalize

```js
import { denormalize } from '@data-client/normalizr';

const denormalizedData = denormalize(
  normalizedData.result,
  Article,
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

## Queryable

`Queryable` Schemas allow store access without an endpoint. They achieve this using the
[queryKey](./Entity.md#queryKey) method that produces the results normally stored in the endpoint cache.

This enables their use in these additional cases:

- [useQuery()](/docs/api/useQuery) - Rendering in React
- [schema.Query()](./Query.md) - As input to produce a computed memoization.
- [ctrl.get](/docs/api/Controller#get)/[snap.get](/docs/api/Snapshot#get)
  - [Managers](/docs/concepts/managers)
  - React with [useController()](/docs/api/useController)
  - [RestEndpoint.getOptimisticResponse](./RestEndpoint.md#getoptimisticresponse)
  - [Unit testing hooks](/docs/guides/unit-testing-hooks) with [renderDataClient()](/docs/api/makeRenderDataClient#renderdataclient)
- Improve performance of [useSuspense](/docs/api/useSuspense), [useDLE](/docs/api/useDLE) by rendering before endpoint resolution

`Querables` include [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
and [Union](./Union.md).

```ts
interface Queryable {
  queryKey(
    args: readonly any[],
    indexes: NormalizedIndex,
    recurse: (...args: any) => any,
    entities: EntityTable,
    // `{}` means non-void
  ): {};
};
```

## Schema Overview

<SchemaTable/>
