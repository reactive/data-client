---
id: version-5.0-installation
title: Installation
original_id: installation
---

Rest Hooks is a library for fetching structured data in a performant way with no boilerplate.

Its interface is declarative and minimal. A small structure declaration is all that is needed
for Rest Hooks to perform numerous fetching and caching optimizations while providing predictable,
precisely-typed data to consume.

Structured data means data composed of [Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
([maps](https://en.wikipedia.org/wiki/Associative_array))
and [Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
([lists](https://en.wikipedia.org/wiki/List_(abstract_data_type))), as opposed to media
like images and videos. This makes it great for API calls regardless of form ([REST-like](https://restfulapi.net/),
[GraphQL](https://graphql.org/), [gRPC](https://grpc.io/)), serialization ([JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON), [YAML](https://en.wikipedia.org/wiki/YAML)),
or transport ([HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [local](../guides/mocking-unfinished)).

## Install rest-hooks

Install the rest-hooks package into your project using [yarn](https://yarnpkg.com/en/)

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add rest-hooks @rest-hooks/rest
```
<!--npm-->
```bash
npm install rest-hooks @rest-hooks/rest
```
<!--END_DOCUSAURUS_CODE_TABS-->

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) for full type enforcement.

## Legacy (IE) browser support

If you see `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
follow the instructions to [add legacy browser support to packages](../guides/legacy-browser)

With most tooling this won't be necessary.

## Add provider at top-level component

#### `index.tsx`

<!--DOCUSAURUS_CODE_TABS-->
<!--Web-->
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
<!--Concurrent mode-->
```tsx
import { CacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.body).render(
  <CacheProvider>
    <App />
  </CacheProvider>
);
```
<!--React Native-->
```tsx
import { CacheProvider } from 'rest-hooks';
import { AppRegistry } from 'react-native';

const Root = () => (
  <CacheProvider>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root)
```
<!--END_DOCUSAURUS_CODE_TABS-->




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
import { Suspense, memo } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';

const App = memo(() => (
  <div>
    <h1>Main Title</h1>
    <Nav />
    <Suspense fallback={<Spinner />}>
      <NetworkErrorBoundary>
        <Routes />
      </NetworkErrorBoundary>
    </Suspense>
  </div>
));
```

[More about loading state](../guides/loading-state)
