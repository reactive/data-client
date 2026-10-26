---
title: 调试与检查
sidebar_label: 调试
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import DevtoolsDebugging from '../_agents/devtools-debugging.md';

<SiteOnly>

## 使用 agent 调试 {#debugging-with-agents}

[`globalThis.__DC__`](../api/DevToolsManager.md#controllers) 让 agent 能够在开发环境中检查你应用的 Data Client
store：它的状态、最近的 action 和错误，这样你的编程 agent 就能调试你所看到的问题。向它提问：

```prompt
The todo list still shows the old title after I save. Find out why.
```

设置好 Data Client 的 [skill](./agent-skills.md) 后，它会在 store 中找到原因，而不是根据代码猜测。它
需要一个能在页面中运行 JavaScript 的浏览器工具：Cursor 的浏览器、
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)、
[Playwright MCP](https://github.com/microsoft/playwright-mcp) 或 Claude in Chrome。

如果调试无法在你的 agent 或浏览器工具上运行，请[提交 issue](https://github.com/reactive/data-client/issues/new?template=bug_report.md&title=Agent%20debugging%3A%20)
并写明两者，以便我们提供支持。或者让你的 agent 来写：

```prompt
Debugging this app through globalThis.__DC__ didn't work with you and your browser tool. Search reactive/data-client issues for one about this pair; if there's none, draft a bug report from its .github/ISSUE_TEMPLATE/bug_report.md titled "Agent debugging: <agent> + <browser tool>" with both names and versions, the app's @data-client versions, whether globalThis.__DC__ was defined, what you ran and the exact error, and no app data or secrets. Show me the draft before filing it with gh issue create.
```

</SiteOnly>

<AgentOnly>

<DevtoolsDebugging />

## 手动调试 {#manual-debugging}

如果用户想自己检查 store，请引导他们参阅 Redux DevTools 扩展的步骤：
:react[https://dataclient.io/docs/getting-started/debugging#manual-debugging]:vue[https://dataclient.io/vue/getting-started/debugging#manual-debugging]。

</AgentOnly>

<SiteOnly>

## 手动调试 {#manual-debugging-1}

如果你更愿意亲自检查一切，下面的浏览器 devtools 流程仍然是
标准的手动方式。

### 安装 {#installation}

添加浏览器扩展：
[chrome 扩展](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
或
[firefox 扩展](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### 打开 dev tools {#open-dev-tools}

:::react

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![redux-devtools 浏览器按钮](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![reactive data client 按钮](/img/client-logo.svg)
</span>
</span>

:::

:::vue

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![redux-devtools 浏览器按钮](/img/devtools-browser-button.png)
</span>

:::

安装完成并以 :react[[开发模式](https://webpack.js.org/guides/development/)]:vue[[开发模式](https://vite.dev/guide/env-and-mode)] 加载你的网站后，:react[你可以点击
<abbr title="Reactive Data Client">Data Client</abbr> 的 logo（默认位于窗口右下角），也可以点击
地址栏中的 redux-devtool logo。]:vue[点击地址栏中的 redux-devtool logo。]

点击后会打开检查器，你可以在其中观察已 dispatch 的 action、
它们对 store 状态的影响，以及 store 当前的状态。

:::react

<abbr title="Reactive Data Client">Data Client</abbr> 的 logo 只会在开发模式下出现。不过，你可以通过设置
[DataProvider 的 devButton prop](../api/DataProvider.md#devbutton) 来移动它的位置或完全禁用它。

:::

![browser-devtools](/img/devtool-action.png 'Reactive Data Client devtools')

[Controller](../api/Controller.md) 负责 dispatch action，因此可以借助该页面来理解
你看到的各个 action。这里我们可以看到常见的 [fetch](../api/Controller.md#fetch)
和 [setResponse](../api/Controller.md#setResponse) action。

:::note

默认情况下，devtool 集成会过滤重复的 [fetch](../api/Controller.md#fetch) action。
可以通过 [skipLogging](../api/DevToolsManager.md#skiplogging) 选项更改此行为。

:::

### 控制流 {#control-flow}

<abbr title="Reactive Data Client">Data Client</abbr> 采用 [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) 模式，每一次变化都可追踪且含义明确，
因此调试起来非常直接。

<div style={{textAlign:'center'}}>
<ThemedImage
  alt="FLUX"
  sources={{
    light: useBaseUrl('/img/diagrams/flux-simple.png'),
    dark: useBaseUrl('/img/diagrams/flux-simple-dark.png'),
  }}
  style={{maxHeight:"260px"}}
/>
</div>

> [进一步了解控制流](../concepts/managers.md)

### 状态检查 {#state-inspection}

使用 [schema](/rest/api/schema) 时，响应会被[规范化](../concepts/normalization.md)到 `entities`
和 `endpoints` 表中。相比简单的键值式请求缓存，这能自动带来性能优势，对于动态（不断变化的）数据
尤其有益。同时还能消除数据不一致的 bug。

![Dev tools 状态检查器](/img/devtool-state.png 'Reactive Data Client devtools state inspector')

点击 devtools 中的 **'state'**
标签页即可查看 store 的完整状态。这有助于准确定位数据所在的位置。缓存中还有
一个 'meta' 部分，记录诸如请求发生时间之类的信息（对 [TTL](../concepts/expiry-policy.md) 很有用）。

### 状态差异 {#state-diff}

如果要监控某个特定请求的响应，查看 store 如何更新可能更有用。
点击 'Diff' 标签页即可查看发生了哪些变化。

![Dev tools 差异检查器](/img/devtool-diff.png 'Reactive Data Client devtools diff')

这里我们通过[乐观更新](/rest/guides/optimistic-updates)切换了一个 todo 的 'completed' 状态。

### Action 追踪 {#action-tracing}

由于计算开销很大，追踪功能默认不启用。不过，在查找 [action](../api/Actions.md) 是从哪里 dispatch 的时候，
它会非常有用。通过 [getDefaultManagers](../api/getDefaultManagers.md) 将 trace 选项设为 `true`，
即可自定义 [DevToolsManager](../api/DevToolsManager.md)：

:::react

```tsx title="index.tsx"
import { DataProvider, getDefaultManagers } from '@data-client/react';
import { createRoot } from 'react-dom/client';
import App from './App';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```

:::

:::vue

```ts title="main.ts"
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';
import App from './App.vue';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

const app = createApp(App);
app.use(DataClientPlugin, { managers });
app.mount('#app');
```

:::

</SiteOnly>
