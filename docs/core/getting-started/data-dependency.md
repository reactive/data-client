---
title: Rendering Asynchronous Data
sidebar_label: Render Data
---

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import HooksPlayground from '@site/src/components/HooksPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

Make your components reusable by binding the data where you need it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<Tabs
defaultValue="Single"
values={[
{ label: 'Single', value: 'Single' },
{ label: 'List', value: 'List' },
]}>
<TabItem value="Single">

<HooksPlayground defaultOpen="n" row>

```ts title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="Todo.tsx" {5}
import { useSuspense } from '@rest-hooks/react';
import { TodoResource } from './api/Todo';

function TodoDetail({ id }: { id: number }) {
  const todo = useSuspense(TodoResource.get, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
```

</HooksPlayground>

</TabItem>
<TabItem value="List">

<HooksPlayground defaultOpen="n" row>

```ts title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="TodoList.tsx" {5}
import { useSuspense } from '@rest-hooks/react';
import { TodoResource } from './api/Todo';

function TodoList() {
  const todos = useSuspense(TodoResource.getList);
  return (
    <section style={{ maxHeight: '300px', overflow: 'scroll' }}>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </section>
  );
}
render(<TodoList />);
```

</HooksPlayground>

</TabItem>
</Tabs>

<a href="https://beta.reactjs.org/learn/passing-data-deeply-with-context" target="_blank">
<ThemedImage
alt="Endpoints used in many contexts"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

No more prop drilling, or cumbersome external state management. Rest Hooks guarantees global referential equality,
data safety and performance.

Co-location also allows [Server Side Rendering](../guides/ssr.md) to incrementally stream HTML, greatly reducing [TTFB](https://web.dev/ttfb/).
[Rest Hooks SSR](../guides/ssr.md) automatically hydrates its store, allowing immediate interactive mutations with **zero** client-side
fetches on first load.

<ConditionalDependencies />

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much
like [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place [<AsyncBoundary /\>](../api/AsyncBoundary.md) at or above navigational boundaries like pages,
routes or modals.

<LanguageTabs>

```tsx {6,12,23-25}
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

```jsx {6,12,18-20}
import React, { Suspense } from 'react';
import { AsyncBoundary } from '@rest-hooks/react';

export default function TodoPage({ id }) {
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

[useTransition](https://beta.reactjs.org/apis/react/useTransition) powered routers or navigation
means React never has to show a loading fallback. Of course, these are only possible in React 18 or above,
so for 16 and 17 this will merely centralize the fallback, eliminating 100s of loading spinners.

In either case, a signficiant amount of component complexity is removed by centralizing fallback conditionals.

### Stateful

You may find cases where it's still useful to use a stateful approach to fallbacks when using React 16 and 17.
For these cases, or compatibility with some component libraries, [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror - is provided.

<HooksPlayground defaultOpen="n" row>

```ts title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
});
```

```tsx title="Todo.tsx" {5}
import { useDLE } from '@rest-hooks/react';
import { TodoResource } from './api/Todo';

function TodoDetail({ id }: { id: number }) {
  const { loading, error, data: todo } = useDLE(TodoResource.get, { id });
  if (loading || !todo) return <div>loading</div>;
  if (error) return <div>{error.message}</div>;

  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
```

</HooksPlayground>

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

<HooksPlayground defaultOpen="n" row>

```ts title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  pollFrequency: 10000,
});
```

```tsx title="Todo.tsx" {5}
import { useLive } from '@rest-hooks/react';
import { TodoResource } from './api/Todo';

function TodoDetail({ id }: { id: number }) {
  const todo = useLive(TodoResource.get, { id });
  return <div>{todo.title}</div>;
}
render(<TodoDetail id={1} />);
```

</HooksPlayground>

</TabItem>
<TabItem value="List">

<HooksPlayground defaultOpen="n" row>

```ts title="api/Todo.ts" collapsed
export class Todo extends Entity {
  id = 0;
  userId = 0;
  title = '';
  completed = false;
  pk() {
    return `${this.id}`;
  }
}
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  pollFrequency: 10000,
});
```

```tsx title="TodoList.tsx" {5}
import { useLive } from '@rest-hooks/react';
import { TodoResource } from './api/Todo';

function TodoList() {
  const todos = useLive(TodoResource.getList);
  return (
    <section style={{ maxHeight: '300px', overflowY: 'scroll' }}>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </section>
  );
}
render(<TodoList />);
```

</HooksPlayground>

</TabItem>
</Tabs>

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency-number) to an endpoint.
For pushed based networking protocols like websockets, see the [example websocket stream manager](../api/Manager.md#middleware-data-stream).

```typescript
export const TodoResource = createResource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/todos/:id',
  schema: Todo,
  // highlight-next-line
  pollFrequency: 10000,
});
```

### Live Crypto Price Example

<HooksPlayground defaultOpen="n">

```typescript title="api/ExchangeRates.ts" {14}
export class ExchangeRates extends Entity {
  readonly currency: string = 'USD';
  readonly rates: Record<string, string> = {};

  pk(): string {
    return this.currency;
  }
}
export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  pollFrequency: 15000,
});
```

```tsx title="AssetPrice.tsx" {5}
import { useLive } from '@rest-hooks/react';
import { getExchangeRates } from './api/ExchangeRates';

function AssetPrice({ symbol }: { symbol: string }) {
  const { data: price } = useLive(getExchangeRates, { currency: 'USD' });
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
