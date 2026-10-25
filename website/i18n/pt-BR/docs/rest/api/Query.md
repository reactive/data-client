---
title: Query Schema - Acesso programático e memoizado ao store
sidebar_label: Query
---

<head>
  <meta name="docsearch:pagerank" content="30"/>
</head>

import { RestEndpoint } from '@data-client/rest';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SortDemo from '../shared/\_SortDemo.mdx';

# Query

`Query` fornece acesso programático ao cache do Reactive Data Client, mantendo
o mesmo alto desempenho e as mesmas garantias de igualdade referencial esperados do Reactive Data Client.

`Query` pode ser renderizado usando o [:react[hook]:vue[composable] de consulta por schema useQuery()](/docs/api/useQuery)

## Membros de Query {#query-members}

### schema {#schema}

[Schema](./schema.md) usado para obter/desnormalizar dados do cache do Reactive Data Client.
Aceita qualquer schema [Queryable](/rest/api/schema#queryable): [Entity](./Entity.md), [All](./All.md), [Collection](./Collection.md), [Query](./Query.md),
[Union](./Union.md), [Scalar](./Scalar.md) e schemas [Object](./Object.md) para fazer join de várias entities.
Campos [Lazy](./Lazy.md) produzem um Queryable por meio do acessor [`.query`](./Lazy.md#query).

### process(entries, ...args) {#process}

Recebe a resposta (desnormalizada) como entries, além dos argumentos, e retorna a nova
resposta para uso com [useQuery](/docs/api/useQuery)

## Uso {#usage}

### Mantendo a ordenação após criações {#sorting}

<SortDemo />

### Agregados {#aggregates}

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

### Reorganizando dados com agregações groupBy {#groupby}

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

### Joins com Object Schema {#object-schema-joins}

`Query` pode receber [Object Schemas](/rest/api/Object), permitindo joins entre vários tipos de entity. Isso permite combinar dados de diferentes entities em uma única query.

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

### Joins de fallback {#fallback-joins}

import StackBlitz from '@site/src/components/StackBlitz';

Neste caso, `Ticker` é atualizado constantemente a partir de um stream de websocket. No entanto, não há fetch
em lote/lista para `Ticker` - o que torna ineficiente obter os preços em uma visualização de lista.

Portanto, neste caso podemos buscar uma lista de `Stats` como fallback, já que ela também tem dados de preço.

<StackBlitz app="coin-app" file="src/pages/Home/CurrencyList.tsx,src/pages/Home/AssetPrice.tsx,src/resources/fallbackQueries.ts" />
