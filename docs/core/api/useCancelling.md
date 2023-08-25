---
title: useCancelling()
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import PkgInstall from '@site/src/components/PkgInstall';
import UseCancelling from '../shared/\_useCancelling.mdx';

<head>
  <title>useCancelling() - Declarative fetch aborting for React</title>
</head>

Builds an Endpoint that cancels fetch everytime parameters change

[Aborts](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) inflight request if the parameters change.

## Usage

<PkgInstall pkgs="@data-client/hooks" />

<UseCancelling />

:::caution Warning

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::

## Types

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```

Part of [@data-client/hooks](https://www.npmjs.com/package/@data-client/hooks)
