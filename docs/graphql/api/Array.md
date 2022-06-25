---
title: schema.Array
---
<head>
  <title>schema.Array - Representing Arrays | Rest Hooks</title>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';

Creates a schema to normalize an array of schemas. If the input value is an `Object` instead of an `Array`,
the normalized result will be an `Array` of the `Object`'s values.

_Note: The same behavior can be defined with shorthand syntax: `[ mySchema ]`_

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Array` constructor. This method tends to be useful for creating circular references in schema.

## Usage

To describe a simple array of a singular entity type:

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve([
  { id: '123', name: 'Jim' },
  { id: '456', name: 'Jane' },
]);

class User extends Entity {
  readonly name: string = '';
  pk() {
    return this.id;
  }
}
const userList = new Endpoint(sampleData, {
  schema:
    new schema.Array(User),
  ,
});
function UsersPage() {
  const users = useSuspense(userList, {});
  return (
    <div>
      {users.map(user => <div key={user.pk()}>{user.name}</div>)}
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Dynamic entity types

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

#### string schemaAttribute

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve([
    { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    { id: 10, type: 'post', content: 'good day!' },
  ]);

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
    new schema.Array(
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

<HooksPlayground groupId="schema" defaultOpen="y">

```tsx
const sampleData = () =>
  Promise.resolve([
    { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },
    { id: 10, type: 'post', content: 'good day!' },
  ]);

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
    new schema.Array(
      {
        links: Link,
        posts: Post,
      },
      (input, parent, key) => `${input.type}s`,
    ),
  ,
});
function FeedList() {
  const feedItems = useSuspense(feed, {});
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
