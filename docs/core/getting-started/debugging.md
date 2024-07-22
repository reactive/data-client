---
title: Debugging and Inspection
sidebar_label: Debugging
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

<abbr title="Reactive Data Client">Data Client</abbr> uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, making debugging
straightforward as each change is traceable and descriptive.

<ThemedImage
  alt="FLUX"
  sources={{
    light: useBaseUrl('/img/flux.png'),
    dark: useBaseUrl('/img/flux-dark.png'),
  }}
/>

> [More about control flow](../api/Manager#control-flow)

## Installation

Add the browser extension for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

[DevToolsManager](../api/DevToolsManager) makes this work. This is part of the [default managers](../api/DataProvider.md) for [DataProvider](../api/DataProvider.md)
in dev mode. If you have custom managers, you'll need to ensure DevToolsManager is included.

## Open dev tools

<span style={{float:'right',marginLeft:'10px',width:'190px'}}>
![redux-devtools browser button](/img/devtools-browser-button.png)
</span>

After installing and running your site, a new icon should appear in your location bar

Clicking that will open the inspector, which allows you to observe dispatched actions,
their effect on the store's state as well as current store state.

![browser-devtools](/img/devtool-action.png 'Reactive Data Client devtools')

The [Controller](../api/Controller.md) dispatches actions, making that page useful for understanding
what actions you see. Here we observe common actions of [fetch](../api/Controller.md#fetch)
and [setResponse](../api/Controller.md#setResponse).

:::note

By default the devtool integration will filter duplicate [fetch](../api/Controller.md#fetch) actions.
This can be changed with [skipLogging](../api/DevToolsManager.md#skiplogging) option.

:::

## State Inspection

Whens [schema](/rest/api/schema)s are used, responses are [normalized](../concepts/normalization.md) into `entities`
and `endpoints` tables. This enables automatic performance advantages over simpler key-value fetch caches; especially
beneficial with dynamic (changing) data. This also eliminates data-inconsistency bugs.

![Dev tools state inspector](/img/devtool-state.png 'Reactive Data Client devtools state inspector')

Click on the **'state'**
tab in devtools to see the store's entire state. This can be useful to determine exactly where data is. There is
also a 'meta' section of the cache for information like when the request took place (useful for [TTL](../concepts/expiry-policy.md)).

## State Diff

For monitoring a particular fetch response, it might be more useful to see how the store updates.
Click on the 'Diff' tab to see what changed.

![Dev tools diff inspector](/img/devtool-diff.png 'Reactive Data Client devtools diff')

Here we toggled the 'completed' status of a todo using an [optimistic update](/rest/guides/optimistic-updates).

## Action Tracing

Tracing is not enabled by default as it is very computationally expensive. However, it can be very useful
in tracking down where actions are dispatched from. Create your own [DevToolsManager](../api/DevToolsManager.md)
with the trace option set to `true`:

```tsx title="index.tsx"
import {
  DevToolsManager,
  DataProvider,
  getDefaultManagers,
} from '@data-client/react';
import ReactDOM from 'react-dom';

const managers =
  process.env.NODE_ENV !== 'production'
    ? [
        // highlight-start
        new DevToolsManager({
          trace: true,
        }),
        // highlight-end
        ...getDefaultManagers().filter(
          manager => manager.constructor.name !== 'DevToolsManager',
        ),
      ]
    : getDefaultManagers();

ReactDOM.createRoot(document.body).render(
  <DataProvider managers={managers}>
    <App />
  </DataProvider>,
);
```