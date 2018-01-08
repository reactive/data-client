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
import { NetworkErrorBoundary } from 'rest-hooks';

const App = () => (
  <NetworkErrorBoundary fallbackComponent={({ error }) => error.status}>
    <Suspense fallback={<Spinner />}>
      <Routes />
    </Suspense>
  </NetworkErrorBoundary>
)
```

Alternatively you could create your own error boundary where you might
try dispatching the errors to another provider to use in a transient
popups.

Additionally you could also use one error boundary for any error
type and handle network errors there.
