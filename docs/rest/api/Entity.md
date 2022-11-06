---
title: Entity
---

<head>
  <title>Entity - Declarative Data Normalization | Rest Hooks</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@rest-hooks/rest';

<LanguageTabs>

```typescript
import { Entity } from '@rest-hooks/endpoint';

export default class Article extends Entity {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];

  pk() {
    return this.id?.toString();
  }

  static get key() {
    return 'Article';
  }
}
```

```js
import { Entity } from '@rest-hooks/endpoint';

export default class Article extends Entity {
  id = undefined;
  title = '';
  content = '';
  author = null;
  tags = [];

  pk() {
    return this.id?.toString();
  }

  static get key() {
    return 'Article';
  }
}
```

</LanguageTabs>

`Entity` is an abstract base class used to define data with some form of primary key (or `pk` for short).
When representing data from a relational database, this makes an Entity roughly map 1:1 with a table, where
each row represents an instance of the Entity.

By defining a `pk()` member, Rest Hooks will normalize entities, ensuring consistency and improve performance
by increasing cache hit rates.

:::tip

Entities are bound to Endpoints using [createResource.schema](./createResource.md#schema) or
[RestEndpoint.schema](./RestEndpoint.md#schema)

:::

## Data lifecycle

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## Methods

### static fromJS(props): Entity {#fromJS}

Factory method called during denormalization. Use this instead of `new MyEntity()`

### process(input, parent, key): processedEntity {#process}

Run at the start of normalization for this entity. Return value is saved in store
and sent to [pk()](#pk).

**Defaults** to simply copying the response (`{...input}`)

### abstract pk: (parent?, key?): pk? {#pk}

PK stands for _primary key_ and is intended to provide a standard means of retrieving
a key identifier for any `Entity`. In many cases there will simply be an 'id' field
member to return. In case of multicolumn you can simply join them together.

#### undefined value

A `undefined` can be used as a default to indicate the entity has not been created yet.
This is useful when initializing a creation form using [Entity.fromJS()](#static-fromjst-extends-typeof-simplerecordthis-t-props-partialabstractinstancetypet-abstractinstancetypet)
directly. If `pk()` resolves to null it is considered not persisted to the server,
and thus will not be kept in the cache.

#### Other uses

While the `pk()` definition is key (pun intended) for making the normalized cache work;
it also becomes quite convenient for sending to a react element when iterating on
list results:

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

### static get key(): string {#key}

This defines the key for the Entity itself, rather than an instance. This needs to be a globally
unique value.

### static useIncoming(existingMeta, incomingMeta, existing, incoming): mergedValue {#useincoming}

```typescript
static useIncoming(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
) {
  return existingMeta.fetchedAt <= incomingMeta.fetchedAt;
}
```

Override this to change the algorithm - for instance if having the absolutely correct latest value is important,
adding a timestamp to the entity and then using it to select the return value will solve any race conditions.

#### Example

```typescript
class LatestPriceEntity extends Entity {
  readonly id: string = '';
  readonly timestamp: string = '';
  readonly price: string = '0.0';
  readonly symbol: string = '';

  static useIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return existing.timestamp <= incoming.timestamp;
  }
}
```

#### Preventing updates

useIncoming can also be used to short-circuit an entity update.

```typescript
import deepEqual from 'deep-equal';

class LatestPriceEntity extends Entity {
  readonly id: string = '';
  readonly timestamp: string = '';
  readonly price: string = '0.0';
  readonly symbol: string = '';

  static useIncoming(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return !deepEqual(incoming, existing);
  }
}
```

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge<T extends typeof SimpleRecord>(
  existing: InstanceType<T>,
  incoming: InstanceType<T>,
  ) => InstanceType<T>
```

Merge is used to resolve the same entity. This can be because it was previously put in the cache,
or it was found in multiple places nested in one response. By default it is the SimpleRecord merge, which
prefers values from the newer item but only if they are actually set.

### static validate(processedEntity): errorMessage? {#validate}

Runs during both normalize and denormalize. Returning a string indicates an error (the string is the message).

During normalization a validation failure will result in an error for that fetch.

During denormalization a validation failure will mark that result as 'invalid' and thus
will block on fetching a result.

By **default** does some basic field existance checks in development mode only. Override to
disable or customize.

[Using validation for summary endpoints](../guides/summary-list.md)

### static infer(args, indexes, recurse): pk? {#infer}

Allows Rest Hooks to build a response without having to fetch if its entities can be found.

Returning `undefined` will not infer this entity

Returning `pk` string will attempt to lookup this entity and use in the response.

When inferring a response, this entity's expiresAt is used to compute the expiry policy.

By **default** uses the first argument to lookup in [pk()](#pk) and [indexes](#indexes)

### static expiresAt(meta: { expiresAt: number; date: number }, input: any): expiresAt {#expiresat}

This determines expiry time when entity is part of a result that is inferred.

Overriding can be used to change TTL policy specifically for inferred responses.

### static indexes?: (keyof this)[] {#indexes}

Indexes enable increased performance when doing lookups based on those parameters. Add
fieldnames (like `slug`, `username`) to the list that you want to send as params to lookup
later.

> #### Note:
>
> Don't add your primary key like `id` to the indexes list, as that will already be optimized.

#### useSuspense()

With [useSuspense()](/docs/api/useSuspense) this will eagerly infer the results from entities table if possible,
rendering without needing to complete the fetch. This is typically helpful when the entities
cache has already been populated by another request like a list request.

```typescript
export class User extends Entity {
  readonly id: number | undefined = undefined;
  readonly username: string = '';
  readonly email: string = '';
  readonly isAdmin: boolean = false;

  pk() {
    return this.id?.toString();
  }

  static urlRoot = 'http://test.com/user/';

  // right here
  static indexes = ['username' as const];
}
export const UserResource = new createResource({
  path: '/user/:id',
  schema: User,
});
```

```tsx
const user = useSuspense(UserResource.get, { username: 'bob' });
```

#### useCache()

With [useCache()](/docs/api/useCache), this enables accessing results retrieved inside other requests - even
if there is no endpoint it can be fetched from.

```typescript
class LatestPrice extends Entity {
  readonly id: string = '';
  readonly symbol: string = '';
  readonly price: string = '0.0';
  static indexes = ['symbol'] as const;
}
const latestPriceFromCache = new Index(LatestPrice);
```

```typescript
class Asset extends Entity {
  readonly id: string = '';
  readonly price: string = '';

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
const price = useCache(latestPriceFromCache, { symbol: 'BTC' });
```

### static schema: { [k: keyof this]: Schema } {#schema}

Set this to [define entities nested](/rest/guides/nested-response) inside this one.

Additionally can be used to [declare field deserialization](/rest/guides/network-transform#deserializing-fields)

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

```tsx title="PostPage.tsx"
export class User extends Entity {
  id = '';
  name = '';
  pk() {
    return this.id;
  }
}
export class Post extends Entity {
  id = '';
  author = User.fromJS({});
  createdAt = new Date(0);
  content = '';
  title = '';

  static schema = {
    author: User,
    createdAt: Date,
  };
  pk() {
    return this.id;
  }
}
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
        {Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
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
  readonly friend: User | null = null; // this field is optional
  readonly lastUpdated: Date = new Date(0);

  static schema = {
    friend: User,
    lastUpdated: Date,
  };
}
```
