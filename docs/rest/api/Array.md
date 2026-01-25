---
title: schema.Array - Declarative list data for React
sidebar_label: schema.Array
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

# schema.Array

Creates a schema to normalize an array of schemas. If the input value is an [Object](./Object.md) instead of an `Array`,
the normalized result will be an `Array` of the [Object](./Object.md)'s values.

_Note: The same behavior can be defined with shorthand syntax: `[ mySchema ]`_

- `definition`: **required** A singular schema that this array contains _or_ a mapping of attribute values to schema.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

:::tip

For unbounded collections with `string` keys, use [schema.Values](./Values.md)

:::

:::tip

Make it mutable (new items can be [pushed](./Collection.md#push)/[unshifted](./Collection.md#unshift)) with [Collections](./Collection.md)

:::

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Array` constructor. This method tends to be useful for creating circular references in schema.

## Usage

To describe a simple array of a singular entity type:

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
],
delay: 150,
},
]}>

```tsx title="Users.tsx"
import { Entity, RestEndpoint, schema } from '@data-client/rest';
import { useSuspense } from '@data-client/react';

export class User extends Entity {
  id = '';
  name = '';
}
export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new schema.Array(User),
});
function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Polymorphic types

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

:::note

If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.

:::

#### string schemaAttribute

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/feed'}),
args: [],
response: [
{ id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
{ id: 10, type: 'post', content: 'good day!' },
],
delay: 150,
},
]}>

```typescript title="api/Feed"
import { Entity, RestEndpoint, schema } from '@data-client/rest';

export abstract class FeedItem extends Entity {
  readonly id: number = 0;
  declare readonly type: 'link' | 'post';
}
export class Link extends FeedItem {
  readonly type = 'link' as const;
  readonly url: string = '';
  readonly title: string = '';
}
export class Post extends FeedItem {
  readonly type = 'post' as const;
  readonly content: string = '';
}
export const getFeed = new RestEndpoint({
  path: '/feed',
  schema: new schema.Array(
    {
      link: Link,
      post: Post,
    },
    'type',
  ),
});
```

```tsx title="FeedList" collapsed
import { useSuspense } from '@data-client/react';
import { getFeed, Link, Post } from './api/Feed';

function FeedList() {
  const feedItems = useSuspense(getFeed);
  return (
    <div>
      {feedItems.map(item =>
        item.type === 'link' ? (
          <LinkItem link={item} key={item.pk()} />
        ) : (
          <PostItem post={item} key={item.pk()} />
        ),
      )}
    </div>
  );
}
function LinkItem({ link }: { link: Link }) {
  return <a href={link.url}>{link.title}</a>;
}
function PostItem({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}
render(<FeedList />);
```

</HooksPlayground>

#### function schemaAttribute

The return values should match a key in the `definition`. Here we'll show the same behavior as the 'string'
case, except we'll append an 's'.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/feed'}),
args: [],
response: [
{ id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
{ id: 10, type: 'post', content: 'good day!' },
],
delay: 150,
},
]}>

```typescript title="api/Feed"
import { Entity, RestEndpoint, schema } from '@data-client/rest';

export abstract class FeedItem extends Entity {
  readonly id: number = 0;
  declare readonly type: 'link' | 'post';
}
export class Link extends FeedItem {
  readonly type = 'link' as const;
  readonly url: string = '';
  readonly title: string = '';
}
export class Post extends FeedItem {
  readonly type = 'post' as const;
  readonly content: string = '';
}
export const getFeed = new RestEndpoint({
  path: '/feed',
  schema: new schema.Array(
    {
      links: Link,
      posts: Post,
    },
    (input: Link | Post, parent, key) => `${input.type}s`,
  ),
});
```

```tsx title="FeedList" collapsed
import { useSuspense } from '@data-client/react';
import { getFeed, Link, Post } from './api/Feed';

function FeedList() {
  const feedItems = useSuspense(getFeed);
  return (
    <div>
      {feedItems.map(item =>
        item.type === 'link' ? (
          <LinkItem link={item} key={item.pk()} />
        ) : (
          <PostItem post={item} key={item.pk()} />
        ),
      )}
    </div>
  );
}
function LinkItem({ link }: { link: Link }) {
  return <a href={link.url}>{link.title}</a>;
}
function PostItem({ post }: { post: Post }) {
  return <div>{post.content}</div>;
}
render(<FeedList />);
```

</HooksPlayground>
