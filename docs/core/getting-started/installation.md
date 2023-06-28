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
import Installation from '../shared/\_installation.mdx';

<PkgTabs pkgs="@rest-hooks/react @rest-hooks/test @rest-hooks/hooks @rest-hooks/rest" />

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) and [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks) for full type enforcement.

## Add provider at top-level component

<Installation />

Alternatively [integrate state with redux](../guides/redux.md)

<details>
<summary><b>Older browser support</b></summary>

If your application targets older browsers (a few years or more), be sure to load polyfills.
Typically this is done with [@babel/preset-env useBuiltIns: 'entry'](https://babeljs.io/docs/en/babel-preset-env#usebuiltins),
coupled with importing [core-js](https://www.npmjs.com/package/core-js) at the entrypoint of your application.

This ensures only the needed polyfills for your browser support targets are included in your application bundle.

For instance `TypeError: Object.hasOwn is not a function`

</details>
<details>
<summary><b>Internet Explorer support</b></summary>

If you see `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`,
follow the instructions to [add legacy browser support to packages](../guides/legacy-browser)

</details>

## Example

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/todo-app?file=src%2FRootProvider.tsx&embed=1&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1&ctl=1"
  width="100%"
  height="500"
></iframe>

Explore more [Rest Hooks demos](/demos)
