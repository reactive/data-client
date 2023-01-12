---
id: installation
title: Installation
---

<head>
  <title>Getting Started with Rest Hooks</title>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import PkgInstall from '@site/src/components/PkgInstall';

<PkgTabs pkgs="@rest-hooks/react @rest-hooks/test @rest-hooks/hooks @rest-hooks/rest" />

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) for full type enforcement.

## Add provider at top-level component

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
import { CacheProvider } from '@rest-hooks/react';
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
import { CacheProvider } from '@rest-hooks/react';
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
import { CacheProvider } from '@rest-hooks/react';
import { AppRegistry } from 'react-native';

const Root = () => (
  <CacheProvider>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

<PkgInstall pkgs="@rest-hooks/ssr @rest-hooks/redux redux" />

```tsx title="pages/_document.tsx"
import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';

export default RestHooksDocument;
```

```tsx  title="pages/_app.tsx"
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

[Full NextJS Guide](../guides/ssr.md#nextjs)

</TabItem>
</Tabs>

Alternatively [integrate state with redux](../guides/redux.md)

<details><summary><b>Older browser support</b></summary>

If your application targets older browsers (a few years or more), be sure to load polyfills.
Typically this is done with [@babel/preset-env useBuiltIns: 'entry'](https://babeljs.io/docs/en/babel-preset-env#usebuiltins),
coupled with importing [core-js](https://www.npmjs.com/package/core-js) at the entrypoint of your application.

This ensures only the needed polyfills for your browser support targets are included in your application bundle.

For instance `TypeError: Object.hasOwn is not a function`

</details>
<details><summary><b>Internet Explorer support</b></summary>

If you see `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
follow the instructions to [add legacy browser support to packages](../guides/legacy-browser)

</details>
