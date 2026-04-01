---
title: Debugging and Inspection
sidebar_label: Debugging
image: /img/devtool-action.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

## Debugging with agents

For many debugging tasks, the fastest path is to use an agent that already knows the
`@data-client/react` debugging workflow.

Install the [`data-client-react` skill](https://skills.sh/reactive/data-client/data-client-react)
in your coding agent, then ask it to inspect the current page or app state.

### How agent debugging works

In dev mode, `DevToolsManager` exposes live `Controller` instances so an agent can inspect
cache state, endpoint metadata, and dispatched actions directly from the running app.

Technically, those controllers are stored on `globalThis.__DC_CONTROLLERS__`, which is a
browser-global `Map`. You can think of it as a temporary dev-mode registry that lets tools
and agents look up the active `DataProvider` stores for the current page.

At a high level, the agent can:

- discover the active `DataProvider` controllers
- read normalized or denormalized cache state
- inspect recent fetches, responses, errors, and invalidations
- correlate store changes with browser network activity
- trigger safe controller operations like invalidation or expiration for investigation

This is useful when you want a quick answer to questions like "why didn't this refetch?",
"what is in the cache right now?", or "which action updated this entity?" without manually
clicking through each inspector panel.

## Manual debugging

If you prefer to inspect everything yourself, the browser devtools workflow below remains
the standard manual path.

### Installation

Add the browser extension for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Open dev tools

<span style={{float:'right',marginLeft:'10px',width:'190px',textAlign:'center'}}>
![redux-devtools browser button](/img/devtools-browser-button.png)
<span style={{display:'inline-block',width:'40px',height:'40px'}}>
![reactive data client button](/img/client-logo.svg)
</span>
</span>

After installing and loading your [site in dev-mode](https://webpack.js.org/guides/development/), you either
click the <abbr title="Reactive Data Client">Data Client</abbr> logo (default bottom-right of window) or the
redux-devtool logo in the location bar.

Clicking that will open the inspector, which allows you to observe dispatched actions,
their effect on the store's state as well as current store state.

The <abbr title="Reactive Data Client">Data Client</abbr> logo only appears in dev-mode. However, its
location can be moved or completely disabled by setting the [devButton DataProvider prop](../api/DataProvider.md#devbutton).

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

```tsx title="index.tsx"
import {
  DevToolsManager,
  DataProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = getDefaultManagers({
  // highlight-next-line
  devToolsManager: { trace: true },
});

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```