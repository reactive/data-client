---
id: installation
title: Getting Started with Reactive Data Client
sidebar_label: Installation
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import SkillTabs from '@site/src/components/SkillTabs';
import Installation from '../shared/\_installation.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';

<SkillTabs skill="reactive/data-client" />

Then run skill `/rdc-setup` or:

<PkgTabs pkgs="@data-client/react @data-client/test @data-client/rest" />

## Add provider at top-level component

<Installation />

<center>

<Link className="button button--secondary" to="./resource">Next: Define Data »</Link>

</center>

## Example

<StackBlitz app="todo-app" file="src/index.tsx,src/RootProvider.tsx" view="both" ctl="1" />

## Supported Tools

<details>
<summary><b>TypeScript 3.7+</b></summary>

TypeScript is optional, but requires at least version [3.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases) and [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks) for full type enforcement.

</details>

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

<details>
<summary><b>ReactJS 16-19 and React Native</b></summary>

ReactJS 16.2 and above is supported (the one with hooks!). React 18 provides improved [Suspense](../api/useSuspense.md)
support and features. Both React Native, [React Navigation](https://reactnavigation.org/) and [Expo](https://docs.expo.dev) are supported.

If you have a working project using other
React libraries, [feel free to share with others](https://github.com/reactive/data-client/discussions/2422) in our
discussions.

</details>
