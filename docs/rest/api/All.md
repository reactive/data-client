---
title: All Schema - Access every entity in the Reactive Data Client store
sidebar_label: All
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';

# All

Retrieves all entities in cache as an Array.

- `definition`: **required** A singular [Entity](./Entity.md) that this array contains _or_ a mapping of attribute values to [Entities](./Entity.md).
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.
  Can be a string or a function. If given a function, accepts the following arguments:
  _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

## Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `All` constructor. This method tends to be useful for creating circular references in schema.

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
{
endpoint: new RestEndpoint({path: '/users', method:'POST'}),
args: [{ name: 'ABC' }],
response: { id: '777', name: 'ABC' },
delay: 150,
},
]}>

```tsx title="api/User" collapsed
export class User extends Entity {
  id = '';
  name = '';
}
export const createUser = new RestEndpoint({
  path: '/users',
  schema: User,
  body: { name: '' },
  method: 'POST'
});
```

```tsx title="NewUser" collapsed
import { useController } from '@data-client/react';
import { createUser } from './api/User';

export default function NewUser() {
  const ctrl = useController();
  const handlePress = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        ctrl.fetch(createUser, {name: e.currentTarget.value});
        e.currentTarget.value = '';
      }
    },
    [fetch],
  );
  return <input onKeyPress={handlePress}/>;
}
```

```tsx title="UsersPage.tsx"
import { RestEndpoint, All } from '@data-client/rest';
import { User } from './api/User';
import NewUser from './NewUser';

const getUsers = new RestEndpoint({
  path: '/users',
  schema: new All(User),
});

function UsersPage() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <div key={user.pk()}>{user.name}</div>
      ))}
      <NewUser />
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
  schema: new All(
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
  schema: new All(
    {
      links: Link,
      posts: Post,
    },
    (input: Link | Post, parent, key) => `${input.type}s`,
  ),
});
```

```tsx title="FeedList" collapsed
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
