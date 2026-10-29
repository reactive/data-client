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

Both keep params that change quickly from wasting the network. They differ in when a fetch starts.

|                                  | useCancelling()                                    | [useDebounce()](./useDebounce.md)            |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Fetch starts                     | at once, on every change                           | once the value has held still for `delay` ms |
| Requests sent                    | one per value, each aborted when the params change | one per value the user pauses on             |
| Wait before the last value loads | none                                               | `delay`                                      |

Use `useCancelling()` when each value is somewhere the user lands: arrowing through a list, switching
tabs or pages. Whichever one they stop on starts downloading at once, with the connection to itself.

Use [useDebounce()](./useDebounce.md) when the values in between aren't wanted at all, like each letter
of a word typed into a search. Those requests never go out. An abort only stops the download, so the
server has usually already received the request and may still do the work.

They also work together. Debounce what's typed, and abort a search that is still loading when the next
one starts:

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
