---
title: 'LogoutManager'
sidebar_label: LogoutManager
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import StackBlitz from '@site/src/components/StackBlitz';

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
import { CacheProvider, LogoutManager, getDefaultManagers } from '@data-client/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

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
import { CacheProvider, LogoutManager, getDefaultManagers } from '@data-client/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager, getDefaultManagers } from '@data-client/react';
import { AppRegistry } from 'react-native';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

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
import { CacheProvider, LogoutManager, getDefaultManagers } from '@data-client/react';
import { AppCacheProvider } from '@data-client/ssr/nextjs';
import type { AppProps } from 'next/app';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

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
  ...getDefaultManagers(),
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
  ...getDefaultManagers(),
];
```

:::

## Members

### handleLogout(controller)

By default simply calls [controller.resetEntireStore()](./Controller.md#resetEntireStore)

This should be sufficient if login state is determined by a user entity existance in the Reactive Data Client store. However,
you can override this method via inheritance if more should be done.

### shouldLogout(error)

```ts
protected shouldLogout(error: UnknownError) {
  // 401 indicates reauthorization is needed
  return error.status === 401;
}
```

## Github Example

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />
