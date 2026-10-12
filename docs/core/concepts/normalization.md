---
title: Entity and Data Normalization
sidebar_label: Data Normalization
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Link from '@docusaurus/Link';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import SchemaTable from '../shared/\_schema_table.mdx';

[Entities](/rest/api/Entity) have a primary key. This enables easy access via a lookup table.
This makes it easy to find, update, create, or delete the same data - no matter what
endpoint it was used in.

:::react

In the Store below, the `/todos` response becomes a `Todo` table with one row per primary key,
and the endpoint keeps only references to those rows.

- **Pick a todo**: its detail renders right away, with no request, because `Todo` already holds it.
- **Toggle completed**: one `PATCH` updates one row, and both the list and the detail show it.
  Switch the Store to Diff to see that row change.

:::

:::vue

Below, the `/todos` response becomes a `Todo` table with one row per primary key, and the endpoint
keeps only references to those rows. So picking a todo renders its detail with no request, and
toggling completed sends one `PATCH` that updates both the list and the detail.

:::

export const todos = [
  { id: '1', title: 'Pick up groceries', completed: false },
  { id: '2', title: 'Walk the dog', completed: true },
  { id: '3', title: 'Normalize the store', completed: false },
];

<FrameworkPlayground groupId="schema" defaultOpen="y" fixtures={[
{
endpoint: new RestEndpoint({ path: '/todos' }),
response() {
return Object.values(this);
},
delay: 150,
},
{
endpoint: new RestEndpoint({ path: '/todos/:id' }),
response({ id }) {
return this[id];
},
delay: 150,
},
{
endpoint: new RestEndpoint({ path: '/todos/:id', method: 'PATCH' }),
response({ id }, body) {
return (this[id] = { ...this[id], ...body });
},
delay: 300,
},
]}
getInitialInterceptorData={() =>
Object.fromEntries(todos.map(todo => [todo.id, todo]))
}>

```ts title="resources/Todo" collapsed
import { Entity, resource } from '@data-client/rest';

export class Todo extends Entity {
  id = '';
  title = '';
  completed = false;

  static key = 'Todo';
}

export const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  optimistic: true,
});
```

:::react

```tsx title="TodoDetail" collapsed
import { useController, useSuspense } from '@data-client/react';
import { TodoResource } from './resources/Todo';

export default function TodoDetail({ id }: { id: string }) {
  const todo = useSuspense(TodoResource.get, { id });
  const ctrl = useController();
  const toggle = () =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id },
      { completed: !todo.completed },
    );
  return (
    <section>
      <h4>{todo.title}</h4>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={toggle}
        />{' '}
        Completed
      </label>
    </section>
  );
}
```

```tsx title="TodoList" collapsed
import React from 'react';
import { useSuspense } from '@data-client/react';
import { TodoResource } from './resources/Todo';
import TodoDetail from './TodoDetail';

function TodoList() {
  const todos = useSuspense(TodoResource.getList);
  const [selected, setSelected] = React.useState(todos[0].id);
  return (
    <>
      {todos.map(todo => (
        <div className="listItem" key={todo.pk()}>
          <label>
            <input
              type="radio"
              checked={todo.id === selected}
              onChange={() => setSelected(todo.id)}
            />{' '}
            {todo.completed ? <s>{todo.title}</s> : todo.title}
          </label>
        </div>
      ))}
      <hr />
      <TodoDetail id={selected} />
    </>
  );
}
render(<TodoList />);
```

:::

:::vue

```html title="TodoDetail.vue" collapsed
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';

  const props = defineProps<{ id: string }>();
  const todo = await useSuspense(TodoResource.get, () => ({
    id: props.id,
  }));
  const ctrl = useController();
  const toggle = () =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: props.id },
      { completed: !todo.value.completed },
    );
</script>

<template>
  <section>
    <h4>{{ todo.title }}</h4>
    <label>
      <input type="checkbox" :checked="todo.completed" @change="toggle" />
      Completed
    </label>
  </section>
</template>
```

