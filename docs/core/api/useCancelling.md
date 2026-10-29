---
frameworks: [react]
title: useCancelling() - Declarative fetch aborting for React
sidebar_label: useCancelling()
description: Builds an Endpoint that cancels fetch everytime parameters change. Aborts inflight request on param change.
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import PkgInstall from '@site/src/components/PkgInstall';
import UseCancelling from '../shared/\_useCancelling.mdx';

# useCancelling()

Builds an Endpoint that cancels fetch everytime parameters change

[Aborts](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) inflight request if the parameters change.

## Usage

<UseCancelling />

:::warning[Warning]

Be careful when using this with many disjoint components fetching the same
arguments (Endpoint/params pair) to useSuspense(). This solution aborts fetches per-component,
which means you might end up canceling a fetch that another component still cares about.

:::

## useCancelling() or useDebounce()?

Use `useCancelling()` when the user stops on each value, like a list they arrow through. It fetches at
once and aborts the previous fetch.

Use [useDebounce()](./useDebounce.md) when the user types. It waits until typing stops, so it sends
fewer requests.

For a search, use both:

```tsx
import {
  useCancelling,
  useDebounce,
  useSuspense,
} from '@data-client/react';
import { searchIssues } from './resources/Issue';

function IssueList({ query }: { query: string }) {
  const [q] = useDebounce(query, 200);
  const { items } = useSuspense(useCancelling(searchIssues, { q }), { q });
  // ...
}
```

## Types

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```
