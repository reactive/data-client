---
title: 面向编码智能体的 Data Client
description: Agent Skills、Claude Code 插件、Chrome DevTools MCP 调试和 llms.txt 帮助编码智能体编写、调试和升级 Data Client 应用
image: /img/social/coding-agents-card.png
authors: [ntucker]
tags: [agents, vue]
draft: true
---

import SkillTabs from '@site/src/components/SkillTabs';

如今编码智能体写了大量 Data Client 代码，而当它们手上有最新的文档和工作流，而不是凭旧版本猜测时，
写出的代码会更好。本次发布周期让任何智能体都能更容易地完成这项配置。

**新增：**

- [Claude Code 插件](/blog/2026/10/06/coding-agents#claude-plugin) - `claude plugin install react@data-client` 安装适用于你所用框架的 skill
- [Vue skill](/blog/2026/10/06/coding-agents#vue-skills) - Vue 项目得到的是 Vue 组合式函数和测试，而不是 React hook
- [llms.txt](/blog/2026/10/06/coding-agents#llms-txt) - 任何智能体都可以把文档作为 markdown 读取，而且每个页面都会告诉它该去哪里找

**同样可用：**

- [Agent Skills](/blog/2026/10/06/coding-agents#skills) - 定义 REST API、设计 schema、编写 Manager 以及测试；[/data-client-setup](/blog/2026/10/06/coding-agents#setup) 现在只安装你需要的那些，并且它们[由这些文档生成](/blog/2026/10/06/coding-agents#generated-references)
- [Chrome DevTools MCP](/blog/2026/10/06/coding-agents#debugging) - 智能体可以检查正在运行的应用的 store，React Native 则使用 Expo MCP
- [升级 skill](/blog/2026/10/06/coding-agents#upgrades) - 迁移 skill 会升级你的代码，包括 codemod 做不到的部分

{/* truncate */}

## 快速上手 {#setup}

安装 [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup) skill 并运行它。它会
检测 React 或 Vue 以及你的 API 风格（REST、GraphQL 或自定义），安装你的项目所需的 skill，并配置好
Data Client。对于 REST，它会交给
[data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup)，由后者把现有的 `fetch` 或
axios 调用迁移到 endpoint（[#4153](https://github.com/reactive/data-client/pull/4153)）。

<SkillTabs skill="data-client-setup" />

[Agent Skills](/docs/getting-started/agent-skills) 列出了每个 skill，以及如何预先一次安装全部 skill。

## Claude Code 插件 {#claude-plugin}

Data Client 仓库是一个 Claude Code 插件市场。`core` 插件包含 setup、REST、GraphQL、schema 和
Manager skill；`react` 和 `vue` 插件添加各自框架的 skill 并引入 `core`；`migrations`
插件添加升级 skill（[#4153](https://github.com/reactive/data-client/pull/4153)）。
[Agent Skills](/docs/getting-started/agent-skills) 页面展示了用 skills CLI 和 OpenSkills 完成同样安装的方法。

```bash
claude plugin marketplace add reactive/data-client
claude plugin install react@data-client
```

Vue 请使用 `vue@data-client`，两者都不用则使用 `core@data-client`，并在升级前添加 `migrations@data-client`。

## Vue skill {#vue-skills}

Vue 项目之前得到的是 React hook 的 skill，因此智能体会套用 React 的模式。
[data-client-vue](https://skills.sh/reactive/data-client/data-client-vue) skill 编写 `DataClientPlugin` 和组合式函数
代码，并能[调试正在运行的应用](/vue/getting-started/debugging#debugging-with-agents)
（[#4126](https://github.com/reactive/data-client/pull/4126)）。
[data-client-vue-testing](https://skills.sh/reactive/data-client/data-client-vue-testing) 编写 `renderDataCompose()`
和 `mountDataClient()` 测试（[#4126](https://github.com/reactive/data-client/pull/4126)），这些测试遵循
[Vue 测试指南](/vue/guides/unit-testing-composables)（[#4181](https://github.com/reactive/data-client/pull/4181)）。

## llms.txt {#llms-txt}

没有 skill 的智能体可以按照 [llms.txt](https://llmstxt.org) 约定把文档作为 markdown 读取
（[#4171](https://github.com/reactive/data-client/pull/4171)、[#4236](https://github.com/reactive/data-client/pull/4236)）：

- React 的 [llms.txt](https://dataclient.io/llms.txt) 和 Vue 的 [vue/llms.txt](https://dataclient.io/vue/llms.txt) 索引了每个页面，旁边的 `llms-full.txt` 则把它们全部收在一个文件里
- [rest/llms.txt](https://dataclient.io/rest/llms.txt) 和 [graphql/llms.txt](https://dataclient.io/graphql/llms.txt) 只覆盖对应包的 API
- 任何文档页面在 URL 后加上 `.md` 就是 markdown，比如 [/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)

每个页面都在 `<head>` 中链接了它的 llms.txt，每个文档页面都链接了它的 markdown，因此拿到任意页面 URL 的智能体
都能自行找到它们。

## skill 与文档保持一致 {#generated-references}

skill 的参考页面现在按框架从这些文档生成，因此它们带有安装命令等共享片段，
并且只给 Vue 项目提供 Vue 代码。当 skill 与文档出现偏差时，CI 检查会失败，因此 skill 会
随每次发布保持最新（[#4170](https://github.com/reactive/data-client/pull/4170)）。

## 同样可用 {#also-available}

### 针对每项任务的 skill {#skills}

除了 setup 之外，Data Client 应用的每个部分都有对应的 skill。`/data-client-setup` 会安装你的项目
用到的那些：

- [data-client-rest-setup](https://skills.sh/reactive/data-client/data-client-rest-setup) 把 `fetch`、axios、ky、got 或 superagent 客户端迁移到 [RestEndpoint](/rest/api/RestEndpoint)，配合 [axios 迁移指南](/rest/guides/axios-migration)及其 codemod（[#3867](https://github.com/reactive/data-client/pull/3867)）
- [data-client-graphql-setup](https://skills.sh/reactive/data-client/data-client-graphql-setup) 和 [data-client-endpoint-setup](https://skills.sh/reactive/data-client/data-client-endpoint-setup) 覆盖 GraphQL 和自定义异步函数
- [data-client-rest](https://skills.sh/reactive/data-client/data-client-rest) 用 [resource()](/rest/api/resource) 和 [RestEndpoint](/rest/api/RestEndpoint) 定义 API
- [data-client-schema](https://skills.sh/reactive/data-client/data-client-schema) 设计 [Entity](/rest/api/Entity)、[Collection](/rest/api/Collection)、[Union](/rest/api/Union) 和 [Query](/rest/api/Query) schema
- [data-client-manager](https://skills.sh/reactive/data-client/data-client-manager) 为 websocket、SSE、轮询和日志编写 [Manager](/docs/concepts/managers)
- [data-client-react](https://skills.sh/reactive/data-client/data-client-react) 和 [data-client-react-testing](https://skills.sh/reactive/data-client/data-client-react-testing) 使用并测试 React hook

在 [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client) 浏览全部 skill。

### 调试正在运行的应用 {#debugging}

问你的智能体"为什么这里没有重新获取？"或"缓存里现在有什么？"，它可以直接检查正在运行的应用，
而不是从代码里猜。在开发模式下，[DevToolsManager](/docs/api/DevToolsManager#controllers) 把每个 store 的
[Controller](/docs/api/Controller) 放在 `globalThis.__DC_CONTROLLERS__` 上，因此通过
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)，或在 React Native 中通过
[Expo MCP](https://docs.expo.dev/eas/ai/mcp/) 连接的智能体，可以读取 store、跟踪派发的 action，并
把它们与网络请求对应起来。这个映射在浏览器、React Native 和 Node 中都存在
（[#3753](https://github.com/reactive/data-client/pull/3753)）。

```js title="Browser DevTools console"
__DC_CONTROLLERS__.get('Data Client: My App').getState();
```

React 和 Vue 的 skill 通过 Chrome DevTools MCP 驱动这一流程；它们能检查哪些内容请参阅
[使用智能体调试](/docs/getting-started/debugging#debugging-with-agents)。

### 升级 skill {#upgrades}

skill 也负责升级。v0.18 skill 会运行 [codemod](/codemods/v0.18.js)，然后处理 codemod 做不到的部分，比如
为输出依赖 endpoint 参数的 schema 注册 [`argsKey`](/rest/api/SchemaSimple)
（[v0.18 迁移](/blog/2026/05/01/v0.18-scalar-typed-downloads#migration-guide)）。path-to-regexp v8 skill 会重写
你 endpoint 中的[路径语法](/blog/2026/04/01/v0.16-parallel-fetching-collection-move-lazy#path-to-regexp-v8)。

<SkillTabs skills={['data-client-v0.18-migration', 'path-to-regexp-v8-migration']} />
