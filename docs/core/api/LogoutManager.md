---
title: LogoutManager - Handling 401s and other deauthorization triggers
sidebar_label: LogoutManager
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import StackBlitz from '@site/src/components/StackBlitz';

# LogoutManager

Logs out based on fetch responses. By default this is triggered by [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) status responses.

:::info implements

`LogoutManager` implements [Manager](./Manager.md)

:::

## Usage

<Tabs
defaultValue="web"
groupId="platform"
values={[
{ label: 'Web', value: 'web' },
{ label: 'React Native', value: 'native' },
{ label: 'NextJS', value: 'nextjs' },
{ label: 'Expo', value: 'expo' },
]}>

<TabItem value="web">

```tsx title="/index.tsx"
import {
  DataProvider,
  LogoutManager,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import {
  DataProvider,
  LogoutManager,
  getDefaultManagers,
} from '@data-client/react';
import { AppRegistry } from 'react-native';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

const Root = () => (
  <DataProvider managers={managers}>
    <App />
  </DataProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

```tsx title="app/Provider.tsx"
'use client';
import { LogoutManager, getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

```tsx title="app/_layout.tsx"
import Provider from './Provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
```

</TabItem>
<TabItem value="expo">

```tsx title="app/Provider.tsx"
import {
  LogoutManager,
  getDefaultManagers,
  DataProvider,
} from '@data-client/react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';

// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      // highlight-next-line
      <DataProvider managers={managers}>{children}</DataProvider>
    </ThemeProvider>
  );
}
```

```tsx title="app/_layout.tsx"
import { Stack } from 'expo-router';
import 'react-native-reanimated';

// highlight-next-line
import Provider from './Provider';

export default function RootLayout() {
  return (
    // highlight-start
    <Provider>
      // highlight-end
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      // highlight-start
    </Provider>
    // highlight-end
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

## Github Example

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />
