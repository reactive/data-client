---
title: 100x faster React with Optimistic Updates
vue_title: 100x faster Vue with Optimistic Updates
sidebar_label: Optimistic Updates
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';
import { todoFixtures } from '@site/src/fixtures/todos';
import OptimisticTransform from '../shared/\_optimisticTransform.mdx';
import OptimisticRace from '@site/src/components/OptimisticRace';

export const timingDemo = [
  { delay: 800, store: 'open' },
  { delay: 1000, click: 'button.upvote' },
  { delay: 250, click: 'button.upvote' },
  { delay: 250, click: 'button.upvote' },
  { delay: 250, click: 'button.upvote' },
  // past the slowest increment response (the fixture's 4.7s), so the
  // timeline holds every response
  { wait: 5000 },
  { click: { in: 'store', selector: 'button[aria-label="Diff"]' } },
  // the first action (the count's load), then on through each change, time
  // to read each diff: 5 = the changes the 4 clicks make, as Diff's "Next
  // change" counts them (more would idle at the end before the close)
  {
    click: {
      in: 'store',
      selector: '[role="group"][aria-label^="Scrubber"] button[data-id]',
    },
  },
  ...Array.from({ length: 5 }, () => ({
    delay: 1500,
    click: { in: 'store', selector: 'button[aria-label="Next change"]' },
  })),
  // Store → Code: back to the code that did it
  { delay: 2000, store: 'close' },
];

# Optimistic Updates

An optimistic update shows a mutation's result before the server responds, so the UI does not wait for the network.
Reactive Data Client replaces it with the server's response when that arrives, rolls it back if the request fails, and
resolves the race conditions that overlapping requests cause.

## Resources

To make a [resource()](../api/resource.md) optimistic, set [optimistic: true](../api/resource.md#optimistic).

<FrameworkPlayground defaultOpen="n" row fixtures={todoFixtures}>

```ts title="TodoResource" {16}
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

```tsx title="TodoItem" collapsed
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
        {todo.title}
      </label>
      <CancelButton onClick={handleDelete} />
    </div>
  );
}
```

```tsx title="CreateTodo" collapsed
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
        <input
          type="text"
          aria-label="New todo"
          placeholder="New todo"
          onKeyDown={handleKeyDown}
        />
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
    <div className="list">
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

```html title="TodoItem.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource, type Todo } from './TodoResource';

  const props = defineProps<{ todo: Todo }>();
  const ctrl = useController();
  const handleChange = e =>
    ctrl.fetch(
      TodoResource.partialUpdate,
      { id: props.todo.id },
      { completed: e.currentTarget.checked },
    );
  const handleDelete = () =>
    ctrl.fetch(TodoResource.delete, {
      id: props.todo.id,
    });
</script>

<template>
  <div class="listItem nogap">
    <label>
      <input type="checkbox" :checked="todo.completed" @change="handleChange" />
      {{ todo.title }}
    </label>
    <CancelButton @click="handleDelete" />
  </div>
</template>
```

```html title="CreateTodo.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { TodoResource } from './TodoResource';

  const props = defineProps<{ userId: number }>();
  const ctrl = useController();
  const handleKeyDown = async e => {
    if (e.key === 'Enter') {
      ctrl.fetch(TodoResource.getList.push, {
        userId: props.userId,
        title: e.currentTarget.value,
      });
      e.currentTarget.value = '';
    }
  };
</script>

<template>
  <div class="listItem nogap">
    <label>
      <input type="checkbox" name="new" :checked="false" disabled />
      <input
        type="text"
        aria-label="New todo"
        placeholder="New todo"
        @keydown="handleKeyDown"
      />
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
  <div class="list">
    <TodoItem v-for="todo in todos" :key="todo.pk()" :todo="todo" />
    <CreateTodo :userId="userId" />
  </div>
</template>
```

:::

</FrameworkPlayground>

