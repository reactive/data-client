---
id: installation
title: Installation
original_id: installation
slug: /
---

Rest Hooks is a library for fetching structured data in a performant way with no boilerplate.

Its interface is declarative and minimal. A small structure declaration is all that is needed
for Rest Hooks to perform numerous fetching and caching optimizations while providing predictable,
precisely-typed data to consume.

Structured data means data composed of [Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)
([maps](https://en.wikipedia.org/wiki/Associative_array))
and [Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
([lists](https://en.wikipedia.org/wiki/List_(abstract_data_type))), as opposed media
like images and videos. This makes it great for API calls regardless of form ([REST-like](https://restfulapi.net/),
[GraphQL](https://graphql.org/), [gRPC](https://grpc.io/)), serialization ([JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON), [YAML](https://en.wikipedia.org/wiki/YAML)),
or transport ([HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview), [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), [local](../guides/mocking-unfinished.md)).

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

## Legacy browser (IE) support

Rest Hooks includes multiple bundles including a commonjs bundle that is compiled with maximum compatibility as well as an ES6 module bundle that is compiled to target modern browsers or react native.
Tools like webpack or rollup will use the ES6 modules to enable optimizations like tree-shaking. However,
the Javascript included will not support legacy browsers like Internet Explorer. If your browser target
includes such browsers (you'll likely see something like `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`) you will need to follow the steps below.

### Transpile Rest Hooks package

> Note: Many out-of-the-box solutions like create react app will already perform this step and no
> additional work is needed.

Add preset to run only legacy transformations.

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add --dev babel-preset-react-app
```
<!--npm-->
```bash
npm install babel-preset-react-app
```
<!--END_DOCUSAURUS_CODE_TABS-->

Add this section to your `webpack.config.js` under the 'rules' section.

This will only run legacy transpilation, and skip all other steps as they are unneeded.

```js
rules: [
  // put other js rules here
  {
    test: /\.(js|mjs)$/,
    use: ['babel-loader'],
    include: [/node_modules/],
    exclude: /@babel(?:\/|\\{1,2})runtime/,
    options: {
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [
        [
          require.resolve('babel-preset-react-app/dependencies'),
          { helpers: true },
        ],
      ],
      cacheDirectory: true,
    },
  },
]
```

### Polyfills

Use [CRA polyfill](https://github.com/facebook/create-react-app/tree/master/packages/react-app-polyfill)
or follow instructions below.

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add core-js whatwg-fetch
```
<!--npm-->
```bash
npm install core-js whatwg-fetch
```
<!--END_DOCUSAURUS_CODE_TABS-->

#### `index.tsx`

```tsx
import 'core-js/stable';
import 'whatwg-fetch';
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

[More about loading state](../guides/loading-state.md)
