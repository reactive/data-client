---
title: CommitGateManager - Keep fetches that resolve before DataProvider mounts
sidebar_label: CommitGateManager
frameworks: [react]
---

import ProviderManagers from '../shared/_provider_managers.mdx';

# CommitGateManager

Holds fetch results that arrive before [&lt;DataProvider /&gt;](./DataProvider.md) mounts, then
applies them once it does.

React can render a `DataProvider` and then throw that render away. This happens when the provider
sits inside a lazy-loaded layout, or when something outside the provider suspends during its first
render. A fetch that resolves in between has no store to land in, so [useSuspense()](./useSuspense.md)
would stay on its fallback. `CommitGateManager` keeps those results and replays them into the store
that mounts, so the endpoint is called only once.

:::info implements

`CommitGateManager` implements [Manager](./Manager.md)

:::

## Usage

Add it first when `DataProvider` renders inside a [lazy](https://react.dev/reference/react/lazy)
layout or route, or next to a component that can suspend outside it. The most common case is
[Expo Router](https://docs.expo.dev/router/introduction/): with async routes on, which is the default
on web, it wraps the root `_layout.tsx` in `React.lazy`. This isn't specific to React Native.

On React Native, [DataProvider](./DataProvider.md#managers) adds it first to its `managers` for you.

<ProviderManagers imports={['CommitGateManager', 'getDefaultManagers']}>

```ts
// highlight-next-line
const managers = [new CommitGateManager(), ...getDefaultManagers()];
```

</ProviderManagers>

:::note

Put it first, in the same `managers` list as the [NetworkManager](./NetworkManager.md) it protects,
and give each `DataProvider` its own `CommitGateManager`.

:::

:::tip

Placing `DataProvider` at the root, with every [Suspense](https://react.dev/reference/react/Suspense)
boundary inside it, avoids the race without this manager.

:::

## Members

### middleware

#### Processed Actions

- [setResponse](./Controller.md#setResponse) is held until the provider mounts.
- [resetEntireStore](./Controller.md#resetEntireStore) drops held results.

#### Dispatched Actions

- [setResponse](./Controller.md#setResponse) replays each held result into the mounted store.
