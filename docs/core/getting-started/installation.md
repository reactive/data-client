---
id: installation
title: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';

<PkgTabs pkgs="rest-hooks @rest-hooks/test @rest-hooks/hooks @rest-hooks/rest" />

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) for full type enforcement.

## Add provider at top-level component


<Tabs
defaultValue="web"
groupId="platform"
values={[
{ label: 'React Web 16+', value: 'web' },
{ label: 'React Web 18+', value: '18-web' },
{ label: 'React Native', value: 'native' },
]}>
<TabItem value="web">

```tsx title="/index.tsx"
import { CacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <CacheProvider>
    <App />
  </CacheProvider>,
  document.body,
);
```

</TabItem>

  <TabItem value="18-web">

```tsx title="/index.tsx"
import { CacheProvider } from 'rest-hooks';
import ReactDOM from 'react-dom';

ReactDOM.createRoot(document.body).render(
  <CacheProvider>
    <App />
  </CacheProvider>,
);
```

</TabItem>

  <TabItem value="native">

```tsx title="/index.tsx"
import { CacheProvider } from 'rest-hooks';
import { AppRegistry } from 'react-native';

const Root = () => (
  <CacheProvider>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>
</Tabs>

Alternatively [integrate state with redux](../guides/redux.md)

<details><summary><b>Legacy (IE) browser support</b></summary>

If you see `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
follow the instructions to [add legacy browser support to packages](../guides/legacy-browser)

</details>
