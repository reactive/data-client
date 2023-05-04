---
title: useFetch()
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';

<head>
  <title>useFetch() - Declarative fetch triggers for React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

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

| Expiry Status | Fetch           | Returns     | Conditions                                                                                            |
| ------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | Promise     | not in store, [deletion](/rest/api/createResource#delete), [invalidation](./Controller.md#invalidate) |
| Stale         | yes<sup>1</sup> | Promise     | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                          |
| Valid         | no              | `undefined` | fetch completion                                                                                      |
|               | no              | `undefined` | `null` used as second argument                                                                        |

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
): Promise<any> | undefined;
```

```typescript
function useFetch<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): ReturnType<E>;
```

</GenericsTabs>
