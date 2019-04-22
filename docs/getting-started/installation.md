---
id: installation
title: Installation
---

## Install rest-hooks

Install the rest-hooks package into your project using [yarn](https://yarnpkg.com/en/)

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add rest-hooks
```
<!--npm-->
```bash
npm install rest-hooks
```
<!--END_DOCUSAURUS_CODE_TABS-->


## Add provider at top-level component

#### `index.tsx`

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

Alternatively [integrate state with redux](../guides/redux.md)

## Add Suspense and ErrorBoundary

[Suspense](https://reactjs.org/blog/2018/11/13/react-conf-recap.html) will show a fallback while content is loading.

Put the `<Suspense/>` component around the pointer where you want the fallback to be shown.
Any usage of the hooks will need to be below this point in the tree.

Feel free to hook up multiple `<Suspense/>` points if you want to show loaders at different
points in your application.

`<NetworkErrorBoundary/>` will handle fallbacks upon any network errors.

#### `App.tsx`

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