Each mutation then predicts the server's response:

| Endpoint                                                                                        | Optimistic response                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `update`, `getList.push`, `getList.unshift`, `getList.assign`, `getList.remove`, `getList.move` | The URL params merged with the body (`FormData` becomes an object) |
| `partialUpdate`                                                                                 | The cached entity with the body merged in                          |
| `delete`                                                                                        | The params, which remove the entity                                |

A new item from `getList.push` or `getList.unshift` usually has no `id` yet, so Data Client gives it a temporary
random primary key. Until the server responds, the client does not know the item's real `id`, so other mutations on
it fail. Disable them until the item has its real `id`.

If the entity is not in the cache, `partialUpdate` [aborts](/docs/api/Snapshot#abort) its optimistic update and waits
for the server, rather than show an entity made only of the changed fields.

To make only some endpoints optimistic, or to predict a different response, set
[getOptimisticResponse()](../api/RestEndpoint.md#getoptimisticresponse) with
[Resource.extend()](../api/resource.md#extend). For an Entity, it only needs to return the
[primary key](../api/Entity.md#pk) and the changed fields: the other fields keep their cached values.

## Optimistic Transforms

When the new value depends on the current one, such as a counter or a toggle, read the current value with
[snap.get()](/docs/api/Snapshot#get) and compute the update from it:

<OptimisticTransform />

Data Client records when each fetch starts and keeps its optimistic update until that request resolves or fails. When
responses arrive out of order, an Entity keeps the data from the request that started later.

### Example race condition

This example sends two increments, and the first response arrives after the second.

<OptimisticRace />

A library that applies each response as it arrives shows 0, 2, then 1. With naive optimistic updates, it shows 0, 1,
2, then falls back to 1. Both end on the wrong count. Data Client shows 0, 1, then 2, and keeps 2 when the older
response arrives last.

### Servers that reorder requests {#server-timings}

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Server
    Client->>Server: Request
    Note over Client,Server: Processing
    Server->>Client: Response
```

A mutation's timing varies in three places: the request, the server's processing, and the response. Data Client
handles out-of-order responses. If requests can reach the server, or be saved, in a different order than they were
sent, a race condition remains.

To fix it, order every update by one clock. Use the client's clock, because optimistic updates happen on the client and
the server's clock can differ:

1. Send the client's current time as `updatedAt` in the body, with [getRequestInit()](../api/RestEndpoint.md#getRequestInit).
1. On the server, apply requests in `updatedAt` order, store `updatedAt` on the entity, and return it in every response.
1. Override [shouldReorder()](../api/Entity.md#shouldreorder), so a response with an older `updatedAt` does not
   overwrite a newer one.

In [getOptimisticResponse()](../api/RestEndpoint.md#getoptimisticresponse), set `updatedAt` to
[snap.fetchedAt](/docs/api/Snapshot#fetchedat), the time the fetch started, so the optimistic update uses the same clock.

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/api/count'}),
args: [],
response: { count: 0, updatedAt: Date.now() }
},
{
endpoint: new RestEndpoint({
path: '/api/count/increment',
method: 'POST',
body: undefined,
}),
fetchResponse(input, init) {
return ({
"count": (this.count = this.count + 1),
"updatedAt": JSON.parse(init.body).updatedAt,
});
},
delay: () => 200 + Math.random() * 4500,
delayCollapse:true,
}
]}
getInitialInterceptorData={() => ({ count: 0 })}
row
autoRun={timingDemo}
>

```ts title="count" {11-13} collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class CountEntity extends Entity {
  count = 0;
  updatedAt = 0;

  pk() {
    return `SINGLETON`;
  }

  static shouldReorder(existingMeta, incomingMeta, existing, incoming) {
    return incoming.updatedAt < existing.updatedAt;
  }
}
export const getCount = new RestEndpoint({
  path: '/api/count',
  schema: CountEntity,
  name: 'get',
});
```

```ts title="increment" {10-16,22}
import { RestEndpoint } from '@data-client/rest';
import { CountEntity } from './count';

export const increment = new RestEndpoint({
  path: '/api/count/increment',
  method: 'POST',
  body: undefined,
  name: 'increment',
  schema: CountEntity,
  getRequestInit() {
    // this is a substitute for super.getRequestInit()
    // since we aren't in a class context
    return RestEndpoint.prototype.getRequestInit.call(this, {
      updatedAt: Date.now(),
    });
  },
  getOptimisticResponse(snap) {
    const data = snap.get(CountEntity, {});
    if (!data) throw snap.abort;
    return {
      count: data.count + 1,
      updatedAt: snap.fetchedAt,
    };
  },
});
```

:::react

```tsx title="CounterPage" collapsed
import React from 'react';
import { useController, useSuspense } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getCount } from './count';
import { increment } from './increment';

function CounterPage() {
  const ctrl = useController();
  const { count } = useSuspense(getCount);
  const [clicks, setClicks] = React.useState(count);
  const clickHandler = () => {
    setClicks(c => c + 1);
    return ctrl.fetch(increment);
  };
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Votes</h1>
      </header>
      <div className="listItem">
        <button className="upvote" onClick={clickHandler} aria-label="Upvote" />
        <dl className="stats">
          <div>
            <dt>Data Client</dt>
            <dd><NumberFlow value={count} /></dd>
          </div>
          <div>
            <dt>Clicks</dt>
            <dd><NumberFlow value={clicks} /></dd>
          </div>
        </dl>
      </div>
    </>
  );
}
render(<CounterPage />);
```

:::

:::vue

```html title="CounterPage.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import { useController, useSuspense } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getCount } from './count';
  import { increment } from './increment';

  const ctrl = useController();
  const data = await useSuspense(getCount);
  const clicks = ref(data.value.count);
  const clickHandler = () => {
    clicks.value += 1;
    return ctrl.fetch(increment);
  };
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Votes</h1>
  </header>
  <div class="listItem">
    <button class="upvote" @click="clickHandler" aria-label="Upvote" />
    <dl class="stats">
      <div>
        <dt>Data Client</dt>
        <dd><NumberFlow :value="data.count" /></dd>
      </div>
      <div>
        <dt>Clicks</dt>
        <dd><NumberFlow :value="clicks" /></dd>
      </div>
    </dl>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

## Keep clicks responsive on heavy screens {#transition}

Like React's [useOptimistic()](https://react.dev/reference/react/useOptimistic), an optimistic update renders
before the browser paints the click. If many components show the changed data, that render can make the click feel
slow. First make the render cheaper, with [React Compiler](https://react.dev/learn/react-compiler) or `memo()` on
expensive components. If the click is still slow, call `fetch()` inside
[startTransition()](https://react.dev/reference/react/startTransition) (React 18+). The browser then paints and handles
input before the update renders:

```tsx
import { startTransition } from 'react';
import { useController } from '@data-client/react';
import { TodoResource, type Todo } from './TodoResource';

export function CompleteButton({ todo }: { todo: Todo }) {
  const ctrl = useController();
  const complete = () => {
    startTransition(() => {
      ctrl.fetch(
        TodoResource.partialUpdate,
        { id: todo.id },
        { completed: true },
      );
    });
  };
  return <button onClick={complete}>Complete</button>;
}
```

React renders the optimistic update at transition priority, which yields to user input.

- Wrap the call in braces, as above, so the callback returns nothing. In React 19, a callback that returns the
  `fetch()` promise is an async Action, and React holds the optimistic update until the server responds.
- Do not use this for a controlled input, like `TodoItem`'s checkbox. React resets the input to its last rendered
  value, so the checkbox flips back until the transition renders (see the
  [startTransition() caveats](https://react.dev/reference/react/startTransition#caveats)).

:::
