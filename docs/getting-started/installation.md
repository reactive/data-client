---
id: installation
title: Installation
---

<!--DOCUSAURUS_CODE_TABS-->
<!--yarn-->
```bash
yarn add rest-hooks @rest-hooks/rest @rest-hooks/test
```
<!--npm-->
```bash
npm install rest-hooks @rest-hooks/rest @rest-hooks/test
```
<!--END_DOCUSAURUS_CODE_TABS-->

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) for full type enforcement.

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

<details><summary><b>Legacy (IE) browser support</b></summary>

If you see `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
follow the instructions to [add legacy browser support to packages](../guides/legacy-browser)

</details>
