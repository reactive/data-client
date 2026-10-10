---
title: 在 React 中变更异步数据
vue_title: 在 Vue 中变更异步数据
sidebar_label: 变更数据
description: 安全且高性能的数据变更，无需重新获取，也无需编写状态管理代码。
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

# 数据变更

将我们的[创建、更新和删除](/docs/concepts/atomic-mutations) endpoint 与
[Controller.fetch()](../api/Controller.md#fetch) 配合使用，会以响应式的方式原子地（同时）更新_所有_相关组件。

[useController()](../api/useController.md) 让组件可以使用这个全局的、功能增强版的 [setState()](https://react.dev/reference/react/useState#setstate)。

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

<abbr title="Reactive Data Client">Data Client</abbr> 不会触发级联失效，也不需要手写更新函数，
而是利用 fetch 响应以响应式的方式更新相关组件。

## 基于先前状态的乐观变更 {#optimistic-updates}

<VoteDemo />

[getOptimisticResponse](/rest/guides/optimistic-updates) 就像[使用更新函数的 setState](https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state)。[Snapshot](../api/Snapshot.md) 提供对先前 store 值的类型安全访问，
我们用它来返回_预期的_ fetch 响应。

Reactive Data Client 能[在任何可能的网络故障或竞态条件下确保数据完整性](/rest/guides/optimistic-updates#optimistic-transforms)，因此你
无需担心网络故障、多次变更调用编辑同一份数据，或异步编程中的其他常见
问题。

## 跟踪变更的加载状态 {#tracking-mutation-loading}

[useLoading()](../api/useLoading.md) 通过跟踪异步函数的加载状态和错误状态来增强它们。

<UseLoading />
