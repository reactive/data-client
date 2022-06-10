---
title: schema.Values
---
<head>
  <title>schema.Values - Representing Objects with arbitrary keys | Rest Hooks</title>
</head>

import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

Like [Array](./Array), `Values` are unbounded in size. The definition here describes the types of values to expect,
with keys being any string.

Describes a map whose values follow the given schema.

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Values` constructor. This method tends to be useful for creating circular references in schema.

## Usage

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve({ firstThing: { id: 1 }, secondThing: { id: 2 } });

class Item extends Entity {
  readonly id: number = 0;
  pk() {
    return `${this.id}`;
  }
}
const itemValues = new Endpoint(sampleData, {
  schema: new schema.Values(Item),
});
function ItemPage() {
  const items = useSuspense(itemValues, {});
  return <pre>{JSON.stringify(items, undefined, 2)}</pre>;
}
render(<ItemPage />);
```

</HooksPlayground>

### Dynamic entity types

If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like `schema.Union` and `schema.Array`.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

#### string schemaAttribute

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve({
    firstLink: { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    greatPost: { id: 10, type: 'post', content: 'good day!' },
  });

abstract class FeedItem extends Entity {
  readonly id: number = 0;
  declare readonly type: 'link' | 'post';
  pk() {
    return `${this.id}`;
  }
}
class Link extends FeedItem {
  readonly type = 'link' as const;
  readonly url: string = '';
  readonly title: string = '';
}
class Post extends FeedItem {
  readonly type = 'post' as const;
  readonly content: string = '';
}
const feed = new Endpoint(sampleData, {
  schema:
    new schema.Values(
      {
        link: Link,
        post: Post,
      },
      'type',
    ),
  ,
});
function FeedList() {
  const feedItems = useSuspense(feed, {});
  return (
    <div>
      {Object.entries(feedItems).map(([key, item]) =>
        (<div key={item.pk()}>{key}: {item.type === 'link' ? (
           <LinkItem link={item} />
        ) : (
          <PostItem post={item} />
        )}</div>),
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

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve({
    firstLink: { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    greatPost: { id: 10, type: 'post', content: 'good day!' },
  });

abstract class FeedItem extends Entity {
  readonly id: number = 0;
  declare readonly type: 'link' | 'post';
  pk() {
    return `${this.id}`;
  }
}
class Link extends FeedItem {
  readonly type = 'link' as const;
  readonly url: string = '';
  readonly title: string = '';
}
class Post extends FeedItem {
  readonly type = 'post' as const;
  readonly content: string = '';
}
const feed = new Endpoint(sampleData, {
  schema:
    new schema.Values(
      {
        links: Link,
        posts: Post,
      },
(input: any, parent: unknown, key: string) => `${input.type}s`,
    ),
  ,
});
function FeedList() {
  const feedItems = useSuspense(feed, {});
  return (
    <div>
      {Object.entries(feedItems).map(([key, item]) =>
        (<div key={item.pk()}>{key}: {item.type === 'link' ? (
           <LinkItem link={item} />
        ) : (
          <PostItem post={item} />
        )}</div>),
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
