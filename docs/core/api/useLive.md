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
import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';
import StackBlitz from '@site/src/components/StackBlitz';
import UseLive from '../shared/\_useLive.mdx';
import VueArgs from '../shared/\_vueArgs.mdx';

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

```typescript title="Ticker" {33} collapsed
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

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
  import NumberFlow from '@number-flow/vue';

  const props = defineProps<{ productId: string }>();
  // highlight-next-line
  const ticker = await useLive(getTicker, computed(() => ({
    productId: props.productId,
  })));
</script>

<template>
  <dl class="stats">
    <div>
      <dt>{{ productId }}</dt>
      <dd>
        <NumberFlow
          :value="ticker.price"
          :format="{ style: 'currency', currency: 'USD' }"
        />
      </dd>
    </div>
  </dl>
</template>
```

</FrameworkPlayground>

Like [useSuspense()](./useSuspense.md), `useLive()` returns a Promise, so it is used with `await` in
`<script setup>` and requires a [Suspense](https://vuejs.org/guide/built-ins/suspense.html) ancestor.
The subscription is removed automatically when the component unmounts.

:::

## Behavior

<ConditionalDependencies hook="useLive" />

::::react

:::info[React Native]

When using React Navigation, useLive() will trigger fetches on focus if the data is considered
stale. useLive() will also sub/unsub with focus/unfocus respectively.

:::

In a hidden [`<Activity>`](https://react.dev/reference/react/Activity), `useLive()` unsubscribes. It subscribes
again when shown. [Example](#pause-hidden-tabs)

::::

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

<VueArgs />

The result updates (and the subscription is re-established) when the arguments change.
While data for new arguments loads, the result keeps the previous data instead of becoming `undefined`.
If that fetch fails, reading the result throws the error (per its [error policy](../concepts/error-policy.md)), so it reaches
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Examples

### Bitcoin Price (polling)

When our component with `useLive` is rendered, `getTicker` will fetch at [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
milliseconds.

:::react

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />

:::

:::react

### Pause hidden tabs

Keep tabs mounted in [`<Activity>`](https://react.dev/reference/react/Activity). Only the shown tab polls.

<HooksPlayground row>

```typescript title="Ticker" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

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

```tsx title="AssetPrice" collapsed
import { useLive } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getTicker } from './Ticker';

export default function AssetPrice({ productId }: Props) {
  const ticker = useLive(getTicker, { productId });
  return (
    <dl className="stats">
      <div>
        <dt>{productId}</dt>
        <dd>
          <NumberFlow
            value={ticker.price}
            format={{ style: 'currency', currency: 'USD' }}
          />
        </dd>
      </div>
    </dl>
  );
}
interface Props {
  productId: string;
}
```

```tsx title="Markets" {25-30}
import React from 'react';
import AssetPrice from './AssetPrice';

const products = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

function Markets() {
  const [shown, setShown] = React.useState(products[0]);
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Markets</h1>
        <div className="segmented" role="group" aria-label="Product">
          {products.map(productId => (
            <button
              key={productId}
              aria-pressed={productId === shown}
              onClick={() => setShown(productId)}
            >
              {productId.split('-')[0]}
            </button>
          ))}
        </div>
      </header>
      {products.map(productId => (
        <React.Activity
          key={productId}
          mode={productId === shown ? 'visible' : 'hidden'}
        >
          <AssetPrice productId={productId} />
        </React.Activity>
      ))}
    </>
  );
}
render(<Markets />);
```

</HooksPlayground>

A hidden tab keeps its state, but its Effects stop. If no other component subscribes to its price, polling stops. When
shown, polling resumes. If the last fetch is older than [pollFrequency](/rest/api/RestEndpoint#pollfrequency), it
fetches at once.

Hidden tabs still render, so every tab fetches its price before it shows. Switching tabs shows a price with no loading
state.

:::
