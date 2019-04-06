# Installation

## 1) Install rest-hooks

Install the rest-hooks package into your project using [yarn](https://yarnpkg.com/en/)

```bash
yarn add rest-hooks
```

## 2) Add provider at top-level component

`index.tsx`

```tsx
import { RestProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <RestProvider>
    <App />
  </RestProvider>,
  document.body
);
```

## 3) Add [Suspense](https://reactjs.org/blog/2018/11/13/react-conf-recap.html)

Suspense will show a fallback while content is loading.

Put the `<Suspense/>` component around the pointer where you want the fallback to be shown.
Any usage of the hooks will need to be below this point in the tree.

Feel free to hook up multiple `<Suspense/>` points if you want to show loaders at different
points in your application.

`App.tsx`

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import { RouteChildrenProps } from 'react-router';

const App = ({ location }: RouteChildrenProps) => (
  <div>
    <h1>Main Title</h1>
    <Nav />
    <Suspense fallback={<Spinner />}>
      <NetworkErrorBoundary key={location && location.key}>
        <Routes />
      </NetworkErrorBoundary>
    </Suspense>
  </div>
);
```

### [Usage➡️](./usage.md)

### 📖[Documentation](..)
