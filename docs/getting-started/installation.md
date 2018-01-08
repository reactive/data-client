# Installation

## 1) Add provider at top-level component

`index.tsx`

```tsx
import { RestProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.body).render(
  <RestProvider>
    <App />
  </RestProvider>,
);
```

## 2) Add [Suspense](https://reactjs.org/blog/2018/11/13/react-conf-recap.html)

Suspense will show a fallback while content is loading.

Put the `<Suspense/>` component around the pointer where you want the fallback to be shown.
Any usage of the hooks will need to be below this point in the tree.

Feel free to hook up multiple `<Suspense/>` points if you want to show loaders at different
points in your application.

`App.tsx`

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

const App = () => (
  <div>
    <h1>Main Title</h1>
    <Nav />
    <ErrorBoundary>
      <NetworkErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Routes />
        </Suspense>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  </div>
);
```

### [Usage➡️](./usage.md)
### 📖[Documentation](..)
