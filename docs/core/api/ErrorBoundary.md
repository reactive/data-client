---
title: '<ErrorBoundary />'
---

Displays a fallback component an error is thrown (including rejected [useSuspense()](./useSuspense.md)).

:::info

Reusable React error boundary component.

:::

## Usage

Place `ErrorBoundary` [at or above navigational boundaries](../getting-started/data-dependency.md#boundaries) like **pages, routes, or modals** to "catch" errors and render a fallback UI.

```tsx
import React from 'react';
import { ErrorBoundary } from '@data-client/react';

export default function MyPage() {
  return (
    <ErrorBoundary>
      <SuspendingComponent />
    </ErrorBoundary>
  );
}

function SuspendingComponent() {
  const data = useSuspense(MyEndpoint);

  return <div>{data.text}</div>;
}
```

## Props

```tsx
interface Props {
  children: React.ReactNode;
  className?: string;
  fallbackComponent: React.ComponentType<{
    error: E;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallbackComponent

```tsx
import React from 'react';
import { CacheProvider, ErrorBoundary } from '@data-client/react';

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
    <CacheProvider>
      <ErrorBoundary fallbackComponent={ErrorPage} className="error">
        <Router />
      </ErrorBoundary>
    </CacheProvider>
  );
}
```

### listen

Subscription handler to reset error state on events like URL location changes. This is great
for placing a boundary to wrap routing components.

An example using [Anansi Router](https://www.npmjs.com/package/@anansi/router), which uses
[history](https://www.npmjs.com/package/history) subscription.

```tsx
import { useController } from '@anansi/router';
import { ErrorBoundary } from '@data-client/react';

function App() {
  const { history } = useController();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <ErrorBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </ErrorBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```

### className

`className` to forward to [fallbackComponent](#fallbackcomponent)
