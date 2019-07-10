---
id: installation
title: Installation
---

Rest Hooks is a library for fetching structured data in performant way with no boilerplate.

Its interface is declarative and minimal. A small structure declaration is all that is needed
for Rest Hooks to perform numerous fetching and caching optimizations while providing predictable,
precisely typed data to consume.

Structured data means data composed of Objects (maps) and Arrays (lists), as opposed media
like images and videos. This makes it great for API calls regardless of form (REST-like, GraphQL, gRPC)
or transport (HTTP, websockets, local).

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
