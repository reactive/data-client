---
title: Debugging and Inspection
sidebar_label: Debugging
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import DataFlow from '@site/src/components/DataFlow';
import SiteOnly from '@site/src/components/SiteOnly';
import AgentOnly from '@site/src/components/AgentOnly';
import DevtoolsDebugging from '../_agents/devtools-debugging.md';

<SiteOnly>

## Debugging with agents

[`globalThis.__DC__`](../api/DevToolsManager.md#controllers) allows agents to introspect the Data Client store of your
app in development: its state, recent actions and errors, so your coding agent can debug what you see. Ask it:

```prompt
The todo list still shows the old title after I save. Find out why.
```

With Data Client's [skills](./agent-skills.md) set up, it finds the cause in the store instead of guessing from code. It
needs a browser tool that runs JavaScript in the page: Cursor's browser,
[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp),
[Playwright MCP](https://github.com/microsoft/playwright-mcp) or Claude in Chrome.

If debugging doesn't work with your agent or browser tool, [open an issue](https://github.com/reactive/data-client/issues/new?template=bug_report.md&title=Agent%20debugging%3A%20)
naming both so we can support it. Or have your agent write it:

```prompt
Debugging this app through globalThis.__DC__ didn't work with you and your browser tool. Search reactive/data-client issues for one about this pair; if there's none, draft a bug report from its .github/ISSUE_TEMPLATE/bug_report.md titled "Agent debugging: <agent> + <browser tool>" with both names and versions, the app's @data-client versions, whether globalThis.__DC__ was defined, what you ran and the exact error, and no app data or secrets. Show me the draft before filing it with gh issue create.
```

</SiteOnly>

<AgentOnly>

<DevtoolsDebugging />

## Manual debugging

If the user wants to inspect the store themselves, send them to the Redux DevTools extension steps at
:react[https://dataclient.io/docs/getting-started/debugging#manual-debugging]:vue[https://dataclient.io/vue/getting-started/debugging#manual-debugging].

</AgentOnly>

<SiteOnly>

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

<DataFlow />

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

</SiteOnly>
