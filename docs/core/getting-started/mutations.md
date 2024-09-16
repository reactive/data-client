---
title: Mutating Asynchronous Data in React
sidebar_label: Mutate Data
description: Safe and high performance data mutations without refetching or writing state management.
---

import ProtocolTabs from '@site/src/components/ProtocolTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import { TodoResource } from '@site/src/components/Demo/code/todo-app/rest/resources';
import { todoFixtures } from '@site/src/fixtures/todos';
import { RestEndpoint } from '@data-client/rest';
import UseLoading from '../shared/\_useLoading.mdx';
import VoteDemo from '../shared/\_VoteDemo.mdx';

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Data mutations

Using our [Create, Update, and Delete](/docs/concepts/atomic-mutations) endpoints with
[Controller.fetch()](../api/Controller.md#fetch) reactively updates _all_ appropriate components atomically (at the same time).

[useController()](../api/useController.md) gives components access to this global supercharged [setState()](https://react.dev/reference/react/useState#setstate).

[//]: # 'TODO: Add create, and delete examples as well (in tabs)'

<HooksPlayground defaultOpen="n" row fixtures={todoFixtures}>

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
        {todo.completed ? <strike>{todo.title}</strike> : todo.title}
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

</HooksPlayground>

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
