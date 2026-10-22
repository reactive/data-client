---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';

## 安装 skill 以获得最佳效果 {#install-skills-for-best-results}

仅凭包名，智能体就能把基础部分做对。[Skills](https://agentskills.io) 则会教给它们其余部分的最新 API，
例如测试 fixture 和实时 manager。安装 skill
[/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup)：

<SkillTabs skill="data-client-setup" framed />

然后在你的智能体聊天中运行它：

```prompt framed
/data-client-setup
```

它会检测你的框架和 API 风格（REST、GraphQL、自定义），安装下面相应的 skill，接好 provider，
并迁移现有的 endpoint。

### 预先安装所有 skill {#install-all-skills-up-front}

如果你想现在就安装适用于你的框架的所有 skill，而不让智能体执行安装：

<SkillTabs />

在 Claude Code 中，插件会一步完成安装。对于其他智能体，
[TanStack Intent](https://tanstack.com/intent) 会加载每个 `@data-client/*` 包为其版本附带的 skill，
因此它们会随 `npm update` 一起更新。它的安装会在你的 `AGENTS.md` 中添加一个 skill 加载部分。

### 可用的 skill {#available-skills}

- [**`/data-client`**](https://skills.sh/reactive/data-client/data-client) — 当你让智能体添加或使用 Data Client 时从这里开始，并将其引导到设置或该任务对应的 skill。
- [**`/data-client-setup`**](https://skills.sh/reactive/data-client/data-client-setup) — 根据你的框架和 API 风格安装并配置 Data Client，以及它所需的 skill。
- [**`/data-client-rest-setup`**](https://skills.sh/reactive/data-client/data-client-rest-setup) — 设置 `@data-client/rest` 并迁移现有的
  `fetch`/`axios` 客户端。
- [**`/data-client-endpoint-setup`**](https://skills.sh/reactive/data-client/data-client-endpoint-setup) — 用 `Endpoint` 包装自定义异步函数，
  适用于非 REST、非 GraphQL 的工作流。
- [**`/data-client-graphql-setup`**](https://skills.sh/reactive/data-client/data-client-graphql-setup) — 为 GraphQL API 配置
  `@data-client/graphql` 和 `GQLEndpoint`。
- [**`/data-client-schema`**](https://skills.sh/reactive/data-client/data-client-schema) — 设计 `Entity`、`Collection`、`Union`、`Query`
  及相关 schema。
- [**`/data-client-rest`**](https://skills.sh/reactive/data-client/data-client-rest) — 用 `resource()`、`RestEndpoint`、
  CRUD 方法和响应解析来定义 REST API。
- [**`/data-client-manager`**](https://skills.sh/reactive/data-client/data-client-manager) — 实现自定义 `Manager`，用于 websocket、SSE、
  轮询、订阅、日志和中间件。

:::react

- [**`/data-client-react`**](https://skills.sh/reactive/data-client/data-client-react) — 使用 `useSuspense`、`useFetch`、`useQuery`、`useLive`
  及变更相关 hook，并借助 Chrome DevTools MCP [调试运行中的应用](./debugging.md#debugging-with-agents)。
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — 使用 `renderDataHook`、
  fixture、interceptor 和 `nock` 编写 React 测试。

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — 结合 `DataClientPlugin` 使用 `useSuspense`、`useFetch`、`useQuery`、`useLive`
  及变更相关组合式函数，并借助 Chrome DevTools MCP [调试运行中的应用](./debugging.md#debugging-with-agents)。
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — 使用 `renderDataCompose`、
  `mountDataClient`、fixture 和 `nock` 编写 Vue 测试。

:::

在 [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client) 浏览完整目录。

## 手动设置 {#set-up-by-hand}

若要自行安装包并添加 provider，请按照[安装](./installation.md)操作。

## 面向 LLM 的文档 {#docs-for-llms}

没有安装 skill 的智能体可以按照 [llms.txt](https://llmstxt.org) 约定，以纯 markdown 形式阅读这些文档：

- :react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] — 所有页面的索引，附有每个页面 markdown 的链接
- :react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] — 将所有 :react[React]:vue[Vue]、REST 和 GraphQL 文档合并为一个文件

任何文档页面都可以在其 URL 后加上 `.md` 获取 markdown 版本，例如 :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)]。
