---
title: useSubscription() - Updating frequent data changes in React
vue_title: useSubscription() - Updating frequent data changes in Vue
sidebar_label: useSubscription()
description: Keeps data fresh, but only when component is active. Supports polling, websockets, and SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';

# useSubscription()

Great for keeping resources up-to-date with frequent changes.

When using the default [polling subscriptions](./PollingSubscription), frequency must be set in
[Endpoint](/rest/api/Endpoint), otherwise will have no effect.

:::tip

[useLive()](./useLive.md) is a terser way to use in combination with [useSuspense()](./useSuspense.md),

:::

## Usage

```typescript title="api/Price"
import { Resource, Entity } from '@data-client/rest';

export class Price extends Entity {
  symbol = '';
  price = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
}

export const getPrice = new RestEndpont({
  urlPrefix: 'http://test.com',
  path: '/price/:symbol',
  schema: Price,
  pollFrequency: 5000,
});
```

:::react

```tsx title="MasterPrice"
import { useSuspense, useSubscription } from '@data-client/react';
import { getPrice } from 'api/Price';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(getPrice, { symbol });
  useSubscription(getPrice, { symbol });
  // ...
}
```

:::

:::vue

```html title="MasterPrice.vue"
<script setup lang="ts">
  import { useSuspense, useSubscription } from '@data-client/vue';
  import { getPrice } from 'api/Price';

  const props = defineProps<{ symbol: string }>();
  const price = await useSuspense(getPrice, () => ({ symbol: props.symbol }));
  useSubscription(getPrice, () => ({ symbol: props.symbol }));
  // ...
</script>
```

:::

## Behavior

<ConditionalDependencies hook="useSubscription" />

:::react

::::info[React Native]

When using React Navigation, useSubscription() will sub/unsub with focus/unfocus respectively.

::::

:::

:::vue

The subscription is created when the component is set up and removed when it unmounts. When
an argument passed as a [ref](https://vuejs.org/api/reactivity-core.html#ref) changes, the previous
subscription is removed and a new one is created for the new arguments.

:::

## Types

:::react

<GenericsTabs>

```typescript
function useSubscription(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): void;
```

```typescript
function useSubscription<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): void;
```

</GenericsTabs>

:::

:::vue

```typescript
function useSubscription(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): void;
```

<VueArgs />

:::

## Examples

### Only subscribe while element is visible

:::react

```tsx title="MasterPrice.tsx"
import { useSuspense, useSubscription } from '@data-client/react';
import { getPrice } from 'api/Price';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(getPrice, { symbol });
  const [ref, entry] = useIntersectionObserver();
  // null params means don't subscribe
  useSubscription(getPrice, entry?.isIntersecting ? null : { symbol });

  return (
    <div ref={ref}>
      {price.value.toLocaleString('en', { currency: 'USD' })}
    </div>
  );
}
```

:::

:::vue

```html title="MasterPrice.vue"
<script setup lang="ts">
  import { computed, useTemplateRef } from 'vue';
  import { useElementVisibility } from '@vueuse/core';
  import { useSuspense, useSubscription } from '@data-client/vue';
  import { getPrice } from 'api/Price';

  const props = defineProps<{ symbol: string }>();
  const price = await useSuspense(getPrice, () => ({ symbol: props.symbol }));
  const el = useTemplateRef('el');
  const isVisible = useElementVisibility(el);
  // null params means don't subscribe
  useSubscription(
    getPrice,
    computed(() => (isVisible.value ? { symbol: props.symbol } : null)),
  );
</script>

<template>
  <div ref="el">{{ price.price }}</div>
</template>
```

:::

When `null` is send as the second argument, the subscription is deactivated. Of course,
if other components are still subscribed the data updates will still be active.

:::react

[useIntersectionObserver()](https://usehooks.com/useintersectionobserver) uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant. [ref](https://react.dev/reference/react/useRef) allows
us to access the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/) from VueUse uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant. [Template refs](https://vuejs.org/guide/essentials/template-refs.html) allow
us to access the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Crypto prices (websockets)

We implemented our own `StreamManager` to handle our custom websocket protocol. Here we listen to the [subcribe/unsubcribe
actions](./Actions.md#subscribe) sent by `useSubscription` to ensure we only listen to updates for components that are rendered.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
