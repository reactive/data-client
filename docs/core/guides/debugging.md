---
title: Debugging and Inspection
sidebar_label: Debugging
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

By default [CacheProvider](../api/CacheProvider) includes the [DevToolsManager](../api/DevToolsManager),
which means in development mode (`process.env.NODE_ENV !== 'production'`) it will send state and actions
to [Redux DevTools](https://github.com/zalmoxisus/redux-devtools-extension).

## Getting Started

### Install browser extension

Add the browser extension for
[chrome extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)
or
[firefox extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Ensure Manager is installed

By default this is enabled in dev mode. If using your own set of managers, add [DevToolsManager](../api/DevToolsManager)
to the beginning of the list.

### Open dev tools

After installing and running your site, a new icon should appear in your location bar

![redux-devtools button](/img/redux-devtools.png)

Clicking that will open the inspector, which allows you to observe dispatched actions,
their effect on the cache state as well as current cache state.

![redux-devtools](/img/redux-devtool-diff.png)

## Understanding Rest Hooks Cache

Rest Hooks uses the flux architecture to make it easy to understand and debug. This also
has the benefit of making Rest Hooks concurrent mode compatible.

The same [core principals of redux](https://redux.js.org/introduction/core-concepts) apply
to this store's design.

![flux](/img/flux.png)

Here we see the data flow.

For example, when a useSuspense() hook is first mounted it might

- Start by dispatching a fetch action
- If no identical fetches are in-flight, the central store will then start the network call over HTTP
- When the network call resolves, a receive action is sent to the store's reducer, updating the state.
- The component is re-rendered with the updated state, resolving the suspense.

> [More about control flow](../api/Manager#control-flow)

### Normalized Cache

If [schema](/rest/api/schema)s are used, API responses are split into two pieces - entities, and results.
This ensures consistency and alows allows for automatic as well as novel performances optimizations, especially
key if the data ever changes or is repeated.

<Tabs
defaultValue="State"
values={[
{ label: 'State', value: 'State' },
{ label: 'Response', value: 'Response' },
{ label: 'Endpoint', value: 'Endpoint' },
{ label: 'Entity', value: 'Entity' },
]}>
<TabItem value="State">

![Entities cache](/img/entities.png)

</TabItem>
<TabItem value="Response">

```json
[
  {"id": 1, "title": "this is an entity"},
  {"id": 2, "title": "this is the second entity"}
]
```

</TabItem>
<TabItem value="Endpoint">

```typescript
const PresentationList = new Endpoint(
  () => fetch(`/presentations`).then(res => res.json()),
  { schema: [PresentationEntity] },
);
```

</TabItem>
<TabItem value="Entity">

```typescript
class PresentationEntity extends Entity {
  readonly id: string = '';
  readonly title: string = '';

  pk() {
    return this.id;
  }
}
```

</TabItem>
<TabItem value="React">

```tsx
export function PresentationsPage() {
  const presentation = useSuspense(PresentationList, {});
  return presentation.map(presentation => (
    <div key={presentation.pk()}>{presentation.title}</div>
  ));
}
```

</TabItem>
</Tabs>

Once normalized, these entities and results are merged with the larger cache. Click on the 'state'
tab in devtools to see the entire state. This can be useful to determine exactly where data is. There is
also a 'meta' section of the cache for information like when the request took place (useful for TTL).

![Dev tools state inspector](/img/redux-devtools-state.png)

For monitoring a particular fetch response, it might be more useful to see how the cache state updates.
Click on the 'Diff' tab to see what changed.

![Dev tools diff inspector](/img/redux-devtool-diff.png)

Here we can see that an entity was inserted as well as new results.
