---
title: Entity
---

<head>
  <title>Entity - Declarative unique objects for React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';

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
and overriding its [lifecycle methods](#data-lifecycle).

## Usage

<TypeScriptEditor>

```typescript title="User" collapsed
import { Entity } from '@data-client/rest';

export class User extends Entity {
  id = '';
  username = '';

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
  createdAt = Temporal.Instant.fromEpochSeconds(0);

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

Entities are bound to Endpoints using [createResource.schema](./createResource.md#schema) or
[RestEndpoint.schema](./RestEndpoint.md#schema)

:::

:::tip

If you already have your classes defined, [schema.Entity](./schema.Entity.md) mixin can also be
used to make Entities.

:::

Other static members overrides allow customizing the data lifecycle as seen below.

## Data lifecycle

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## Methods

### abstract pk(parent?, key?, args?): string? {#pk}

PK stands for _primary key_ and is intended to provide a standard means of retrieving
a key identifier for any `Entity`. In many cases there will simply be an 'id' field
member to return. In case of multicolumn you can simply join them together.

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

### static key: string {#key}

This defines the key for the Entity itself, rather than an instance. This needs to be a globally
unique value.

:::warning

This defaults to `this.name`; however this may break in production builds that change class names.
This is often know as [class name mangling](https://terser.org/docs/api-reference#mangle-options).

In these cases you can override `key` or disable class mangling.

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

### static process(input, parent, key, args): processedEntity {#process}

Run at the start of normalization for this entity. Return value is saved in store
and sent to [pk()](#pk).

**Defaults** to simply copying the response (`{...input}`)

How to override to [build reverse-lookups for relational data](../guides/relational-data.md#reverse-lookups)

#### Case of the missing id

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
    // super.process creates a copy of value
    const processed = super.process(value, parent, key, args);
    processed.username = args[0]?.username;
    return processed;
  }
}
```

### static mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: {
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  const shouldUpdate = this.shouldUpdate(
    existingMeta,
    incomingMeta,
    existing,
    incoming,
  );

  if (shouldUpdate) {
    // distinct types are not mergeable (like delete symbol), so just replace
    if (typeof incoming !== typeof existing) {
      return incoming;
    } else {
      return this.shouldReorder(
        existingMeta,
        incomingMeta,
        existing,
        incoming,
      )
        ? this.merge(incoming, existing)
        : this.merge(existing, incoming);
    }
  } else {
    return existing;
  }
}
```

`mergeWithStore()` is called during normalization when a processed entity is already found in the store.

This calls [shouldUpdate()](#shouldupdate), [shouldReorder()](#shouldreorder) and potentially [merge()](#merge)

### static shouldUpdate(existingMeta, incomingMeta, existing, incoming): boolean {#shouldupdate}

```typescript
static shouldUpdate(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
}
```

#### Preventing updates

shouldUpdate can also be used to short-circuit an entity update.

```typescript
import deepEqual from 'deep-equal';

class Article extends Entity {
  id = '';
  title = '';
  content = '';
  published = false;

  static shouldUpdate(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEqual(incoming, existing);
  }
}
```

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldreorder}

```typescript
static shouldReorder(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return incomingMeta.fetchedAt < existingMeta.fetchedAt;
}
```

`true` return value will reorder incoming vs in-store entity argument order in merge. With
the default merge, this will cause the fields of existing entities to override those of incoming,
rather than the other way around.

#### Example

<TypeScriptEditor>

```typescript path="shouldReorder"
class LatestPriceEntity extends Entity {
  id = '';
  updatedAt = 0;
  price = '0.0';
  symbol = '';

  pk() {
    return this.id;
  }

  static shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: { updatedAt: number },
    incoming: { updatedAt: number },
  ) {
    return incoming.updatedAt < existing.updatedAt;
  }
}
```

</TypeScriptEditor>

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return {
    ...existing,
    ...incoming,
  };
}
```

Merge is used to handle cases when an incoming entity is already found. This is called directly
when the same entity is found in one response. By default it is also called when [mergeWithStore()](#mergeWithStore)
determines the incoming entity should be merged with an entity already persisted in the Reactive Data Client store.

How to override to [build reverse-lookups for relational data](../guides/relational-data.md#reverse-lookups)

### static mergeMetaWithStore(existingMeta, incomingMeta, existing, incoming): meta {#mergeMetaWithStore}

```typescript
static mergeMetaWithStore(
  existingMeta: {
    expiresAt: number;
    date: number;
    fetchedAt: number;
  },
  incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
    ? existingMeta
    : incomingMeta;
}
```

`mergeMetaWithStore()` is called during normalization when a processed entity is already found in the store.

### static queryKey(args, queryKey, getEntity, getIndex): pk? {#queryKey}

This method enables `Entities` to be [Queryable](./schema.md#queryable) - allowing store access without an endpoint.

Overriding can allow customization or disabling of this behavior altogether.

Returning `undefined` will disallow this behavior.

Returning `pk` string will attempt to lookup this entity and use in the response.

When used, expiry policy is computed based on the entity's own meta data.

By **default** uses the first argument to lookup in [pk()](#pk) and [indexes](#indexes)

#### getEntity(key, pk?)

Gets all entities of a type with one argument, or a single entity with two

```ts title="One argument"
const entitiesEntry = getEntity(this.schema.key);
if (entitiesEntry === undefined) return INVALID;
return Object.values(entitiesEntry).map(
  entity => entity && this.schema.pk(entity),
);
```

```ts title="Two arguments"
if (getEntity(this.key, id)) return id;
```

#### getIndex(key, indexName, value)

Returns the index entry (value->pk map)

```ts
const value = args[0][indexName];
return getIndex(schema.key, indexName, value)[value];
```

### static createIfValid(processedEntity): Entity | undefined {#createIfValid}

Called when denormalizing an entity. This will create an instance of this class
if it is deemed 'valid'.

`undefined` return will result in [Invalid expiry status](/docs/concepts/expiry-policy#expiry-status),
like [Invalidate](./Invalidate.md).

[`Invalid`](/docs/concepts/expiry-policy#expiry-status) expiry generally means hooks will enter a loading state and attempt a new fetch.

```ts
static createIfValid(props): AbstractInstanceType<this> | undefined {
  if (this.validate(props)) {
    return undefined as any;
  }
  return this.fromJS(props);
}
```

### static validate(processedEntity): errorMessage? {#validate}

Runs during both normalize and denormalize. Returning a string indicates an error (the string is the message).

During normalization a validation failure will result in an error for that fetch.

During denormalization a validation failure will mark that result as 'invalid' and thus
will block on fetching a result.

By **default** does some basic field existance checks in development mode only. Override to
disable or customize.

[Using validation for endpoints with incomplete fields](../guides/partial-entities.md)

### static fromJS(props): Entity {#fromJS}

Factory method that copies props to a new instance. Use this instead of `new MyEntity()`,
to ensure default props are overridden.

## Fields

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
}
```

```ts title="Post"
import { Entity } from '@data-client/rest';
import { User } from './User';

export class Post extends Entity {
  id = '';
  author = User.fromJS({});
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  content = '';
  title = '';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
  pk() {
    return this.id;
  }
  static key = 'Post';
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
  lastUpdated = Temporal.Instant.fromEpochSeconds(0);

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

  pk() {
    return this.id?.toString();
  }

  // highlight-next-line
  static indexes = ['username' as const];
}
export const UserResource = createResource({
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
