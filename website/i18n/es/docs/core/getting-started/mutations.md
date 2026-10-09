---
title: Mutar datos asíncronos en React
vue_title: Mutar datos asíncronos en Vue
sidebar_label: Mutar datos
description: Mutaciones de datos seguras y de alto rendimiento, sin volver a obtener ni escribir gestión de estado.
---

import ProtocolTabs from '@site/src/components/ProtocolTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { TodoResource } from '@site/src/components/Demo/code/todo-app/rest/resources';
import { todoFixtures } from '@site/src/fixtures/todos';
import { RestEndpoint } from '@data-client/rest';
import UseLoading from '../shared/\_useLoading.mdx';
import VoteDemo from '../shared/\_VoteDemo.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Mutaciones de datos

Usar nuestros endpoints de [crear, actualizar y borrar](/docs/concepts/atomic-mutations) con
[Controller.fetch()](../api/Controller.md#fetch) actualiza de forma reactiva _todos_ los componentes que corresponde, de manera atómica (al mismo tiempo).

[useController()](../api/useController.md) da a los componentes acceso a este [setState()](https://react.dev/reference/react/useState#setstate) global potenciado.

[//]: # 'TODO: Add create, and delete examples as well (in tabs)'

<FrameworkPlayground defaultOpen="n" row fixtures={todoFixtures}>

```ts title="TodoResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;

  static key = 'Todo';
}
export const TodoResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  searchParams: {} as { userId?: string | number } | undefined,
  schema: Todo,
  optimistic: true,
});
```

:::react

```tsx title="TodoItem" {7-11,13-15}
import { useController } from '@data-client/react';
import { TodoResource, type Todo } from './TodoResource';

export default function TodoItem({ todo }: { todo: Todo }) {
  const ctrl = useController();
  const handleChange = e =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: e.currentTarget.checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: todo.id,
    });
  return (
    <div className="listItem nogap">
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleChange}
        />
        {todo.completed ? <s>{todo.title}</s> : todo.title}
      </label>
      <CancelButton onClick={handleDelete} />
    </div>
  );
}
```

```tsx title="CreateTodo" {8-11} collapsed
import { useController } from '@data-client/react';
import { TodoResource } from './TodoResource';

export default function CreateTodo({ userId }: { userId: number }) {
  const ctrl = useController();
  const handleKeyDown = async e => {
    if (e.key === 'Enter') {
      ctrl.fetch(TodoResource.getList.push, {
        userId,
        title: e.currentTarget.value,
      });
      e.currentTarget.value = '';
    }
  };
  return (
    <div className="listItem nogap">
      <label>
        <input type="checkbox" name="new" checked={false} disabled />
        <TextInput size="small" onKeyDown={handleKeyDown} />
      </label>
      <CancelButton />
    </div>
  );
}
```

```tsx title="TodoList" collapsed
import { useSuspense } from '@data-client/react';
import { TodoResource } from './TodoResource';
import TodoItem from './TodoItem';
import CreateTodo from './CreateTodo';

function TodoList() {
  const userId = 1;
  const todos = useSuspense(TodoResource.getList, { userId });
  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.pk()} todo={todo} />
      ))}
      <CreateTodo userId={userId} />
    </div>
  );
}
render(<TodoList />);
```

:::

:::vue

```html title="TodoItem.vue" {8-12,14-16}
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource, type Todo } from './TodoResource';

  const props = defineProps<{ todo: Todo }>();
  const ctrl = useController();

  const handleChange = (e: Event) =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: props.todo.id },
      { completed: (e.target as HTMLInputElement).checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: props.todo.id,
    });
</script>

<template>
  <div class="listItem nogap">
    <label>
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="handleChange"
      />
      <s v-if="todo.completed">{{ todo.title }}</s>
      <template v-else>{{ todo.title }}</template>
    </label>
    <CancelButton @click="handleDelete" />
  </div>
</template>
```

```html title="CreateTodo.vue" {10-13} collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './TodoResource';

  const props = defineProps<{ userId: number }>();
  const ctrl = useController();

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      ctrl.fetch(TodoResource.getList.push, {
        userId: props.userId,
        title: (e.target as HTMLInputElement).value,
      });
      (e.target as HTMLInputElement).value = '';
    }
  };
</script>

<template>
  <div class="listItem nogap">
    <label>
      <input type="checkbox" name="new" :checked="false" disabled />
      <TextInput size="small" @keydown="handleKeyDown" />
    </label>
    <CancelButton />
  </div>
</template>
```

```html title="TodoList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { TodoResource } from './TodoResource';
  import TodoItem from './TodoItem.vue';
  import CreateTodo from './CreateTodo.vue';

  const userId = 1;
  const todos = await useSuspense(TodoResource.getList, { userId });
</script>

<template>
  <div>
    <TodoItem v-for="todo in todos" :key="todo.pk()" :todo="todo" />
    <CreateTodo :userId="userId" />
  </div>
</template>
```

:::

</FrameworkPlayground>

En lugar de disparar cascadas de invalidación o usar funciones de actualización escritas a mano,
<abbr title="Reactive Data Client">Data Client</abbr> actualiza de forma reactiva los componentes que corresponde usando la respuesta de la obtención.

## Mutaciones optimistas basadas en el estado anterior {#optimistic-updates}

<VoteDemo />

[getOptimisticResponse](/rest/guides/optimistic-updates) es igual que [setState con una función de actualización](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). [Snapshot](../api/Snapshot.md) ofrece acceso con tipado seguro al valor anterior del store,
que usamos para devolver la respuesta de obtención _esperada_.

Reactive Data Client garantiza la [integridad de los datos frente a cualquier fallo de red o condición de carrera](/rest/guides/optimistic-updates#optimistic-transforms), así que no te
preocupes por los fallos de red, por varias llamadas de mutación que editan los mismos datos ni por otros problemas
habituales de la programación asíncrona.

## Seguimiento de la carga de la mutación {#tracking-mutation-loading}

[useLoading()](../api/useLoading.md) mejora las funciones asíncronas haciendo seguimiento de sus estados de carga y error.

<UseLoading />
