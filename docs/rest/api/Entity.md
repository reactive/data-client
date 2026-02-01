---
title: Entity - Declarative unique objects for React
sidebar_label: Entity
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

# Entity

<div style={{float:'right'}}>

```ts
{
  Article: {
    '1': {
      id: '1',
      title: 'Entities define data',
    }
  }
}
```

</div>

`Entity` defines a single _unique_ object.

[Entity.key](#key) + [Entity.pk()](#pk) (primary key) enable a [flat lookup table](https://react.dev/learn/choosing-the-state-structure#principles-for-structuring-state) store, enabling high
performance, data consistency and atomic mutations.

`Entities` enable customizing the data processing lifecycle by defining its static members like [schema](#schema)
and overriding its [lifecycle methods](#lifecycle).

## Usage

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

  static key = 'User';
  pk() {
    return this.id;
  }
}
```

```typescript title="Article"
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Article extends Entity {
  id = '';
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Article';
  pk() {
    return this.id;
  }

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

</TypeScriptEditor>

[static schema](#schema) is a declarative definition of fields to process.
In this case, `author` is another `Entity` to be extracted, and `createdAt` will be converted
from a string to a [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
object.

:::tip

Entities are bound to Endpoints using [resource.schema](./resource.md#schema) or
[RestEndpoint.schema](./RestEndpoint.md#schema)

:::

:::tip

If you already have your classes defined, [EntityMixin](./EntityMixin.md) can also be
used to make Entities.

:::

Other static members overrides allow customizing the data lifecycle as seen below.

## Members

### pk(parent?, key?, args?): string | number | undefined {#pk}

<abbr title="Primary Key">pk</abbr> stands for [_primary key_](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS), uniquely identifying an `Entity` instance.
By default this returns the an Entity's `id` field.

Override this method to use other fields, or to for other cases like
multicolumn primary keys.

#### undefined value

A `undefined` can be used as a default to indicate the entity has not been created yet.
This is useful when initializing a creation form using [Entity.fromJS()](#fromJS)
directly. If `pk()` returns `undefined` it is considered not persisted to the server,
and thus will not be kept in the cache.

#### Other uses

Since `pk()` is unique, it provides a consistent way of defining [JSX list keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)

```tsx
//....
return (
  <div>
    {results.map(result => (
      <TheThing key={result.pk()} thing={result} />
    ))}
  </div>
);
```

#### Composite Primary Keys

When a single field isn't enough to uniquely identify an entity, you can combine multiple
fields into a composite key. This is common for nested resources or resources with
multi-part identifiers.

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = '';
  title = '';

  pk() {
    // Composite key from owner, repo, and issue number
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';
}
```

When entity data doesn't include all key parts directly, you can extract them from related
fields or endpoint arguments using [Entity.process()](#process):

```typescript
export class Issue extends Entity {
  number = 0;
  owner = '';
  repo = '';
  repositoryUrl = ''; // Contains: https://api.github.com/repos/{owner}/{repo}
  title = '';

  pk() {
    // Use owner/repo from process() which extracts from repositoryUrl
    return `${this.owner}/${this.repo}/${this.number}`;
  }

  static key = 'Issue';

  static process(input: any, parent: any, key: string, args: any[]) {
    // Extract owner and repo from the repositoryUrl
    const match = input.repositoryUrl?.match(/repos\/([^/]+)\/([^/]+)/);
    const owner = args[0]?.owner ?? match?.[1];
    const repo = args[0]?.repo ?? match?.[2];
    return { ...input, owner, repo };
  }
}
```

#### Singleton Entities

What if there is only ever once instance of a Entity for your entire application? You
don't really need to distinguish between each instance, so likely there was no `id` or
similar field defined in the API. In these cases you can just return a literal like
'the_only_one'.

```typescript
pk() {
  return 'the_only_one';
}
```

In case you have 

```typescript
const get = new RestEndpoint({
  path: '/options',
  schema: OptionsEntity,
});
export const OptionsResource = {
  get,
  partialUpdate: get.extend({ method: 'PATCH' }),
}
```

### static key: string {#key}

This defines the key for the Entity kind, rather than an instance. This needs to be a globally
unique value.

:::warning

This defaults to `this.name`; however this may break in production builds that change class names.
This is often know as [class name mangling](https://terser.org/docs/api-reference#mangle-options).

In these cases you can override `key` or disable class name mangling.

:::

```ts
class User extends Entity {
  id = '';
  username = '';

  pk() {
    return this.id;
  }
  // highlight-next-line
  static key = 'User';
}
```

### static schema: \{ [k: keyof this]: Schema } {#schema}

Defines [related entity](/rest/guides/relational-data) members, or
[field deserialization](/rest/guides/network-transform#deserializing-fields) like Date and BigNumber.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/posts/:id'}),
args: [{ id: '123' }],
response: {
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
},
delay: 150,
},
]}>

```ts title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';

  pk() {
    return this.id;
  }
  static key = 'User';
}
```

```ts title="Post" {16-20}
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Post extends Entity {
  id = '';
  author = User.fromJS();
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  content = '';
  title = '';

  pk() {
    return this.id;
  }
  static key = 'Post';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
}
```

```tsx title="PostPage" collapsed
import { Post } from './Post';

export const getPost = new RestEndpoint({
  path: '/posts/:id',
  schema: Post,
});
function PostPage() {
  const post = useSuspense(getPost, { id: '123' });
  return (
    <div>
      <p>
        {post.content} - <cite>{post.author.name}</cite>
      </p>
      <time>
        {DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          post.createdAt,
        )}
      </time>
    </div>
  );
}
render(<PostPage />);
```

</HooksPlayground>

#### Optional members

Entities references here whose default values in the Record definition itself are
considered 'optional'

```typescript
class User extends Entity {
  friend: User | null = null; // this field is optional
  lastUpdated = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    friend: User,
    lastUpdated: Temporal.Instant.from,
  };
}
```

### static indexes?: (keyof this)[] {#indexes}

Indexes enable increased performance when doing lookups based on those parameters. Add
fieldnames (like `slug`, `username`) to the list that you want to send as params to lookup
later.

:::note

Don't add your primary key like `id` to the indexes list, as that will already be optimized.

:::

#### useSuspense()

With [useSuspense()](/docs/api/useSuspense) this will eagerly infer the results from entities table if possible,
rendering without needing to complete the fetch. This is typically helpful when the entities
cache has already been populated by another request like a list request.

```typescript
export class User extends Entity {
  id: number | undefined = undefined;
  username = '';
  email = '';
  isAdmin = false;

  // highlight-next-line
  static indexes = ['username' as const];
}
export const UserResource = resource({
  path: '/user/:id',
  schema: User,
});
```

```tsx
const user = useSuspense(UserResource.get, { username: 'bob' });
```

#### useQuery()

With [useQuery()](/docs/api/useQuery), this enables accessing results retrieved inside other requests - even
if there is no endpoint it can be fetched from.

```typescript
class LatestPrice extends Entity {
  id = '';
  symbol = '';
  price = '0.0';

  static indexes = ['symbol' as const];
}
```

```typescript
class Asset extends Entity {
  id = '';
  price = '';

  static schema = {
    price: LatestPrice,
  };
}
const getAssets = new RestEndpoint({
  path: '/assets',
  schema: [Asset],
});
```

Some top level component:

```tsx
const assets = useSuspense(getAssets);
```

Nested below:

```tsx
const price = useQuery(LatestPrice, { symbol: 'BTC' });
```

## Lifecycle

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

import LifecycleMethods from '../shared/\_entity_lifecycle_methods.mdx';

<LifecycleMethods entitySyntax="Entity" />
