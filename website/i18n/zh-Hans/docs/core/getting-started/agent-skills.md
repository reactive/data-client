---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import Link from '@docusaurus/Link';

最快的上手方式是让 [AI 智能体](https://agentskills.io)通过 skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup) 完成安装。

## 安装 {#install}

<SkillTabs skill="data-client-setup" />

然后运行 skill `/data-client-setup`。它会检测你的框架和 API 风格（REST、GraphQL、
自定义），安装下面相应的 skill，接好 provider，并迁移现有的 endpoint。

### 预先安装所有 skill {#install-all-skills-up-front}

如果你想现在就安装适用于你的框架的所有 skill，而不让智能体执行安装：

<SkillTabs />

## 可用的 skill {#available-skills}

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

## 面向 LLM 的文档 {#docs-for-llms}

没有安装 skill 的智能体可以按照 [llms.txt](https://llmstxt.org) 约定，以纯 markdown 形式阅读这些文档：

- :react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] — 所有页面的索引，附有每个页面 markdown 的链接
- :react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] — 将所有 :react[React]:vue[Vue]、REST 和 GraphQL 文档合并为一个文件

任何文档页面都可以在其 URL 后加上 `.md` 获取 markdown 版本，例如 :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)]。
