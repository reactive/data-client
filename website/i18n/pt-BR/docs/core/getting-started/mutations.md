---
title: Mutando dados assíncronos no React
vue_title: Mutando dados assíncronos no Vue
sidebar_label: Mutar dados
description: Mutações de dados seguras e de alto desempenho, sem refetch e sem escrever gerenciamento de estado.
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

# Mutações de dados

Usar nossos endpoints de [Create, Update e Delete](/docs/concepts/atomic-mutations) com
[Controller.fetch()](../api/Controller.md#fetch) atualiza de forma reativa _todos_ os componentes apropriados de maneira atômica (ao mesmo tempo).

[useController()](../api/useController.md) dá aos componentes acesso a este [setState()](https://react.dev/reference/react/useState#setstate) global turbinado.

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

Em vez de disparar cascatas de invalidação ou usar funções de atualização escritas à mão,
o <abbr title="Reactive Data Client">Data Client</abbr> atualiza de forma reativa os componentes apropriados usando a resposta do fetch.

## Mutações otimistas baseadas no estado anterior {#optimistic-updates}

<VoteDemo />

[getOptimisticResponse](/rest/guides/optimistic-updates) é como o [setState com uma função atualizadora](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). [Snapshot](../api/Snapshot.md) fornece acesso com tipagem segura ao valor anterior do store,
que usamos para retornar a resposta de fetch _esperada_.

O Reactive Data Client garante a [integridade dos dados contra qualquer possível falha de rede ou race condition](/rest/guides/optimistic-updates#optimistic-transforms), então não
se preocupe com falhas de rede, várias chamadas de mutação editando os mesmos dados ou outros problemas
comuns da programação assíncrona.

## Acompanhando o carregamento de mutações {#tracking-mutation-loading}

[useLoading()](../api/useLoading.md) aprimora funções assíncronas acompanhando seus estados de carregamento e de erro.

<UseLoading />
