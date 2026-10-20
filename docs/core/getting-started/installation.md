---
id: installation
title: Getting Started with Reactive Data Client
sidebar_label: Installation
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import Installation from '../shared/\_installation.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';
import SiteOnly from '@site/src/components/SiteOnly';
import SetupTabs from '@site/src/components/SetupTabs';
import AgentOnly from '@site/src/components/AgentOnly';

<SiteOnly>

## Set up with your coding agent {#agent-setup}

<SetupTabs />

Either way, your agent runs Data Client's setup [skill](./agent-skills.md), which installs the packages, wires up the
provider and links the skills the packages ship, so your agent knows the current APIs, like real-time managers and test
fixtures. That's the whole setup, so you can go straight to [Define Data](./resource).

</SiteOnly>

<AgentOnly>

To set up Data Client, install its setup skill from the project root:

```bash
npx skills add reactive/data-client --skill data-client-setup -y
```

Then read `.agents/skills/data-client-setup/SKILL.md` and follow it. It installs the packages, wires up the provider
and links the skills the packages ship. The steps below are the same setup by hand.

</AgentOnly>

## Set up by hand {#manual-setup}

<SiteOnly>

These steps are the same setup without an agent. If your agent ran the setup, skip them: it already did every one.

</SiteOnly>

:::react

### Install packages {#install-manually}

<PkgTabs pkgs="@data-client/react @data-client/test @data-client/rest" />

:::

### :react[Add provider at top-level component]:vue[Install the plugin] {#add-provider-at-top-level-component}

:::vue

Install the [Vue plugin](https://vuejs.org/guide/reusability/plugins.html) when creating your app.

:::

<Installation />

<SiteOnly>

### Link your agent's skills {#agent-skills}

The packages ship skills for your coding agent, matched to the version you installed. Link them so Claude Code,
Cursor and Codex load them, and commit the links:

```bash
npx --no data-client-skills
```

Run it again after adding, removing or upgrading `@data-client` packages. See [Agent Skills](./agent-skills.md) for
details.

</SiteOnly>

<AgentOnly>

Then link the skills the installed packages ship, matched to their versions, from the project root, and commit the
links:

```bash
npx --no data-client-skills
```

Run it again after adding, removing or upgrading `@data-client` packages.

</AgentOnly>

<center>

<Link className="button button--secondary" to="./resource">Next: Define Data »</Link>

</center>

## Example

:::react

<StackBlitz app="todo-app" file="src/index.tsx,src/RootProvider.tsx" view="both" ctl="1" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/main.ts,src/pages/UserTodos.vue" view="both" ctl="1" />

:::

## Supported Tools

<details>
<summary><b>TypeScript 4.0+</b></summary>

TypeScript is optional, but requires at least version [4.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types) and [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks) for full type enforcement.

:::vue

`@data-client/vue` needs TypeScript 4.5 or later, since Vue's own types do.

:::

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

:::react

<details>
<summary><b>ReactJS 16-19 and React Native</b></summary>

ReactJS 16.2 and above is supported (the one with hooks!). React 18 provides improved [Suspense](../api/useSuspense.md)
support and features. Both React Native, [React Navigation](https://reactnavigation.org/) and [Expo](https://docs.expo.dev) are supported.

If you have a working project using other
React libraries, [feel free to share with others](https://github.com/reactive/data-client/discussions/2422) in our
discussions.

</details>

:::

:::vue

<details>
<summary><b>Vue 3</b></summary>

`@data-client/vue` supports Vue 3 and is built on the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html).

</details>

:::
