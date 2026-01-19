---
title: Query Schema - Programmatic memoized store access
sidebar_label: Query
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import { RestEndpoint } from '@data-client/rest';
import HooksPlayground from '@site/src/components/HooksPlayground';
import SortDemo from '../shared/\_SortDemo.mdx';

# Query

`Query` provides programmatic access to the Reactive Data Client cache while maintaining
the same high performance and referential equality guarantees expected of Reactive Data Client.

`Query` can be rendered using [schema lookup hook useQuery()](/docs/api/useQuery)

## Query members

### schema

[Schema](./schema.md) used to retrieve/denormalize data from the Reactive Data Client cache.
This accepts any [Queryable](/rest/api/schema#queryable) schema: [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
[Union](./Union.md), and [Object](./Object.md) schemas for joining multiple entities.

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
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
});
```

```tsx title="UsersPage"
import { All, Query } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { UserResource, User } from './resources/User';

const countUsers = new Query(
  new All(User),
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

### Rearranging data with groupBy aggregations {#groupby}

<HooksPlayground>

```ts title="resources/User" collapsed
export class User extends Entity {
  id = 0;
  username = '';
  name = '';
  email = '';
  website = '';
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
import { Query } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { TodoResource } from './resources/Todo';
import { UserResource } from './resources/User';
import TodoByUser from './TodoByUser';

const groupTodoByUser = new Query(
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
      {Object.keys(todosByUser).slice(5).map(userId => (
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

### Object Schema Joins {#object-schema-joins}

`Query` can take [Object Schemas](/rest/api/Object), enabling joins across multiple entity types. This allows you to combine data from different entities in a single query.

<HooksPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({path: '/tickers/:product_id'}),
args: [{ product_id: 'BTC-USD' }],
response: { product_id: 'BTC-USD', price: 45000 },
delay: 150,
},
{
endpoint: new RestEndpoint({path: '/stats/:product_id'}),
args: [{ product_id: 'BTC-USD' }],
response: { product_id: 'BTC-USD', last: 44950 },
delay: 150,
},
]}>

```ts title="resources/Ticker" collapsed
export class Ticker extends Entity {
  product_id = '';
  price = 0;
  pk() { return this.product_id; }
}

export const TickerResource = resource({
  path: '/tickers/:product_id',
  schema: Ticker,
});
```

```ts title="resources/Stats" collapsed
export class Stats extends Entity {
  product_id = '';
  last = 0;
  pk() { return this.product_id; }
}

export const StatsResource = resource({
  path: '/stats/:product_id',
  schema: Stats,
});
```

```tsx title="PriceDisplay"
import { Query } from '@data-client/rest';
import { useQuery, useFetch } from '@data-client/react';
import { TickerResource, Ticker } from './resources/Ticker';
import { StatsResource, Stats } from './resources/Stats';

// Join Ticker and Stats by product_id
const queryPrice = new Query(
  { ticker: Ticker, stats: Stats },
  ({ ticker, stats }) => ticker?.price ?? stats?.last,
);

function PriceDisplay({ productId }: { productId: string }) {
  useFetch(TickerResource.get, { product_id: productId });
  useFetch(StatsResource.get, { product_id: productId });
  const price = useQuery(queryPrice, { product_id: productId });
  
  if (price === undefined) return <div>Loading...</div>;
  return <div>Price: ${price}</div>;
}

render(<PriceDisplay productId="BTC-USD" />);
```

</HooksPlayground>

### Fallback joins

import StackBlitz from '@site/src/components/StackBlitz';

In this case `Ticker` is constantly updated from a websocket stream. However, there is no bulk/list
fetch for `Ticker` - making it inefficient for getting the prices on a list view.

So in this case we can fetch a list of `Stats` as a fallback since it has price data as well.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/pages/Home/AssetPrice.tsx,src/resources/fallbackQueries.ts" />
