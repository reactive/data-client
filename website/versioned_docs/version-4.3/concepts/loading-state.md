---
title: Handling loading state
---

Network resources take an unknown amount of time so it's important to be able
to handle rendering while they load. After sometime you might want to display
a loading indicator, but at the very least you'll need to be able to deal with
not having the resource available yet!

Normally you might do a check to see if the resource is loaded yet and manually
specify each fallback condition in every component. However, since `rest-hooks`
uses React's [Suspense](https://www.youtube.com/watch?v=ByBPyMBTzM0) API, it is much simpler to do here.

## Using Suspense

Simply place the `<Suspense />` component where you want to show a loading
indicator. Often this will be just above your routes; but feel free to place
it in multiple locations!

#### `App.tsx`

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import { RouteChildrenProps } from 'react-router';

const App = () => (
  <div>
    <h1>Main Title</h1>
    <Nav />
    <Suspense fallback={<Spinner />}>
      <NetworkErrorBoundary>
        <Routes />
      </NetworkErrorBoundary>
    </Suspense>
  </div>
);
```

> #### Note:
>
> The `<Suspense/>` boundary must be placed in another component that is above the one
> where `useResource()` and other hooks are used.

## Without Suspense

Suspense is the recommended way of handling loading state as it reduces complexity
while integrating with [React.lazy()](https://reactjs.org/docs/code-splitting.html#reactlazy)
and the soon-to-be-released concurrent mode. However, if you find yourself wanting to handle
loading state manually you can adapt the [useStatefulResource()](../guides/no-suspense.md) hook.

## Loading Buttons

When performing mutations you'll often want an indicator that the request is still in flight.
Sometimes form libraries will handling the loading state themselves. However, in the case you're
making a standalone button or simply using a form library that doesn't track loading state of
submitters, you can use [useLoading()](../api/useLoading) from [@rest-hooks/hooks](https://www.npmjs.com/package/@rest-hooks/hooks).

### Usage

```tsx
import { useLoading } from '@rest-hooks/hooks';

function Button({ onClick, children, ...props }) {
  const [clickHandler, loading] = useLoading(onClick);
  return (
    <button onClick={clickHandler} {...props}>
      {loading ? 'Loading...' : children}
    </button>
  );
}
```
