# Dealing with network errors

When you use the `useResource()` hook, React will suspend rendering while the network
request takes place. But what happens if there is a network failure? It will
throw the network error. When this happens you'll want to have an
[error boundary](https://reactjs.org/docs/error-boundaries.html) set up to handle it.
Most likely you'll want to place one specficially for network errors at the same place
you put your `<Suspense>`. What you do with the error once you catch it, is of course
up to you.

This library provides `NetworkErrorBoundary` component that only catches network
errors and sends them to a fallback component you provide. Other errors will rethrow.

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import { RouteChildrenProps } from 'react-router';

const App = ({ location }: RouteChildrenProps) => (
  <Suspense fallback={<Spinner />}>
    <NetworkErrorBoundary key={location && location.key}>
      <Routes />
    </NetworkErrorBoundary>
  </Suspense>
)
```

Note how we set the key based on location; this forces a remount on every location
change so any errors will be cleared. This is only necessary as this is the route-level
boundary, but it is placed above the route selected.

Alternatively you could create your own error boundary where you might
try dispatching the errors to another provider to use in a transient
popups.

Additionally you could also use one error boundary for any error
type and handle network errors there.
