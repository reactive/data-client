---
title: useLive() - Rendering dynamic data in React
vue_title: useLive() - Rendering dynamic data in Vue
sidebar_label: useLive()
description: Async rendering of remotely triggered data mutations. useSuspense() + useSubscription() in one hook.
vue_description: Async rendering of remotely triggered data mutations. useSuspense() + useSubscription() in one composable.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';
import StackBlitz from '@site/src/components/StackBlitz';
import UseLive from '../shared/\_useLive.mdx';

# useLive()

Async rendering of remotely triggered data mutations.

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) in one :react[hook]:vue[composable].

`useLive()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

:::react

<UseLive />

:::

:::vue

<FrameworkPlayground row>

```typescript title="Ticker" {32} collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  trade_id = 0;
  price = 0;
  size = '0';
  time = Temporal.Instant.fromEpochMilliseconds(0);
  bid = '0';
  ask = '0';
  volume = '';

  pk(): string {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = {
    price: Number,
    time: Temporal.Instant.from,
  };
}

export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  process(value, { productId }) {
    value.product_id = productId;
    return value;
  },
  pollFrequency: 2000,
});
```

```html title="AssetPrice.vue"
<script setup lang="ts">
  import { computed } from 'vue';
  import { useLive } from '@data-client/vue';
  import { getTicker } from './Ticker';

  const props = defineProps<{ productId: string }>();
  // highlight-next-line
  const ticker = await useLive(getTicker, computed(() => ({
    productId: props.productId,
  })));
</script>

<template>
  <center>
    {{ productId }}
    <NumberFlow
      :value="ticker.price"
      :format="{ style: 'currency', currency: 'USD' }"
    />
  </center>
</template>
```

</FrameworkPlayground>

Like [useSuspense()](./useSuspense.md), `useLive()` returns a Promise, so it is used with `await` in
`<script setup>` and requires a [Suspense](https://vuejs.org/guide/built-ins/suspense.html) ancestor.
The subscription is removed automatically when the component unmounts.

:::

## Behavior

<ConditionalDependencies hook="useLive" />

:::react

::::info[React Native]

When using React Navigation, useLive() will trigger fetches on focus if the data is considered
stale. useLive() will also sub/unsub with focus/unfocus respectively.

::::

:::

## Types

:::react

<GenericsTabs>

```typescript
function useLive(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema>;
```

```typescript
function useLive<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends Exclude<Schema, null>
  ? Denormalize<E['schema']>
  : ReturnType<E>;
```

</GenericsTabs>

:::

:::vue

```typescript
function useLive(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): Promise<DeepReadonly<ComputedRef<Denormalize<typeof endpoint.schema>>>>;
```

Arguments can be plain values, [refs](https://vuejs.org/api/reactivity-core.html#ref) (including [computed](https://vuejs.org/api/reactivity-core.html#computed)), or getter
functions like `() => ({ id: props.id })`; the result
updates (and the subscription is re-established) when they change.
While data for new arguments loads, the result keeps the previous data instead of becoming `undefined`.
If that fetch fails, reading the result throws the error (per its [error policy](../concepts/error-policy.md)), so it reaches
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Examples

### Bitcoin Price (polling)

When our component with `useLive` is rendered, `getTicker` will fetch at [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
miliseconds.

:::react

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />

:::