```html title="TodoList.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { TodoResource } from './resources/Todo';
  import TodoDetail from './TodoDetail.vue';

  const todos = await useSuspense(TodoResource.getList);
  const selected = ref(todos.value[0].id);
</script>

<template>
  <div v-for="todo in todos" :key="todo.pk()" class="listItem">
    <label>
      <input
        type="radio"
        :checked="todo.id === selected"
        @change="selected = todo.id"
      />
      <s v-if="todo.completed">{{ todo.title }}</s>
      <template v-else>{{ todo.title }}</template>
    </label>
  </div>
  <hr />
  <TodoDetail :id="selected" />
</template>
```

:::

</FrameworkPlayground>

Extracting entities from a response is known as `normalization`. Accessing a response reverses
the process via `denormalization`.

:::info[Global Referential Equality]

Using entities expands Reactive Data Client' global referential equality guarantee beyond the granularity of
an entire endpoint response.

:::

## Mutations and Dynamic Data

When an endpoint changes data, this is known as a [side effect](/rest/guides/side-effects). Marking an endpoint with [sideEffect: true](/rest/api/Endpoint#sideeffect)
tells Reactive Data Client that this endpoint is not idempotent, and thus should not be allowed in hooks
that may call the endpoint an arbitrary number of times like [useSuspense()](../api/useSuspense.md) or [useFetch()](../api/useFetch.md)

By including the changed data in the endpoint's response, Reactive Data Client is able to able to update
any entities it extracts by specifying the schema.

<Tabs
defaultValue="Create"
values={[
{ label: 'Create', value: 'Create' },
{ label: 'Update', value: 'Update' },
{ label: 'Delete', value: 'Delete' },
]}>
<TabItem value="Create">

```typescript
import { RestEndpoint, schema } from '@data-client/rest';

const todoCreate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  method: 'POST',
  schema: new Collection([Todo]).push,
});
```

<details>
<summary><b>Example Usage</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoCreate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function NewTodoForm() {
  const ctrl = useController();
  return (
    <Form
      onSubmit={e => ctrl.fetch(todoCreate, new FormData(e.target))}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="NewTodoForm.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoCreate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(todoCreate, new FormData(e.target as HTMLFormElement));
</script>

<template>
  <Form @submit="handleSubmit">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Update">

```typescript
import { RestEndpoint } from '@data-client/rest';

const todoUpdate = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'PUT',
  schema: Todo,
});
```

<details>
<summary><b>Example Usage</b></summary>

:::react

```tsx
import { useController, useSuspense } from '@data-client/react';
import { todoDetail, todoUpdate } from './api/Todo';
import Form from './Form';
import FormField from './FormField';

export default function UpdateTodoForm({ id }: { id: number }) {
  const todo = useSuspense(todoDetail, { id });
  const ctrl = useController();
  return (
    <Form
      onSubmit={e =>
        ctrl.fetch(todoUpdate, { id }, new FormData(e.target))
      }
      initialValues={todo}
    >
      <FormField name="title" />
    </Form>
  );
}
```

:::

:::vue

```html title="UpdateTodoForm.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { todoDetail, todoUpdate } from './api/Todo';
  import Form from './Form.vue';
  import FormField from './FormField.vue';

  const props = defineProps<{ id: number }>();
  const todo = await useSuspense(todoDetail, () => ({ id: props.id }));
  const ctrl = useController();
  const handleSubmit = (e: Event) =>
    ctrl.fetch(
      todoUpdate,
      { id: props.id },
      new FormData(e.target as HTMLFormElement),
    );
</script>

<template>
  <Form @submit="handleSubmit" :initialValues="todo">
    <FormField name="title" />
  </Form>
</template>
```

:::

</details>

</TabItem>
<TabItem value="Delete">

```typescript
import { Invalidate, RestEndpoint } from '@data-client/rest';

const todoDelete = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  method: 'DELETE',
  schema: new Invalidate(Todo),
});
```

<details>
<summary><b>Example Usage</b></summary>

:::react

```tsx
import { useController } from '@data-client/react';
import { todoDelete, type Todo } from './api/Todo';

export default function TodoWithDelete({ todo }: { todo: Todo }) {
  const ctrl = useController();
  return (
    <div>
      {todo.title}
      <button onClick={() => ctrl.fetch(todoDelete, { id: todo.id })}>
        Delete
      </button>
    </div>
  );
}
```

:::

:::vue

```html title="TodoWithDelete.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { todoDelete, type Todo } from './api/Todo';

  defineProps<{ todo: Todo }>();
  const ctrl = useController();
</script>

<template>
  <div>
    {{ todo.title }}
    <button @click="ctrl.fetch(todoDelete, { id: todo.id })">Delete</button>
  </div>
</template>
```

:::

</details>

</TabItem>
</Tabs>

:::info

Mutations automatically update the normalized cache, resulting in consistent and fresh data.

:::

## Schema

Schemas are a declarative definition of how to [process responses](/rest/api/schema)

- [where](/rest/api/schema) to expect [Entities](/rest/api/Entity)
- Functions to [deserialize fields](/rest/guides/network-transform#deserializing-fields)

```typescript
import { RestEndpoint, Collection } from '@data-client/rest';

const getTodoList = new RestEndpoint({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos',
  // highlight-next-line
  schema: new Collection([Todo]),
});
```

Placing our [Entity](/rest/api/Entity) `Todo` in an array [Collection](/rest/api/Collection), allows us to easly
[push](/rest/api/RestEndpoint#push) or [unshift](/rest/api/RestEndpoint#unshift) new `Todos` on it.

Aside from array, there are a few more 'schemas' provided for various patterns. The first two (Object and Array)
have shorthands of using object and array literals.

<SchemaTable/>

[Learn more](/rest/api/schema)

### Nesting

Additionally, [Entities](/rest/api/Entity) themselves can specify [nested schemas](/rest/guides/relational-data)
by specifying a [static schema](/rest/api/Entity#schema) member.

<Tabs
defaultValue="Entity"
values={[
{ label: 'Entity', value: 'Entity' },
{ label: 'Response', value: 'Response' },
]}>
<TabItem value="Entity">

```typescript
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;

  static key = 'Todo';

  // highlight-start
  static schema = {
    user: User,
  };
  // highlight-end
}

class User extends Entity {
  id = 0;
  username = '';

  static key = 'User';
}
```

</TabItem>
<TabItem value="Response">

```json
{
  "id": 5,
  "user": {
    "id": 10,
    "username": "bob"
  },
  "title": "Write some Entities",
  "completed": false
}
```

</TabItem>
</Tabs>

[Learn more](/rest/guides/relational-data)

### Data Representations

Additionally, functions can be [used as a schema](/rest/guides/network-transform#deserializing-fields). This will be called during denormalization.
This might be useful with representations like [bignumber](https://mikemcl.github.io/bignumber.js/) or [temporal instant](https://tc39.es/proposal-temporal/docs/instant.html)

```ts
import { Entity } from '@data-client/endpoint';

class Todo extends Entity {
  id = 0;
  user = User.fromJS();
  title = '';
  completed = false;
  // highlight-next-line
  dueDate = Temporal.Instant.fromEpochMilliseconds(0);

  static key = 'Todo';

  static schema = {
    user: User,
    // highlight-next-line
    dueDate: Temporal.Instant.from,
  };
}
```

:::info

Due to the global referential equality guarantee - construction of members only occurs once
per update.

:::

## Store Inspection (debugging)

[DevTools browser extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
can be installed to inspect and [debug the store](../getting-started/debugging.md).

![browser-devtools](/img/devtool-state.png 'Reactive Data Client devtools')

<center>

<Link className="button button--secondary" to="../getting-started/debugging">Data Client Debugging Guide »</Link>

</center>

## Benchmarks

Entity-level memoization delivers up to **20x** denormalization performance and **90x** faster mutation propagation
compared to non-normalized approaches. See the full [Performance](./performance.md) page for
normalization benchmarks results as well as full React integration benchmarks.