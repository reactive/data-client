---
title: schema.Query
---

<head>
  <title>Query - Programmatic performant store access</title>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import { RestEndpoint } from '@data-client/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';

`Query` provides programmatic access to the Reactive Data Client cache while maintaining
the same high performance and referential equality guarantees expected of Reactive Data Client.

`Query` can be rendered using [schema lookup hook useQuery()](/docs/api/useQuery)

## Query members

### schema

[Schema](./schema.md) used to retrieve/denormalize data from the Reactive Data Client cache.
This accepts any [Queryable](/rest/api/schema#queryable) schema: [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
and [Union](./Union.md).

### process(entries, ...args) {#process}

Takes the (denormalized) response as entries and arguments and returns the new
response for use with [useQuery](/docs/api/useQuery)

## Usage

### Sorting & Filtering

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
{ id: '777', name: 'Albatras', isAdmin: true },
],
delay: 150,
},
]}>

```ts title="api/User.ts" collapsed
export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  pk() {
    return this.id;
  }
}
export const UserResource = createResource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage.tsx"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './api/User';

interface Args {
  asc: boolean;
  isAdmin?: boolean;
}
const sortedUsers = new schema.Query(
  new schema.All(User),
  (entries, { asc, isAdmin }: Args = { asc: false }) => {
    let sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    if (isAdmin !== undefined)
      sorted = sorted.filter(user => user.isAdmin === isAdmin);
    if (asc) return sorted;
    return sorted.reverse();
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const users = useQuery(sortedUsers, { asc: true });
  if (!users) return <div>No users in cache yet</div>;
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

### Aggregates

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/users'}),
args: [],
response: [
{ id: '123', name: 'Jim' },
{ id: '456', name: 'Jane' },
{ id: '777', name: 'Albatras', isAdmin: true },
],
delay: 150,
},
]}>

```ts title="api/User" collapsed
export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  pk() {
    return this.id;
  }
}
export const UserResource = createResource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './api/User';

const getUserCount = new schema.Query(
  new schema.All(User),
  (entries, { isAdmin } = {}) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
  if (userCount === undefined) return <div>No users in cache yet</div>;
  return (
    <div>
      <div>Total users: {userCount}</div>
      <div>Total admins: {adminCount}</div>
    </div>
  );
}
render(<UsersPage />);
```

</HooksPlayground>

### Client side joins

Even if the network responses don't nest data, we can perform client-side joins by specifying
the relationship in [Entity.schema](./Entity.md#schema)

<HooksPlayground>

```ts title="api/User.ts" collapsed
export class User extends Entity {
  id = 0;
  name = '';
  email = '';
  website = '';
  pk() {
    return `${this.id}`;
  }
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="api/Todo.ts" collapsed
import { User } from './User';

export class Todo extends Entity {
  id = 0;
  userId = User.fromJS({});
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
  static schema = {
    userId: User,
  };
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="TodoJoined.tsx"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { TodoResource, Todo } from './api/Todo';
import { UserResource, User } from './api/User';

const todosWithUser = new schema.Query(
  new schema.All(Todo),
  (entries, { userId = 0 }) => {
    return entries.filter(todo => todo.userId?.id === userId);
  },
);

function TodosPage() {
  useFetch(UserResource.getList);
  useFetch(TodoResource.getList);
  const todos = useQuery(todosWithUser, { userId: 1 });
  if (!todos) return <div>No Todos in cache yet</div>;
  if (!todos.length) return <div>No Todos match user</div>;
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.pk()}>
          {todo.title} by {todo.userId.name}
        </div>
      ))}
    </div>
  );
}
render(<TodosPage />);
```

</HooksPlayground>

### Rearranging data with groupBy aggregations

<HooksPlayground>

```ts title="api/User.ts" collapsed
export class User extends Entity {
  id = 0;
  name = '';
  email = '';
  website = '';
  pk() {
    return `${this.id}`;
  }
}
export const UserResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="api/Todo.ts" collapsed
import { User } from './User';

export class Todo extends Entity {
  id = 0;
  userId = User.fromJS({});
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
  static schema = {
    userId: User,
  };
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
});
```

```tsx title="TodoJoined.tsx"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { TodoResource, Todo } from './api/Todo';
import { UserResource } from './api/User';

const groupTodoByUser = new schema.Query(
  TodoResource.getList.schema,
  todos => {
    return Object.groupBy(todos, todo => todo?.userId?.username) as Record<string, Todo[]>;
  },
);

function TodosPage() {
  useFetch(UserResource.getList);
  useSuspense(TodoResource.getList);
  useSuspense(UserResource.getList);
  const todoByUser = useQuery(groupTodoByUser);
  if (!todoByUser) return <div>Todos not found</div>;
  return (
    <div>
      {Object.keys(todoByUser).map(username => (
        <div key={username}>
          <h3>
            {username} has {tasksRemaining(todoByUser[username])} tasks
            left
          </h3>
          {todoByUser[username].slice(0, 3).map(todo => (
            <div key={todo.pk()}>
              {todo.title} by {todo?.userId?.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function tasksRemaining(todos: Todo[]) {
  return todos.filter(({ completed }) => !completed).length;
}
render(<TodosPage />);
```

</HooksPlayground>
