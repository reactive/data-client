---
id: installation
title: Reactive Data Client 快速上手
sidebar_label: 安装
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import PkgTabs from '@site/src/components/PkgTabs';
import Installation from '../shared/\_installation.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import Link from '@docusaurus/Link';
import SiteOnly from '@site/src/components/SiteOnly';

:::react

<PkgTabs pkgs="@data-client/react @data-client/test @data-client/rest" />

:::

<SiteOnly>

:::tip[使用 Agent Skills]

更想让 AI 智能体帮你搭建？请查看 [Agent Skills](./agent-skills.md) 并运行 `/data-client-setup`。

:::

</SiteOnly>

## :react[在顶层组件中添加 provider]:vue[安装插件] {#add-provider-at-top-level-component}

:::vue

在创建应用时安装 [Vue 插件](https://vuejs.org/guide/reusability/plugins.html)。

:::

<Installation />

<center>

<Link className="button button--secondary" to="./resource">下一步：定义数据 »</Link>

</center>

## 示例 {#example}

:::react

<StackBlitz app="todo-app" file="src/index.tsx,src/RootProvider.tsx" view="both" ctl="1" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/main.ts,src/pages/UserTodos.vue" view="both" ctl="1" />

:::

## 支持的工具 {#supported-tools}

<details>
<summary><b>TypeScript 4.0+</b></summary>

TypeScript 是可选的，但要获得完整的类型约束，至少需要 [4.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types) 版本并开启 [strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)。

:::vue

`@data-client/vue` 需要 TypeScript 4.5 或更高版本，因为 Vue 自身的类型也有此要求。

:::

</details>

<details>
<summary><b>旧版浏览器支持</b></summary>

如果你的应用面向较旧的浏览器（几年甚至更久之前的），请务必加载 polyfill。
通常的做法是使用 [@babel/preset-env useBuiltIns: 'entry'](https://babeljs.io/docs/en/babel-preset-env#usebuiltins)，
并在应用入口处导入 [core-js](https://www.npmjs.com/package/core-js)。

这样可以确保应用的打包产物中只包含目标浏览器所需的 polyfill。

例如 `TypeError: Object.hasOwn is not a function`

</details>
<details>
<summary><b>Internet Explorer 支持</b></summary>

如果你看到 `Uncaught TypeError: Class constructor Resource cannot be invoked without 'new'`，
请按照说明[为包添加旧版浏览器支持](../guides/legacy-browser)

</details>

:::react

<details>
<summary><b>ReactJS 16-19 与 React Native</b></summary>

支持 ReactJS 16.2 及以上版本（也就是带 hook 的版本！）。React 18 提供了更完善的 [Suspense](../api/useSuspense.md)
支持和特性。React Native、[React Navigation](https://reactnavigation.org/) 和 [Expo](https://docs.expo.dev) 均受支持。

如果你有一个结合其他 React 库
正常运行的项目，[欢迎在我们的讨论区](https://github.com/reactive/data-client/discussions/2422)与大家
分享。

</details>

:::

:::vue

<details>
<summary><b>Vue 3</b></summary>

`@data-client/vue` 支持 Vue 3，并基于[组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html) 构建。

</details>

:::
