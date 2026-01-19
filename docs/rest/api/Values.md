---
title: Values Schema - Declarative map data for React
sidebar_label: Values
---

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint, Values } from '@data-client/rest';

# Values

Like [Array](./Array), `Values` are unbounded in size. The definition here describes the types of values to expect,
with keys being any string.

Describes a map whose values follow the given schema.

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

:::tip

Make it mutable (new items can be [assigned](./Collection.md#assign)) with [Collections](./Collection.md)

:::

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Values` constructor. This method tends to be useful for creating circular references in schema.

:::info Naming

`Values` is named after [Object.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Object/values) as
its schemas are used for the value of an Object.

:::

## Usage

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/items'}),
args: [],
response: { firstThing: { id: 1 }, secondThing: { id: 2 } },
delay: 150,
},
]}>

```tsx title="ItemPage.tsx"
export class Item extends Entity {
  id = 0;
}
export const getItems = new RestEndpoint({
  path: '/items',
  schema: new Values(Item),
});
function ItemPage() {
  const items = useSuspense(getItems);
  return <pre>{JSON.stringify(items, undefined, 2)}</pre>;
}
render(<ItemPage />);
```

</HooksPlayground>

### Polymorphic types

If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like [Union](./Union.md) and [schema.Array](./Array.md).

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

```tsx title="api/Feed"
export abstract class FeedItem extends Entity {
  id = 0;
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
  schema: new Values(
    {
      link: Link,
      post: Post,
    },
    'type',
  ),
});
```

```tsx title="FeedList" collapsed
import { getFeed, Link, Post } from './api/Feed';

function FeedList() {
  const feedItems = useSuspense(getFeed);
  return (
    <div>
      {Object.entries(feedItems).map(([key, item]) => (
        <div key={item.pk()}>
          {key}:{' '}
          {item.type === 'link' ? (
            <LinkItem link={item} />
          ) : (
            <PostItem post={item} />
          )}
        </div>
      ))}
    </div>
  );
}
function LinkItem({ link }: { link: Link }) {
  return <a href={link.url}>{link.title}</a>;
}
function PostItem({ post }: { post: Post }) {
  return <span>{post.content}</span>;
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
export abstract class FeedItem extends Entity {
  id = 0;
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
  schema: new Values(
    {
      links: Link,
      posts: Post,
    },
    (input: Link | Post, parent: unknown, key: string) => `${input.type}s`,
  ),
});
```

```tsx title="FeedList" collapsed
import { getFeed, Link, Post } from './api/Feed';

function FeedList() {
  const feedItems = useSuspense(getFeed);
  return (
    <div>
      {Object.entries(feedItems).map(([key, item]) => (
        <div key={item.pk()}>
          {key}:{' '}
          {item.type === 'link' ? (
            <LinkItem link={item} />
          ) : (
            <PostItem post={item} />
          )}
        </div>
      ))}
    </div>
  );
}
function LinkItem({ link }: { link: Link }) {
  return <a href={link.url}>{link.title}</a>;
}
function PostItem({ post }: { post: Post }) {
  return <span>{post.content}</span>;
}
render(<FeedList />);
```

</HooksPlayground>
