---
title: '<AsyncBoundary />'
---

<head>
  <title>AsyncBoundary - Centralize loading and error handling</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

Handles loading and error conditions of Suspense.

In React 18, this will create a [concurrent split](https://react.dev/reference/react/useTransition), and in 16 and 17 it will show loading fallbacks. If there is an irrecoverable error, it will show an error fallback.

:::tip

Learn more about boundary placement by learning how to [co-locate data dependencies](../getting-started/data-dependency.md)

:::

## Usage

Place `AsyncBoundary` [at or above navigational boundaries](../getting-started/data-dependency.md#boundaries) like **pages, routes, or modals**.

```tsx
import React from 'react';
import { AsyncBoundary } from '@data-client/react';

export default function MyPage() {
  return (
    <AsyncBoundary>
      <SuspendingComponent />
    </AsyncBoundary>
  );
}

function SuspendingComponent() {
  const data = useSuspense(MyEndpoint);

  return <div>{data.text}</div>;
}
```

## Props

```ts
interface BoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  errorComponent?: React.ComponentType<{
    error: NetworkError;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallback

Any renderable (React Node) element to show when loading

### errorComponent

Component to handle caught errors

#### Custom fallback example {#custom-fallback}

```tsx
import React from 'react';
import { DataProvider, AsyncBoundary } from '@data-client/react';

function ErrorPage({
  error,
  className,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}) {
  return (
    <pre role="alert" className={className}>
      {error.message} <button onClick={resetErrorBoundary}>Reset</button>
    </pre>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AsyncBoundary fallback="loading" errorComponent={ErrorPage}>
        <Router />
      </AsyncBoundary>
    </DataProvider>
  );
}
```

### errorClassName

`className` to forward to [errorComponent](#errorcomponent)

### listen

Subscription handler to reset error state on events like URL location changes. This is great
for placing a boundary to wrap routing components.

An example using [Anansi Router](https://www.npmjs.com/package/@anansi/router), which uses
[history](https://www.npmjs.com/package/history) subscription.

```tsx
import { useController } from '@anansi/router';
import { AsyncBoundary } from '@data-client/react';

function App() {
  const { history } = useController();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <AsyncBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </AsyncBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```
