---
id: agent-skills
title: Agent Skills
sidebar_label: Agent Skills
---

import SkillTabs from '@site/src/components/SkillTabs';
import AgentOnly from '@site/src/components/AgentOnly';

## 安装 skill 以获得最佳效果 {#install-skills-for-best-results}

仅凭包名，智能体就能把基础部分做对。[Skills](https://agentskills.io) 则会教给它们其余部分的最新 API，
例如测试 fixture 和实时 manager。

如果你的应用已经有 `@data-client` 包，请链接它们附带的 skill，与其版本相匹配：

```bash framed
npx --no data-client-skills
```

否则，安装 skill [/data-client-setup](https://skills.sh/reactive/data-client/data-client-setup)：

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

**Installed packages** 标签页会把每个已安装的 `@data-client/*` 包附带的 skill 链接到 `.agents/skills`
（`.claude/skills` 链接到它），Claude Code、Cursor 和 Codex 会从那里加载它们，并与该包的版本相匹配。请提交这些链接。它们会随升级更新，
再次运行该命令会获取你新增或升级的包中的 skill。在 Windows 上，只有开启了开发者模式并设置了
`git config core.symlinks true` 时才提交这些链接；否则不要提交它们，并在安装后重新运行该命令。Claude Code、Cursor 和 Codex 插件用于设置尚未使用 Data
Client 的应用。如果你使用 [TanStack Intent](https://tanstack.com/intent)，它会加载相同的包 skill。

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
  及变更相关 hook，并通过浏览器工具（例如 Cursor 的浏览器、Chrome DevTools MCP 或 Playwright MCP）[调试运行中的应用](./debugging.md#debugging-with-agents)。
- [**`/data-client-react-testing`**](https://skills.sh/reactive/data-client/data-client-react-testing) — 使用 `renderDataHook`、
  fixture、interceptor 和 `nock` 编写 React 测试。

:::

:::vue

- [**`/data-client-vue`**](https://skills.sh/reactive/data-client/data-client-vue) — 结合 `DataClientPlugin` 使用 `useSuspense`、`useFetch`、`useQuery`、`useLive`
  及变更相关组合式函数，并通过浏览器工具（例如 Cursor 的浏览器、Chrome DevTools MCP 或 Playwright MCP）[调试运行中的应用](./debugging.md#debugging-with-agents)。
- [**`/data-client-vue-testing`**](https://skills.sh/reactive/data-client/data-client-vue-testing) — 使用 `renderDataCompose`、
  `mountDataClient`、fixture 和 `nock` 编写 Vue 测试。

:::

在 [skills.sh/reactive/data-client](https://skills.sh/reactive/data-client) 浏览完整目录。

## 手动设置 {#set-up-by-hand}

若要自行安装包并添加 provider，请按照[安装](./installation.md)操作。

<AgentOnly>

每个文档页面都可以在其 URL 后加上 `.md` 获取 markdown 版本，例如 :react[[/docs/api/useSuspense.md](https://dataclient.io/docs/api/useSuspense.md)]:vue[[/vue/api/useSuspense.md](https://dataclient.io/vue/api/useSuspense.md)]。
:react[[llms.txt](https://dataclient.io/llms.txt)]:vue[[llms.txt](https://dataclient.io/vue/llms.txt)] 列出了所有页面，
:react[[llms-full.txt](https://dataclient.io/llms-full.txt)]:vue[[llms-full.txt](https://dataclient.io/vue/llms-full.txt)] 则将所有 :react[React]:vue[Vue]、REST 和 GraphQL 文档合并为一个文件。

</AgentOnly>
