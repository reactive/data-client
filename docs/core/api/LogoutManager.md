---
title: 'LogoutManager'
sidebar_label: LogoutManager
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<head>
  <title>LogoutManager - Handling 401s and other deauthorization triggers</title>
</head>

Logs out based on fetch responses. By default this is triggered by [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) status responses.

:::info implements

`LogoutManager` implements [Manager](./Manager.md)

:::

## Usage

<Tabs
defaultValue="18-web"
groupId="platform"
values={[
{ label: 'React Web 16+', value: 'web' },
{ label: 'React Web 18+', value: '18-web' },
{ label: 'React Native', value: 'native' },
{ label: 'NextJS', value: 'nextjs' },
]}>
<TabItem value="web">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

ReactDOM.render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
  document.body,
);
```

</TabItem>

<TabItem value="18-web">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import { AppRegistry } from 'react-native';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

const Root = () => (
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

```tsx title="pages/_app.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider managers={managers}>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

</TabItem>
</Tabs>

### Custom logout handler

```ts
import { unAuth } from '../authentication';

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      controller.resetEntireStore();
    },
  }),
  ...CacheProvider.defaultProps.managers,
];
```

:::tip

Use [controller.invalidateAll](./Controller.md#invalidateAll) to only clear part of the cache.

```ts
import { unAuth } from '../authentication';

// highlight-next-line
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      // highlight-next-line
      controller.invalidateAll({ testKey })
    },
  }),
  ...CacheProvider.defaultProps.managers,
];
```

:::

## Members

### handleLogout(controller)

By default simply calls [controller.resetEntireStore()](./Controller.md#resetEntireStore)

This should be sufficient if login state is determined by a user entity existance in the Rest Hooks store. However,
you can override this method via inheritance if more should be done.

### shouldLogout(error)

```ts
protected shouldLogout(error: UnknownError) {
  // 401 indicates reauthorization is needed
  return error.status === 401;
}
```

## Github Example

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/data-client/rest-hooks/tree/rest-hooks-site/examples/github-app?file=src%2FRootProvider.tsx&embed=1&hidedevtools=1&view=editor&terminalHeight=0&hideNavigation=1&ctl=1"
  width="100%"
  height="500"
></iframe>

Explore more [Rest Hooks demos](/demos)
