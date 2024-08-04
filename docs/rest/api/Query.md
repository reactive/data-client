---
title: Query - Programmatic memoized store access
sidebar_label: schema.Query
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import { RestEndpoint } from '@data-client/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';
import SortDemo from '../shared/\_SortDemo.mdx';

# schema.Query

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

### Maintaining sort after creates {#sorting}

<SortDemo />

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

```ts title="resources/User" collapsed
export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;
  pk() {
    return this.id;
  }
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './resources/User';

const countUsers = new schema.Query(
  new schema.All(User),
  (entries, { isAdmin } = {}) => {
    if (isAdmin !== undefined)
      return entries.filter(user => user.isAdmin === isAdmin).length;
    return entries.length;
  },
);

function UsersPage() {
  useFetch(UserResource.getList);
  const userCount = useQuery(countUsers);
  const adminCount = useQuery(countUsers, { isAdmin: true });
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

### Rearranging data with groupBy aggregations

<HooksPlayground>

```ts title="resources/User" collapsed
export class User extends Entity {
  id = 0;
  username = '';
  name = '';
  email = '';
  website = '';
  pk() {
    return this.id;
  }
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});
```

```ts title="resources/Todo" collapsed
import { User } from './User';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  user? = User.fromJS({});
  title = '';
  completed = false;
  pk() {
    return this.id;
  }
  static schema = {
    user: User,
  };
  static process(input) {
    return { ...input, user: input.userId };
  }
}
export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  searchParams: {} as { userId?: string | number } | undefined,
});
```

```tsx title="TodoByUser" collapsed
import { useQuery } from '@data-client/react';
import { User } from './resources/User';
import type { Todo } from './resources/Todo';

export default function TodoByUser({ userId, todos }: Props) {
  const user = useQuery(User, { id: userId });
  // don't bother if no user is loaded yet
  if (!user) return null;
  return (
    <div>
      <h3>
        {user.name} has {tasksRemaining(todos)} tasks left
      </h3>
      {todos.slice(0, 3).map(todo => (
        <div key={todo.pk()}>
          {todo.title} by {todo.user === user ? todo.user.name : ''}
        </div>
      ))}
    </div>
  );
}
function tasksRemaining(todos: Todo[]) {
  return todos.filter(({ completed }) => !completed).length;
}
interface Props {
  userId: string;
  todos: Todo[];
}
```

```tsx title="TodoJoined"
import { schema } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { TodoResource } from './resources/Todo';
import { UserResource } from './resources/User';
import TodoByUser from './TodoByUser';

const groupTodoByUser = new schema.Query(
  TodoResource.getList.schema,
  todos => Object.groupBy(todos, todo => todo.userId),
);

function TodosPage() {
  useFetch(UserResource.getList);
  useSuspense(TodoResource.getList);
  useSuspense(UserResource.getList);
  const todosByUser = useQuery(groupTodoByUser);
  if (!todosByUser) return <div>Todos not found</div>;
  return (
    <div>
      {Object.keys(todosByUser).map(userId => (
        <TodoByUser
          key={userId}
          userId={userId}
          todos={todosByUser[userId]}
        />
      ))}
    </div>
  );
}
render(<TodosPage />);
```

</HooksPlayground>

### Fallback joins

import StackBlitz from '@site/src/components/StackBlitz';

In this case `Ticker` is constantly updated from a websocket stream. However, there is no bulk/list
fetch for `Ticker` - making it inefficient for getting the prices on a list view.

So in this case we can fetch a list of `Stats` as a fallback since it has price data as well.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/pages/Home/AssetPrice.tsx,src/resources/fallbackQueries.ts" />
