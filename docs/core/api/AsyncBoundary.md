---
title: '<AsyncBoundary />'
---

<head>
  <title>AsyncBoundary - Centralize loading and error handling</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

Handles loading and error conditions of Suspense.

In React 18, this will create a concurrent split, and in 16 and 17 it will show loading fallbacks. If there is an
irrecoverable API error, it will show an error fallback.

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
  errorComponent?: React.ComponentType<{
    error: NetworkError;
    className?: string;
  }>;
}
```

### fallback

Any renderable (React Node) element to show when loading

### errorComponent

Component to handle caught errors

#### Custom fallback example {#custom-fallback}

```tsx
import React from 'react';
import {
  CacheProvider,
  AsyncBoundary,
  NetworkError,
} from '@data-client/react';

function ErrorPage({
  error,
  className,
}: {
  error: NetworkError;
  className?: string;
}) {
  return (
    <div className={className}>
      {error.status} {error.response && error.response.statusText}
    </div>
  );
}

export default function App() {
  return (
    <CacheProvider>
      <AsyncBoundary fallback="loading" errorComponent={ErrorPage}>
        <Router />
      </AsyncBoundary>
    </CacheProvider>
  );
}
```

Note: Once `<AsyncBoundary />` catches an error it will only render the fallback
until it is remounted. To get around this you'll likely want to place the boundary at
locations that will cause remounts when the error should be cleared. This is usually
below the route itself.

## errorClassName

`className` to forward to [errorComponent](#errorcomponent)
