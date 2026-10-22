---
title: Query Schema - 以编程方式记忆化访问 store
sidebar_label: Query
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import { RestEndpoint } from '@data-client/rest';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SortDemo from '../shared/\_SortDemo.mdx';

# Query

`Query` 让你可以以编程方式访问 Reactive Data Client 缓存，同时保持
Reactive Data Client 应有的高性能和引用相等性保证。

可以使用 [schema 查找 :react[hook]:vue[组合式函数] useQuery()](/docs/api/useQuery) 来渲染 `Query`

## Query 成员 {#query-members}

### schema {#schema}

用于从 Reactive Data Client 缓存中检索/反规范化数据的 [Schema](./schema.md)。
它接受任何 [Queryable](/rest/api/schema#queryable) schema：[Entity](./Entity.md)、[All](./All.md)、[Collection](./Collection.md)、[Query](./Query.md)、
[Union](./Union.md)、[Scalar](./Scalar.md)，以及用于连接多个 Entity 的 [Object](./Object.md) schema。
[Lazy](./Lazy.md) 字段可以通过其 [`.query`](./Lazy.md#query) 访问器得到一个 Queryable。

### process(entries, ...args) {#process}

接收（反规范化后的）响应作为 entries 以及参数，并返回新的
响应，供 [useQuery](/docs/api/useQuery) 使用

## 用法 {#usage}

### 新建后保持排序 {#sorting}

<SortDemo />

### 聚合 {#aggregates}

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
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
import { Entity, resource } from '@data-client/rest';

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

:::react

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

:::

:::vue

```html title="UsersPage.vue"
<script lang="ts">
  import { All, Query } from '@data-client/rest';
  import { UserResource, User } from './resources/User';

  const countUsers = new Query(
    new All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter(user => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );
</script>

<script setup lang="ts">
  import { useQuery, useFetch } from '@data-client/vue';

  useFetch(UserResource.getList);
  const userCount = useQuery(countUsers);
  const adminCount = useQuery(countUsers, { isAdmin: true });
</script>

<template>
  <div v-if="userCount === undefined">No users in cache yet</div>
  <div v-else>
    <div>Total users: {{ userCount }}</div>
    <div>Total admins: {{ adminCount }}</div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### 使用 groupBy 聚合重新组织数据 {#groupby}

<FrameworkPlayground>

```ts title="resources/User" collapsed
import { Entity, resource } from '@data-client/rest';

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
import { Entity, resource } from '@data-client/rest';
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

:::react

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
import { useQuery, useFetch, useSuspense } from '@data-client/react';
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

:::

:::vue

```html title="TodoByUser.vue" collapsed
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import { User } from './resources/User';
  import type { Todo } from './resources/Todo';

  const props = defineProps<{ userId: string; todos: Todo[] }>();
  const user = useQuery(User, () => ({ id: props.userId }));

  function tasksRemaining(todos: Todo[]) {
    return todos.filter(({ completed }) => !completed).length;
  }
</script>

<template>
  <!-- don't bother if no user is loaded yet -->
  <div v-if="user">
    <h3>{{ user.name }} has {{ tasksRemaining(todos) }} tasks left</h3>
    <div v-for="todo in todos.slice(0, 3)" :key="todo.pk()">
      {{ todo.title }} by {{ todo.user === user ? todo.user.name : '' }}
    </div>
  </div>
</template>
```

```html title="TodoJoined.vue"
<script lang="ts">
  import { Query } from '@data-client/rest';
  import { TodoResource } from './resources/Todo';
  import { UserResource } from './resources/User';

  const groupTodoByUser = new Query(
    TodoResource.getList.schema,
    todos => Object.groupBy(todos, todo => todo.userId),
  );
</script>

<script setup lang="ts">
  import { useQuery, useFetch, useSuspense } from '@data-client/vue';
  import TodoByUser from './TodoByUser.vue';

  // start both fetches in parallel
  useFetch(UserResource.getList);
  await useSuspense(TodoResource.getList);
  await useSuspense(UserResource.getList);
  const todosByUser = useQuery(groupTodoByUser);
</script>

<template>
  <div v-if="!todosByUser">Todos not found</div>
  <div v-else>
    <TodoByUser
      v-for="userId in Object.keys(todosByUser).slice(5)"
      :key="userId"
      :userId="userId"
      :todos="todosByUser[userId]"
    />
  </div>
</template>
```

:::

</FrameworkPlayground>

### Object Schema 连接 {#object-schema-joins}

`Query` 可以接受 [Object Schema](/rest/api/Object)，从而跨多种 Entity 类型进行连接。这让你可以在单个查询中组合来自不同 Entity 的数据。

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
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
import { Entity, resource } from '@data-client/rest';

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
import { Entity, resource } from '@data-client/rest';

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

:::react

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

:::

:::vue

```html title="PriceDisplay.vue"
<script lang="ts">
  import { Query } from '@data-client/rest';
  import { TickerResource, Ticker } from './resources/Ticker';
  import { StatsResource, Stats } from './resources/Stats';

  // Join Ticker and Stats by product_id
  const queryPrice = new Query(
    { ticker: Ticker, stats: Stats },
    ({ ticker, stats }) => ticker?.price ?? stats?.last,
  );
</script>

<script setup lang="ts">
  import { useQuery, useFetch } from '@data-client/vue';

  const props = defineProps<{ productId: string }>();
  useFetch(TickerResource.get, () => ({ product_id: props.productId }));
  useFetch(StatsResource.get, () => ({ product_id: props.productId }));
  const price = useQuery(queryPrice, () => ({ product_id: props.productId }));
</script>

<template>
  <div v-if="price === undefined">Loading...</div>
  <div v-else>Price: ${{ price }}</div>
</template>
```

:::

</FrameworkPlayground>

### fallback 连接 {#fallback-joins}

import StackBlitz from '@site/src/components/StackBlitz';

在这个例子中，`Ticker` 会通过 websocket 流不断更新。然而 `Ticker` 没有批量/列表
获取接口——因此在列表视图中获取价格的效率很低。

所以这里我们可以获取 `Stats` 列表作为 fallback，因为它同样包含价格数据。

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/pages/Home/AssetPrice.tsx,src/resources/fallbackQueries.ts" />
