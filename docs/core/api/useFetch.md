---
title: useFetch() - Declarative fetch triggers for React
sidebar_label: useFetch()
description: Fetch without the data rendering. Prevent fetch waterfalls by prefetching without duplicate requests.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# useFetch()

Fetch without the data rendering.

This can be useful for ensuring resources early in a render tree before they are needed.

:::tip

Use in combination with a data-binding hook ([useCache()](./useCache.md), [useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md))
in another component.

:::

## Usage

```tsx
function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.get, { id });
  // ...
}
```

## Behavior

| Expiry Status | Fetch           | Returns               | `resolved` | Conditions                                                                                            |
| ------------- | --------------- | --------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | Promise               | `false`    | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate) |
| Stale         | yes<sup>1</sup> | Promise               | `false`    | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                          |
| Valid         | no              | Promise (pre-resolved) | `true`     | fetch completion                                                                                      |
|               | no              | `undefined`           |            | `null` used as second argument                                                                        |

`useFetch()` always returns the same promise reference, even after it resolves. This means it can be
used directly with [React.use()](https://react.dev/reference/react/use) or checked via `promise.resolved`
instead of truthiness.

:::note

1. Identical fetches are automatically deduplicated

:::

:::info React Native

When using React Navigation, useFetch() will trigger fetches on focus if the data is considered
stale.

:::

<ConditionalDependencies hook="useFetch" />

## Types

<GenericsTabs>

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): (Promise<any> & { resolved: boolean }) | undefined;
```

```typescript
function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): ReturnType<E> & { resolved: boolean };
```

</GenericsTabs>

## Examples

### React.use()

Since `useFetch()` always returns a promise, it can be passed directly to
[React.use()](https://react.dev/reference/react/use):

```tsx
import { use } from 'react';

function MasterPost({ id }: { id: number }) {
  const promise = useFetch(PostResource.get, { id });
  const data = use(promise);
  // ...
}
```

### Checking fetch status

Use `promise.resolved` to check whether data is still loading:

```tsx
function MasterPost({ id }: { id: number }) {
  const promise = useFetch(PostResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  // ...
}
```

### NextJS Preload

To prevent fetch waterfalls in NextJS, sometimes you might need to add [preloads](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data) to top level routes.

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />
