---
title: Co-locate Data Dependencies
sidebar_label: Data Dependencies
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';

Co-locating data dependencies means we only use data-binding hooks like [useResource()](../api/useresource)
in components where we display/use their data directly.

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useResource } from 'rest-hooks';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  // highlight-next-line
  const todo = useResource(todoDetail, { id });
  return <div>{todo.title}</div>;
}
```

</TabItem>
<TabItem value="List">

```tsx
import { useResource } from 'rest-hooks';
// local directory for API definitions
import { todoList } from 'endpoints/todo';

export default function TodoList() {
  // highlight-next-line
  const todos = useResource(todoList, {});
  return (
    <section>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </section>
  );
}
```

</TabItem>
</Tabs>

[useResource()](../api/useresource) guarantees access to data with sufficient [freshness](../api/Endpoint#dataexpirylength-number).
This means it may issue network calls, and it may [suspend](../concepts/loading-state.md) until the the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [endpoints](../api/Endpoint).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

:::tip Conditional Dependencies

Use `null` as the second argument on any rest hooks to indicate "do nothing."

```typescript
// todo could be undefined if id is undefined
const todo = useResource(todoDetail, id ? { id } : null);
```

:::

## Async Fallbacks (loading/error) {#async-fallbacks}

This works great if the client already has the data. But while it's waiting on a response from the server,
we need some kind of loading indication. Similarly if there is an error in the fetch, we should indicate such.
These are called 'fallbacks'.

### Boundaries (Suspense/NetworkErrorBoundary) {#boundaries}

In React 18, the best way to achieve this is with boundaries. ([React 16.3+ supported](#stateful), but less powerful.)
`<Suspense />` and `<NetworkErrorBoundary /\>`
are wrapper components which show fallback [elements](https://reactjs.org/docs/rendering-elements.html)
when any component rendered as a descendent is loading or errored while loading their data dependency.

<LanguageTabs>

```tsx {6,12,23-25}
import React, { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

export default function TodoPage({ id }: { id: number }) {
  return (
    <AsyncBoundary>
      <section>
        <TodoDetail id={1} />
        <TodoDetail id={5} />
        <TodoDetail id={10} />
      </section>
    </AsyncBoundary>
  );
}

interface Props {
  fallback: React.ReactElement;
  children: React.ReactNode;
}

function AsyncBoundary({ children, fallback = 'loading' }: Props) {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
    </Suspense>
  );
}
```

```jsx {6,12,18-20}
import React, { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

export default function TodoPage({ id }: { id: number }) {
  return (
    <AsyncBoundary>
      <section>
        <TodoDetail id={1} />
        <TodoDetail id={5} />
        <TodoDetail id={10} />
      </section>
    </AsyncBoundary>
  );
}

function AsyncBoundary({ children, fallback = 'loading' }: Props) {
  return (
    <Suspense fallback={fallback}>
      <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
    </Suspense>
  );
}
```

</LanguageTabs>

:::note

This greatly simplifies complex orchestrations of data dependencies by decoupling where to show fallbacks
from the components using the data.

:::

For instance, here we have three different components requesting different todo data. These will all loading in
parallel and only show one loading indicator instead of filling the screen with them. Although this case
is obviously contrived; in practice this comes up quite often, especially when data dependencies end up deeply nesting.

### Stateful

You may find cases where it's still useful to use a stateful approach to fallbacks when using React 16 and 17.
For these cases, or compatibility with some component libraries, the `@rest-hooks/legacy` package includes
a hook that uses stateful loading and errors.

```tsx
import { useStatefulResource } from '@rest-hooks/legacy';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  const {
    loading,
    error,
    data: todo,
  } = useStatefulResource(todoDetail, { id });
  if (loading) return 'loading';
  if (error) return error.status;
  return <div>{todo.title}</div>;
}
```

Read more about [useStatefulResource](../guides/no-suspense)

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted.

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useResource } from 'rest-hooks';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  const todo = useResource(todoDetail, { id });
  // highlight-next-line
  useSubscription(todoDetail, { id });
  return <div>{todo.title}</div>;
}
```

</TabItem>
<TabItem value="List">

```tsx
import { useResource } from 'rest-hooks';
// local directory for API definitions
import { todoList } from 'endpoints/todo';

export default function TodoList() {
  const todos = useResource(todoList, {});
  // highlight-next-line
  useSubscription(todoList, {});
  return (
    <section>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </section>
  );
}
```

</TabItem>
</Tabs>

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](../api/Endpoint.md#pollfrequency-number) to an endpoint.
For pushed based networking protocols like websockets, see the [example websocket stream manager](../api/Manager.md#middleware-data-stream).

```typescript
const fetchTodoDetail = ({ id }) =>
  fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(res =>
    res.json(),
  );
const todoDetail = new Endpoint(
  fetchTodoDetail,
  // highlight-next-line
  { pollFrequency: 1000 },
);
```
