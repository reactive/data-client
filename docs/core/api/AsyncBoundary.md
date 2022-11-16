---
title: "<AsyncBoundary />"
---

<head>
  <title>&lt;AsyncBoundary /&gt; - Handle asynchronous loading and error conditions</title>
  <meta name="docsearch:pagerank" content="20"/>
</head>

Handles loading and error conditions of Suspense.

```tsx
function AsyncBoundary({ children, errorComponent, fallback, }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorComponent?: React.ComponentType<{
        error: NetworkError;
    }>;
}): JSX.Element;
```

Custom fallback usage example:

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

export default function App(): React.ReactElement {
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
