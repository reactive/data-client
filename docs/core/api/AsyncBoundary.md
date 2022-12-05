---
title: '<AsyncBoundary />'
---

<head>
  <title>&lt;AsyncBoundary /&gt; - Handle asynchronous loading and error conditions</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

Handles loading and error conditions of Suspense.

```tsx
function AsyncBoundary({
  children,
  errorComponent,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorComponent?: React.ComponentType<{
    error: NetworkError;
  }>;
}): JSX.Element;
```

:::tip

Learn more about boundary placement by learning how to [co-locate data dependencies](../getting-started/data-dependency.md)

:::

## Example

```tsx
import React from 'react';
import { AsyncBoundary } from '@rest-hooks/react';

export default function MyPage() {
  return (
    <AsyncBoundary>
      <SuspendingComponent />
    </AsyncBoundary>
  );
}

function SuspendingComponent() {
  const data = useSuspense(MyEndpoint);

  return <div>{data.text}</div>
}
```

## Custom fallback example {#custom-fallback}

```tsx
import React from 'react';
import { CacheProvider, AsyncBoundary, NetworkError } from '@rest-hooks/react';

function ErrorPage({ error }: { error: NetworkError }) {
  return (
    <div>
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
