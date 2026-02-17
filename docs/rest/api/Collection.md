---
title: Collection Schema - Mutable Lists and Maps
sidebar_label: Collection
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@data-client/rest';
import { v4 as uuid } from 'uuid';
import { postFixtures,getInitialInterceptorData } from '@site/src/fixtures/posts-collection';

# Collection

`Collections` define mutable [Lists (Array)](./Array.md) or [Maps (Values)](./Values.md).

This means they can grow and shrink. You can add to `Collection(Array)` with [.push](#push) or [.unshift](#unshift),
remove from `Collection(Array)` with [.remove](#remove), add to `Collections(Values)` with [.assign](#assign),
and move between collections with [.move](#move).

[RestEndpoint](./RestEndpoint.md) provides [.push](./RestEndpoint.md#push), [.unshift](./RestEndpoint.md#unshift), [.assign](./RestEndpoint.md#assign), [.remove](./RestEndpoint.md#remove), [.move](./RestEndpoint.md#move)
and [.getPage](./RestEndpoint.md#getpage)/ [.paginated()](./RestEndpoint.md#paginated) extenders when using `Collections`

## Usage

<HooksPlayground row fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{
id: '1',
username: 'bob',
name: 'Bob',
todos: [
{ id: '123', title: 'Build Collections', userId: '1' },
{ id: '456', title: 'Add atomic creation', userId: '1' },
]
},
{
id: '2',
username: 'alice',
name: 'Alice',
todos: [
{ id: '34', title: 'Use Collections', userId: '2' },
{ id: '453', title: 'Make a fast web app', userId: '2' },
]
}
],
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/todos', method: 'POST'}),
args: [],
response(body) {
return {id: uuid(),...body};
},
delay: 150,
},
]}>

```ts title="api/Todo" {15} collapsed
import { Entity, RestEndpoint, Collection } from '@data-client/rest';

export class Todo extends Entity {
  id = '';
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}

export const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo]),
});
```

```ts title="api/User" {13-17} collapsed
import { Entity, RestEndpoint, Collection } from '@data-client/rest';
import { Todo } from './Todo';

export class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: new Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}

export const getUsers = new RestEndpoint({
  path: '/users',
  schema: new Collection([User]),
});
```

```tsx title="NewTodo" {10-14}
import { useController } from '@data-client/react';
import { getTodos } from './api/Todo';

export default function NewTodo({ userId }: { userId?: string }) {
  const ctrl = useController();
  const [unshift, setUnshift] = React.useState(false);

  const handlePress = async e => {
    if (e.key === 'Enter') {
      const createTodo = unshift ? getTodos.unshift : getTodos.push;
      ctrl.fetch(createTodo, {
        title: e.currentTarget.value,
        userId,
      });
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="listItem nogap">
      <TextInput size="small" onKeyDown={handlePress} />
      <label>
        <input
          type="checkbox"
          checked={unshift}
          onChange={e => setUnshift(e.currentTarget.checked)}
        />{' '}
        unshift
      </label>
    </div>
  );
}
```

```tsx title="TodoList" collapsed
import { type Todo } from './api/Todo';
import NewTodo from './NewTodo';

export default function TodoList({
  todos,
  userId,
}: {
  todos: Todo[];
  userId: string;
}) {
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.pk()}>{todo.title}</div>
      ))}
      <NewTodo userId={userId} />
    </div>
  );
}
```

```tsx title="UserList" collapsed
import { useSuspense } from '@data-client/react';
import { getUsers } from './api/User';
import TodoList from './TodoList';

function UserList() {
  const users = useSuspense(getUsers);
  return (
    <div>
      {users.map(user => (
        <section key={user.pk()}>
          <h3>{user.name}</h3>
          <TodoList todos={user.todos} userId={user.id} />
        </section>
      ))}
    </div>
  );
}
render(<UserList />);
```

</HooksPlayground>

### Collection with Values

When an API returns keyed objects rather than arrays, combine `Collection` with [Values](./Values.md)
to enable mutations on the result.

```typescript
import { Entity, resource, Collection, Values } from '@data-client/rest';

class Stats extends Entity {
  product_id = '';
  volume = 0;
  price = 0;

  pk() {
    return this.product_id;
  }

  static key = 'Stats';
}

export const StatsResource = resource({
  urlPrefix: 'https://api.exchange.example.com',
  path: '/products/:product_id/stats',
  schema: Stats,
}).extend({
  getList: {
    path: '/products/stats',
    // Collection wraps Values to enable .push, .assign, etc.
    // highlight-next-line
    schema: new Collection(new Values(Stats)),
    process(value) {
      // Transform nested response structure
      Object.keys(value).forEach(key => {
        value[key] = {
          ...value[key].stats_24hour,
          product_id: key,
        };
      });
      return value;
    },
  },
});
```

This allows adding or updating entries with [.assign](./Collection.md#assign). The body is an object
where keys are the collection keys and values are the entity data to merge:

```typescript
// Local-only update with ctrl.set()
ctrl.set(StatsResource.getList.schema.assign, {}, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});

// Network request with ctrl.fetch() - see RestEndpoint.assign
await ctrl.fetch(StatsResource.getList.assign, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
});
```

## Options

One of `argsKey` or `nestKey` is used to compute the `Collection's` [pk](#pk).

### argsKey(...args): Object {#argsKey}

Returns a serializable Object whose members uniquely define this collection based
on Endpoint arguments.

```ts {7-9}
import { RestEndpoint, Collection } from '@data-client/rest';

const getTodos = new RestEndpoint({
  path: '/todos',
  searchParams: {} as { userId?: string },
  schema: new Collection([Todo], {
    argsKey: (urlParams: { userId?: string }) => ({
      ...urlParams,
    }),
  }),
});
```

### nestKey(parent, key): Object {#nestKey}

Returns a serializable Object whose members uniquely define this collection based
on the parent it is nested inside.

Nested `Collection's` [pk](#pk) are better defined by what they are nested inside. This allows
the nested Collection to share its state with other instances whose key has the same value.

```ts {28-30}
import { Collection, Entity } from '@data-client/rest';

class Todo extends Entity {
  id = '';
  userId = '';
  title = '';
  completed = false;

  static key = 'Todo';
}

class User extends Entity {
  id = '';
  name = '';
  username = '';
  email = '';
  todos: Todo[] = [];

  static key = 'User';
  static schema = {
    todos: new Collection([Todo], {
      nestKey: (parent, key) => ({
        userId: parent.id,
      }),
    }),
  };
}
```

In this case, `user.todos` and getTodos() response (from the argsKey example) will always
be the same (referentially equal) Array.

### nonFilterArgumentKeys?

A convenient alternative to [argsKey](#argsKey)

`nonFilterArgumentKeys` defines a test to determine which [argument keys](#argsKey)
are _not_ used for filtering the results. For instance, if your API uses
'orderBy' to choose a sort - this argument would not influence which
entities are included in the response.

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-start
    nonFilterArgumentKeys(key) {
      return key === 'orderBy';
    },
    // highlight-end
  }),
});
```

For convenience you can also use a RegExp or list of strings:

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-next-line
    nonFilterArgumentKeys: /orderBy/,
  }),
});
```

```ts
const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Collection([Post], {
    // highlight-next-line
    nonFilterArgumentKeys: ['orderBy'],
  }),
});
```

In this case, `author` and `group` are considered 'filter' argument keys,
which means they will influence whether a newly created should be added
to those lists. On the other hand, `orderBy` does not need to match
when `push` is called.

<HooksPlayground fixtures={postFixtures} getInitialInterceptorData={getInitialInterceptorData} row>

```ts title="getPosts" {14}
import { Entity, Query, Collection, RestEndpoint } from '@data-client/rest';

class Post extends Entity {
  id = '';
  title = '';
  group = '';
  author = '';
}
export const getPosts = new RestEndpoint({
  path: '/:group/posts',
  searchParams: {} as { orderBy?: string; author?: string },
  schema: new Query(
    new Collection([Post], {
      nonFilterArgumentKeys: /orderBy/,
    }),
    (posts, { orderBy } = {}) => {
      if (orderBy) {
        return [...posts].sort((a, b) => a[orderBy].localeCompare(b[orderBy]));
      }
      return posts;
    },
  )
});
```

```tsx title="PostListLayout" collapsed
import { useLoading } from '@data-client/react';

export default function PostListLayout({
  postsByBob,
  postsSorted,
  addPost,
}) {
  const [handleSubmit, loading] = useLoading(addPost);
  return (
    <div>
      <h4>&#123;group: 'react', author: 'bob'&#125;</h4>
      <ul>
        {postsByBob.map(post => (
          <li key={post.pk()}>
            {post.title} by {post.author}
          </li>
        ))}
      </ul>
      <h4>&#123;group: 'react', orderBy: 'title'&#125;</h4>
      <ul>
        {postsSorted.map(post => (
          <li key={post.pk()}>
            {post.title} by {post.author}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <div>Group: React</div>
        Author: 
        <label>
          <input type="radio" value="bob" name="author" defaultChecked />
          Bob
        </label>
        <label>
          <input type="radio" value="clara" name="author" />
          Clara
        </label>
        <TextInput defaultValue="New Post" name="title" label="Title" />
        <button type="submit">{loading ? 'loading...' : 'Push'}</button>
      </form>
    </div>
  );
}
```

```tsx title="PostList" collapsed
import { useSuspense, useController } from '@data-client/react';
import { getPosts } from './getPosts';
import PostListLayout from './PostListLayout';

function PostList() {
  const postsByBob = useSuspense(getPosts, {
    group: 'react',
    author: 'bob',
  });
  const postsSorted = useSuspense(getPosts, {
    group: 'react',
    orderBy: 'title',
  });

  const ctrl = useController();

  const addPost = (e) => {
    e.preventDefault();
    return ctrl.fetch(
      getPosts.push,
      { group: 'react' },
      new FormData(e.currentTarget),
    );
  }
  return (
    <PostListLayout
      postsByBob={postsByBob}
      postsSorted={postsSorted}
      addPost={addPost}
    />
  );
}
render(<PostList />);
```

</HooksPlayground>

### createCollectionFilter?

Sets a default `createCollectionFilter` for [addWith()](#addWith),
[push](#push), [unshift](#unshift), and [assign](#assign).

This is used by these creation schemas to determine which collections to add to.

Default:

```ts
createCollectionFilter(...args: Args) {
  return (collectionKey: Record<string, string>) =>
    Object.entries(collectionKey).every(
      ([key, value]) =>
        this.nonFilterArgumentKeys(key) ||
        // strings are canonical form. See pk() above for value transformation
        `${args[0][key]}` === value ||
        `${args[1]?.[key]}` === value,
    );
}
```

## Methods

These creation/removal schemas can be used with [Controller.set()](/docs/api/Controller#set) for local-only
updates without network requests. For network-based mutations, see [RestEndpoint's specialized extenders](./RestEndpoint.md#push).

### push

A creation schema that places new item(s) at the _end_ of this collection.

```ts
// Add a new todo to the end of the list (local only, no network request)
ctrl.set(getTodos.schema.push, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### unshift

A creation schema that places new item(s) at the _start_ of this collection.

```ts
// Add a new todo to the beginning of the list (local only)
ctrl.set(getTodos.schema.unshift, { userId: '1' }, { id: '999', title: 'New Todo' });
```

### remove

A schema that removes item(s) from a collection by value.

The entity value is normalized to extract its pk, which is then matched against collection members.
Items are removed from all collections matching the provided args (filtered by [createCollectionFilter](#createcollectionfilter)).

```ts
// Remove from collections matching { userId: '1' } (local only)
ctrl.set(getTodos.schema.remove, { userId: '1' }, { id: '123' });
```

```ts
// Remove from all collections (empty args matches all)
ctrl.set(getTodos.schema.remove, {}, { id: '123' });
```

For network-based removal that also updates the entity, see [RestEndpoint.remove](./RestEndpoint.md#remove).

### move

A schema that moves item(s) between collections. It removes the entity from collections matching
its _existing_ state and adds it to collections matching the entity's _new_ state (derived from the last arg).

This works for both `Collection(Array)` and `Collection(Values)`.

```ts
// Move todo from userId '1' collection to userId '2' collection (local only)
ctrl.set(
  getTodos.schema.move,
  { id: '10', userId: '2', title: 'Moved todo' },
  [{ id: '10' }, { userId: '2' }],
);
```

The remove filter uses the entity's **existing** values in the store to determine which collections
it currently belongs to. The add filter uses the merged entity values (existing + last arg) to determine
where it should be placed.

For network-based moves, see [RestEndpoint.move](./RestEndpoint.md#move).

### assign

A creation schema that [assigns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
its members to a `Collection(Values)`. Only available for Collections wrapping [Values](./Values.md).

```ts
const getStats = new RestEndpoint({
  path: '/products/stats',
  schema: new Collection(new Values(Stats)),
});

// Add/update entries in a Values collection (local only)
ctrl.set(getStats.schema.assign, {}, {
  'BTC-USD': { product_id: 'BTC-USD', volume: 1000 },
  'ETH-USD': { product_id: 'ETH-USD', volume: 500 },
});
```

### addWith(merge, createCollectionFilter): CreationSchema {#addWith}

Constructs a custom creation schema for this collection. This is used by
[push](#push), [unshift](#unshift), [assign](#assign) and [paginate](./RestEndpoint.md#paginated)

#### merge(collection, creation)

This [merges](#merge) the value with the existing collection

#### createCollectionFilter

This function is used to determine which collections to add to. It
uses the Object returned from [argsKey](#argsKey) or [nestKey](#nestKey) to
determine if that collection should get the newly created values from this schema.

Because arguments may be serializable types like `number`, we recommend using `==` comparisons,
e.g., `'10' == 10`

```typescript
(...args) =>
  collectionKey =>
    boolean;
```

## Lifecycle Methods

### static shouldReorder(existingMeta, incomingMeta, existing, incoming): boolean {#shouldReorder}

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

### static merge(existing, incoming): mergedValue {#merge}

```typescript
static merge(existing: any, incoming: any) {
  return incoming;
}
```

### static mergeWithStore(existingMeta, incomingMeta, existing, incoming): mergedValue {#mergeWithStore}

```typescript
static mergeWithStore(
  existingMeta: { date: number; fetchedAt: number },
  incomingMeta: { date: number; fetchedAt: number },
  existing: any,
  incoming: any,
): any;
```

`mergeWithStore()` is called during normalization when a processed entity is already found in the store.

### pk: (parent?, key?, args?): pk? {#pk}

`pk()` calls [argsKey](#argsKey) or [nestKey](#nestKey) depending on which are specified, and
then serializes the result for the pk string.

```ts
pk(value: any, parent: any, key: string, args: readonly any[]) {
  const obj = this.argsKey
    ? this.argsKey(...args)
    : this.nestKey(parent, key);
  for (const key in obj) {
    if (typeof obj[key] !== 'string') obj[key] = `${obj[key]}`;
  }
  return JSON.stringify(obj);
}
```
