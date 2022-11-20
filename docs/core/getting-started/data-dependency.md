---
title: Co-locate Data Dependencies
sidebar_label: Data Dependencies
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

Co-locating data dependencies means we only use data-binding hooks like [useSuspense()](../api/useSuspense)
in components where we display/use their data directly.

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useSuspense } from '@rest-hooks/react';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  // highlight-next-line
  const todo = useSuspense(todoDetail, { id });
  return <div>{todo.title}</div>;
}
```

</TabItem>
<TabItem value="List">

```tsx
import { useSuspense } from '@rest-hooks/react';
// local directory for API definitions
import { todoList } from 'endpoints/todo';

export default function TodoList() {
  // highlight-next-line
  const todos = useSuspense(todoList, {});
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

[useSuspense()](../api/useSuspense) guarantees access to data with sufficient [freshness](/rest/api/Endpoint#dataexpirylength-number).
This means it may issue network calls, and it may [suspend](#boundaries) until the the fetch completes.
Param changes will result in accessing the appropriate data, which also sometimes results in new network calls and/or
suspends.

- Fetches are centrally controlled, and thus automatically deduplicated
- Data is centralized and normalized guaranteeing consistency across uses, even with different [endpoints](/rest/api/Endpoint).
  - (For example: navigating to a detail page with a single entry from a list view will instantly show the same data as the list without
    requiring a refetch.)

<ConditionalDependencies />

## Async Fallbacks (loading/error) {#async-fallbacks}

This works great if the client already has the data. But while it's waiting on a response from the server,
we need some kind of loading indication. Similarly if there is an error in the fetch, we should indicate such.
These are called 'fallbacks'.

### Async Boundaries {#boundaries}

In React 18, the best way to achieve this is with boundaries. Rest Hooks provides [<AsyncBoundary /\>](../api/AsyncBoundary.md),
which uses `<Suspense />` for loading state and [<NetworkErrorBoundary /\>](../api/NetworkErrorBoundary.md) for error states of
any descendant components.

<LanguageTabs>

```tsx {6,12,23-25}
import React, { Suspense } from 'react';
import { AsyncBoundary } from '@rest-hooks/react';

export default function TodoPage({ id }: { id: number }) {
  return (
    <AsyncBoundary fallback="loading">
      <section>
        <TodoDetail id={1} />
        <TodoDetail id={5} />
        <TodoDetail id={10} />
      </section>
    </AsyncBoundary>
  );
}
```

```jsx {6,12,18-20}
import React, { Suspense } from 'react';
import { AsyncBoundary } from '@rest-hooks/react';

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
For these cases, or compatibility with some component libraries, [useDLE()](../api/useDLE.md) is provided.

```tsx
import { useDLE } from '@rest-hooks/react';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  const { loading, error, data: todo } = useDLE(todoDetail, { id });
  if (loading) return 'loading';
  if (error) return error.status;
  return <div>{todo.title}</div>;
}
```

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted. [useLive()](../api/useLive.md) calls both
[useSubscription()](../api/useSubscription.md) and [useSuspense()](../api/useSuspense.md), making it quite
easy to use fresh data.

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

```tsx
import { useLive } from '@rest-hooks/react';
// local directory for API definitions
import { todoDetail } from 'endpoints/todo';

export default function TodoDetail({ id }: { id: number }) {
  // highlight-next-line
  const todo = useLive(todoDetail, { id });
  return <div>{todo.title}</div>;
}
```

</TabItem>
<TabItem value="List">

```tsx
import { useSuspense } from '@rest-hooks/react';
// local directory for API definitions
import { todoList } from 'endpoints/todo';

export default function TodoList() {
  const todos = useLive(todoList, {});
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
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency-number) to an endpoint.
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

### Live Crypto Price Example

<HooksPlayground defaultOpen="n">

```typescript title="api/ExchangeRate.ts" {13}
export class ExchangeRate extends Entity {
  readonly currency: string = 'USD';
  readonly rates: Record<string, string> = {};

  pk(): string {
    return this.currency;
  }
}
export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates\\?currency=:currency',
  schema: { data: ExchangeRate },
  pollFrequency: 5000,
});
```

```tsx title="AssetPrice.tsx" {5}
import { useLive } from '@rest-hooks/react';
import { getExchangeRates } from './api/ExchangeRate';

function AssetPrice({ symbol }: { symbol: string }) {
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  const displayPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(1 / Number.parseFloat(price.rates[symbol]));
  return (
    <span>
      {symbol} {displayPrice}
    </span>
  );
}
render(<AssetPrice symbol="BTC" />);
```

</HooksPlayground>
