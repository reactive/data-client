---
title: Debugging and Inspection
sidebar_label: Debugging
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import ResponseForKey from '../_agents/_response-for-key.mdx';
import RecentActions from '../_agents/_recent-actions.mdx';
import Errors from '../_agents/_errors.mdx';

## Debugging with agents

<SiteOnly>

Your coding agent can debug the running app. Ask it about what you see:

```prompt
The todo list still shows the old title after I save. Find out why.
```

With Data Client's [skills](./agent-skills.md) set up, it reads the page's store, recent actions and errors through
[`globalThis.__DC__`](../api/DevToolsManager.md#controllers) to find the cause, instead of guessing from code. It
needs a browser tool that runs JavaScript in the page: Cursor's browser,
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp),
[Playwright MCP](https://github.com/microsoft/playwright-mcp) or Claude in Chrome.

</SiteOnly>

<AgentOnly>

When the running app shows wrong or stale data, read its store in the page before reading code for the cause. In
dev mode, `__DC__.controller` is the page's [Controller](../api/Controller.md), so every Controller method works,
and `__DC__.actions` holds its recent [actions](../api/Actions.md).

Each snippet below is a sync function. Pass it as is to a tool that takes a function (Chrome DevTools MCP
`evaluate_script`, Playwright MCP `browser_evaluate`), or evaluate `(<snippet>)()` in one that takes an expression
(Claude in Chrome `javascript_tool`, CDP `Runtime.evaluate` with `awaitPromise` and `returnByValue`). They use the
entity `Todo` and paths containing `/todos`: replace them with the app's own.

<ResponseForKey />

<RecentActions />

<Errors />

`__DC__` is undefined in production builds, without `DevToolsManager` in the managers, or before `@data-client` 0.19.

The rest (refetching, symptoms and what to check first, changing state, each browser tool's setup)
is in :react[`.agents/skills/data-client-react/references/devtools-debugging.md`]:vue[`.agents/skills/data-client-vue/references/devtools-debugging.md`].
If it's missing, `npx --no data-client-skills` from the project root links it, or read
:react[[the published copy](https://raw.githubusercontent.com/reactive/data-client/master/.agents/skills/data-client-react/references/devtools-debugging.md)]:vue[[the published copy](https://raw.githubusercontent.com/reactive/data-client/master/.agents/skills/data-client-vue/references/devtools-debugging.md)].

</AgentOnly>

## Manual debugging

If you prefer to inspect everything yourself, the browser devtools workflow below remains
the standard manual path.

### Installation

Add the browser extension for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Open dev tools

:::react

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![redux-devtools browser button](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![reactive data client button](/img/client-logo.svg)
</span>
</span>

:::

:::vue

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![redux-devtools browser button](/img/devtools-browser-button.png)
</span>

:::

After installing and loading your site in :react[[dev-mode](https://webpack.js.org/guides/development/)]:vue[[dev-mode](https://vite.dev/guide/env-and-mode)], :react[you either
click the <abbr title="Reactive Data Client">Data Client</abbr> logo (default bottom-right of window) or the
redux-devtool logo in the location bar.]:vue[click the redux-devtool logo in the location bar.]

Clicking that will open the inspector, which allows you to observe dispatched actions,
their effect on the store's state as well as current store state.

:::react

The <abbr title="Reactive Data Client">Data Client</abbr> logo only appears in dev-mode. However, its
location can be moved or completely disabled by setting the [devButton DataProvider prop](../api/DataProvider.md#devbutton).

:::

![browser-devtools](/img/devtool-action.png 'Reactive Data Client devtools')

The [Controller](../api/Controller.md) dispatches actions, making that page useful for understanding
what actions you see. Here we observe common actions of [fetch](../api/Controller.md#fetch)
and [setResponse](../api/Controller.md#setResponse).

:::note

By default the devtool integration will filter duplicate [fetch](../api/Controller.md#fetch) actions.
This can be changed with [skipLogging](../api/DevToolsManager.md#skiplogging) option.

:::

### Control flow

<abbr title="Reactive Data Client">Data Client</abbr> uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, making debugging
straightforward as each change is traceable and descriptive.

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

> [More about control flow](../concepts/managers.md)

### State Inspection

Whens [schemas](/rest/api/schema) are used, responses are [normalized](../concepts/normalization.md) into `entities`
and `endpoints` tables. This enables automatic performance advantages over simpler key-value fetch caches; especially
beneficial with dynamic (changing) data. This also eliminates data-inconsistency bugs.

![Dev tools state inspector](/img/devtool-state.png 'Reactive Data Client devtools state inspector')

Click on the **'state'**
tab in devtools to see the store's entire state. This can be useful to determine exactly where data is. There is
also a 'meta' section of the cache for information like when the request took place (useful for [TTL](../concepts/expiry-policy.md)).

### State Diff

For monitoring a particular fetch response, it might be more useful to see how the store updates.
Click on the 'Diff' tab to see what changed.

![Dev tools diff inspector](/img/devtool-diff.png 'Reactive Data Client devtools diff')

Here we toggled the 'completed' status of a todo using an [optimistic update](/rest/guides/optimistic-updates).

### Action Tracing

Tracing is not enabled by default as it is very computationally expensive. However, it can be very useful
in tracking down where [actions](../api/Actions.md) are dispatched from. Customize [DevToolsManager](../api/DevToolsManager.md)
by setting the trace option to `true` with [getDefaultManagers](../api/getDefaultManagers.md):

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
