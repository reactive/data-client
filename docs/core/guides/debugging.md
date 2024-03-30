---
title: Debugging and Inspection
sidebar_label: Debugging
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';

RDC uses the [flux store](https://facebookarchive.github.io/flux/docs/in-depth-overview/) pattern, making debugging
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

[DevToolsManager](../api/DevToolsManager) makes this work. This is part of the [default managers](../api/CacheProvider.md) for [CacheProvider](../api/CacheProvider.md)
in dev mode. If you have custom managers, you'll need to ensure DevToolsManager is included.

## Open dev tools

<span style={{float:'right',marginLeft:'10px'}}>
![redux-devtools button](/img/redux-devtools.png)
</span>

After installing and running your site, a new icon should appear in your location bar

Clicking that will open the inspector, which allows you to observe dispatched actions,
their effect on the cache state as well as current cache state.

![browser-devtools](/img/devtool-action.png 'Reactive Data Client devtools')

The [Controller](../api/Controller.md) dispatches actions, making that page useful for understanding
what actions you see. Here we observe the most common actions of [fetch](../api/Controller.md#fetch)
and [set](../api/Controller.md#setResponse).

:::note

By default the devtool integration will filter [fetch](../api/Controller.md#fetch) actions initiated
by hooks to reduce spam. This can be changed with [skipLogging](../api/DevToolsManager.md#skiplogging) option.

:::

## State Inspection

If [schema](/rest/api/schema)s are used, API responses are split into two pieces - entities, and results. This
is known as [normalization](../concepts/normalization.md), which ensures consistency
and alows allows for automatic as well as novel performances optimizations, especially
key if the data ever changes or is repeated.

<Tabs
defaultValue="State"
values={[
{ label: 'State', value: 'State' },
{ label: 'Response', value: 'Response' },
{ label: 'Endpoint', value: 'Endpoint' },
{ label: 'Entity', value: 'Entity' },
{ label: 'React', value: 'React' },
]}>
<TabItem value="State">

![Entities cache](/img/entities.png 'Entities cache')

</TabItem>
<TabItem value="Response">

```json
[
  { "id": 1, "title": "this is an entity" },
  { "id": 2, "title": "this is the second entity" }
]
```

</TabItem>
<TabItem value="Endpoint">

```typescript
const getPresentations = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: new schema.Collection([Presentation]) },
);
```

</TabItem>
<TabItem value="Entity">

```typescript
class Presentation extends Entity {
  id = '';
  title = '';

  pk() {
    return this.id;
  }
  static key = 'presentation';
}
```

</TabItem>
<TabItem value="React">

```tsx
export function PresentationsPage() {
  const presentation = useSuspense(getPresentations);
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

</TabItem>
</Tabs>

Once [normalized](../concepts/normalization.md), these [entities](/rest/api/Entity) and results are merged with the larger cache. Click on the 'state'
tab in devtools to see the entire state. This can be useful to determine exactly where data is. There is
also a 'meta' section of the cache for information like when the request took place (useful for [TTL](../concepts/expiry-policy.md)).

![Dev tools state inspector](/img/devtool-state.png 'Reactive Data Client devtools state inspector')

## State Diff

For monitoring a particular fetch response, it might be more useful to see how the cache state updates.
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
  CacheProvider,
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
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```