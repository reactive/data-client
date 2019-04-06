# Handling loading state

Network resources taken an unknown amount of time so it's important to be able
to handle rendering while they load. After sometime you might want to display
a loading indicator, but at the very least you'll need to be able to deal with
not having the resource available yet!

Normally you might do a check to see if the resource is loaded yet and manually
specify each fallback condition in every component. However, since `rest-hooks`
uses React's `Suspsense` API, it is much simpler to do here.

Simply place the `<Suspense />` component where you want to show a loading
indicator. Often this will be just above your routes; but feel free to place
it in multiple locations!

`App.tsx`

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import { RouteChildrenProps } from 'react-router';

const App = () => (
  <div>
    <h1>Main Title</h1>
    <Nav />
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary key={location && location.key}>
        <Routes />
      </ErrorBoundary>
    </Suspense>
  </div>
);
```
