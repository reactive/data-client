---
title: GQLEntity
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import HooksPlayground from '@site/src/components/HooksPlayground';
import LanguageTabs from '@site/src/components/LanguageTabs';
import { RestEndpoint } from '@data-client/rest';
import { GQLEndpoint, GQLEntity } from '@data-client/graphql';
import { getPost } from './getPost.ts';

GraphQL has [one standard way](https://graphql.org/learn/global-object-identification/) of defining the [pk](/rest/api/Entity#pk), which is with an `id` field.

GQLEntity come with an `id` field automatically, which is used for the [pk](/rest/api/Entity#pk).

:::info extends

`GQLEntity` extends [Entity](/rest/api/Entity)

:::

## Usage

<TypeScriptEditor>

```typescript title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  username = '';
}
```

```typescript title="Article"
import { GQLEntity } from '@data-client/graphql';
import { User } from './User';

export class Article extends GQLEntity {
  title = '';
  content = '';
  author = User.fromJS();
  tags: string[] = [];
  createdAt = Temporal.Instant.fromEpochSeconds(0);

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

Entities are bound to [GQLEndpoints](./GQLEndpoint.md) using the second argument of `query` or `mutate`.

:::

Other static members overrides allow customizing the data lifecycle as seen below.

## Data lifecycle

import Lifecycle from '../diagrams/\_entity_lifecycle.mdx';

<Lifecycle/>

## Methods

### pk(parent?, key?, args?): string? {#pk}

PK stands for _primary key_ and is intended to provide a [standard means of retrieving
a key identifier](https://graphql.org/learn/global-object-identification/) for any `Entity`.

GraphQL uses the `id` field as the [standard global object identifier](https://graphql.org/learn/global-object-identification/).

```ts
pk() {
  return this.id;
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
class User extends GQLEntity {
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### static process(input, parent, key, args): processedEntity {#process}

Run at the start of normalization for this entity. Return value is saved in store.

**Defaults** to simply copying the response (`{...input}`)

How to override to [build reverse-lookups for relational data](/rest/guides/relational-data#reverse-lookups)

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

class Article extends GQLEntity {
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
import { GQLEntity } from '@data-client/graphql';

export class LatestPriceEntity extends GQLEntity {
  updatedAt = 0;
  price = '0.0';
  symbol = '';

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

How to override to [build reverse-lookups for relational data](/rest/guides/relational-data#reverse-lookups)

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

This method enables `Entities` to be [Queryable](/rest/api/schema#queryable) - allowing store access without an endpoint.

Overriding can allow customization or disabling of this behavior altogether.

Returning `undefined` will disallow this behavior.

Returning `pk` string will attempt to lookup this entity and use in the response.

When used, expiry policy is computed based on the entity's own meta data.

By **default** uses the first argument to lookup in [pk()](#pk) and [indexes](#indexes)

### static createIfValid(processedEntity): Entity | undefined {#createIfValid}

Called when denormalizing an entity. This will create an instance of this class
if it is deemed 'valid'.

`undefined` return will result in [Invalid expiry status](/docs/concepts/expiry-policy#expiry-status),
like [Invalidate](/rest/api/Invalidate).

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

[Using validation for endpoints with incomplete fields](/rest/guides/partial-entities)

### static fromJS(props): Entity {#fromJS}

Factory method that copies props to a new instance. Use this instead of `new MyEntity()`,
to ensure default props are overridden.

## Fields

### static schema: \{ [k: keyof this]: Schema } {#schema}

Defines [related entity](/rest/guides/relational-data) members, or
[field deserialization](/rest/guides/network-transform#deserializing-fields) like Date and BigNumber.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: getPost,
args: [{ id: '123' }],
response: {post:{
id: '5',
author: { id: '123', name: 'Jim' },
content: 'Happy day',
createdAt: '2019-01-23T06:07:48.311Z',
}},
delay: 150,
},
]}>

```ts title="User" collapsed
import { GQLEntity } from '@data-client/graphql';

export class User extends GQLEntity {
  name = '';
}
```

```ts title="Post"
import { GQLEntity } from '@data-client/graphql';
import { User } from './User';

export class Post extends GQLEntity {
  author = User.fromJS({});
  createdAt = Temporal.Instant.fromEpochSeconds(0);
  content = '';
  title = '';

  static schema = {
    author: User,
    createdAt: Temporal.Instant.from,
  };
  static key = 'Post';
}
```

```tsx title="PostPage" collapsed
import { GQLEndpoint } from '@data-client/graphql';
import { Post } from './Post';

const gql = new GQLEndpoint('https://fakeapi.com');
export const getPost = gql.query(
  (v: { id: string }) => `query getPost($id: ID!) {
    post(id: $id) {
      id
      author
      createdAt
      content
      title
    }
  }`,
  { post: Post },
);

function PostPage() {
  const { post } = useSuspense(getPost, { id: '123' });
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
class User extends GQLEntity {
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
