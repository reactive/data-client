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


## Include polyfill (optional IE support)

Rest-hooks is built to be compatible with old browsers, but assumes polyfills will
already be loaded. If you want to support old browsers like Internet Explorer, you'll
need to install core-js and import it at the entry point of your bundle.

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add core-js
```
<!--npm-->
```bash
npm install core-js
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### `index.tsx`

```tsx
import 'core-js/stable';
// place the above line at top
```


## Add provider at top-level component

#### `index.tsx`

```tsx
import { CacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <CacheProvider>
    <App />
  </CacheProvider>,
  document.body
);
```

Alternatively [integrate state with redux](../guides/redux.md)

## Add Suspense and ErrorBoundary

[Suspense](https://reactjs.org/blog/2018/11/13/react-conf-recap.html) will show a fallback while content is loading.

Put the `<Suspense/>` component around the point where you want the fallback to be shown.
Any usage of the hooks will need to be below this point in the tree.

Feel free to hook up multiple `<Suspense/>` points if you want to show loaders at different
points in your application.

[`<NetworkErrorBoundary/>`](../api/NetworkErrorBoundary.md) will handle fallbacks upon any network errors.

#### `App.tsx`

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

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

[More about loading state](../guides/loading-state)
