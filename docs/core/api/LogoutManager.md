---
title: LogoutManager - Handling 401s and other deauthorization triggers
sidebar_label: LogoutManager
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# LogoutManager

Logs out based on fetch responses. By default this is triggered by [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) status responses.

:::info implements

`LogoutManager` implements [Manager](./Manager.md)

:::

## Usage

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];
```

</ProviderManagers>

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import {
  DataClientPlugin,
  LogoutManager,
  getDefaultManagers,
} from '@data-client/vue';
import App from './App.vue';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');
```

:::

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

const myDomain = 'http://test.com';
// highlight-next-line
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      // highlight-next-line
      controller.invalidateAll({ testKey });
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

:::react

## Github Example

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />

:::
