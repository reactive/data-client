---
title: Mutating Asynchronous Data in Vue
sidebar_label: Mutate Data
description: Safe and high performance data mutations without refetching or writing state management.
---

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import { TodoResource } from '@site/src/components/Demo/code/todo-app/rest/resources';
import { todoFixtures } from '@site/src/fixtures/todos';
import { RestEndpoint } from '@data-client/rest';
import UseLoading from '../shared/\_useLoading.vue.mdx';
import VoteDemo from '../shared/\_VoteDemo.vue.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Data mutations

Using our [Create, Update, and Delete](/docs/concepts/atomic-mutations) endpoints with
[Controller.fetch()](../api/Controller.md#fetch) reactively updates _all_ appropriate components atomically (at the same time).

[useController()](../api/useController.md) gives components access to this global supercharged [setState()](https://react.dev/reference/react/useState#setstate).

[//]: # 'TODO: Add create, and delete examples as well (in tabs)'

<TypeScriptEditor row>

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

```html title="TodoItem.vue" {8-12,14-16}
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource, type Todo } from './TodoResource';

  defineProps<{ todo: Todo }>();
  const ctrl = useController();

  const handleChange = (e: Event) =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: todo.id },
      { completed: (e.target as HTMLInputElement).checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: todo.id,
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
      <strike v-if="todo.completed">{{ todo.title }}</strike>
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

</TypeScriptEditor>

Rather than triggering invalidation cascades or using manually written update functions,
<abbr title="Reactive Data Client">Data Client</abbr> reactively updates appropriate components using the fetch response.

## Optimistic mutations based on previous state {#optimistic-updates}

<VoteDemo />

[getOptimisticResponse](/rest/guides/optimistic-updates) is just like [setState with an updater function](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state). [Snapshot](../api/Snapshot.md) provides typesafe access to the previous store value,
which we use to return the _expected_ fetch response.

Reactive Data Client ensures [data integrity against any possible networking failure or race condition](/rest/guides/optimistic-updates#optimistic-transforms), so don't
worry about network failures, multiple mutation calls editing the same data, or other common
problems in asynchronous programming.

## Tracking mutation loading

[useLoading()](../api/useLoading.md) enhances async functions by tracking their loading and error states.

<UseLoading />

