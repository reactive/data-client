---
title: useSubscription() - Updating frequent data changes in React
vue_title: useSubscription() - Updating frequent data changes in Vue
sidebar_label: useSubscription()
description: Keeps data fresh, but only when component is active. Supports polling, websockets, and SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import HooksPlayground from '@site/src/components/HooksPlayground';
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

<FrameworkPlayground row>

```typescript title="Ticker" {23} collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  price = 0;

  pk() {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = { price: Number };
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

:::react

```tsx title="AssetPrice" {7}
import { useSuspense, useSubscription } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getTicker } from './Ticker';

function AssetPrice({ productId }: { productId: string }) {
  const ticker = useSuspense(getTicker, { productId });
  useSubscription(getTicker, { productId });
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
render(<AssetPrice productId="BTC-USD" />);
```

:::

:::vue

```html title="AssetPrice.vue" {10}
<script setup lang="ts">
  import { useSuspense, useSubscription } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getTicker } from './Ticker';

  const props = defineProps<{ productId: string }>();
  const ticker = await useSuspense(getTicker, () => ({
    productId: props.productId,
  }));
  useSubscription(getTicker, () => ({ productId: props.productId }));
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

:::

</FrameworkPlayground>

## Behavior

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

When using React Navigation, useSubscription() will sub/unsub with focus/unfocus respectively.

:::

In a hidden [`<Activity>`](https://react.dev/reference/react/Activity), `useSubscription()` unsubscribes. It
subscribes again when shown. [Example](#pause-while-hidden)

::::

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

<FrameworkPlayground row>

```typescript title="Ticker" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  price = 0;

  pk() {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = { price: Number };
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

:::react

```tsx title="useInView" collapsed
import React from 'react';

/** Whether the element is on screen */
export function useInView<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    // one callback can hold several entries: the last is current
    const observer = new IntersectionObserver(entries =>
      entries.forEach(entry => setInView(entry.isIntersecting)),
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView] as const;
}
```

```tsx title="Watchlist" {9-10}
import { useSuspense, useSubscription } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getTicker } from './Ticker';
import { useInView } from './useInView';

function AssetRow({ productId }: { productId: string }) {
  const ticker = useSuspense(getTicker, { productId });
  const [ref, inView] = useInView<HTMLDivElement>();
  // null args means don't subscribe
  useSubscription(getTicker, inView ? { productId } : null);
  return (
    <div className="listItem" ref={ref}>
      <h4>{productId}</h4>
      <NumberFlow
        className="value"
        value={ticker.price}
        format={{ style: 'currency', currency: 'USD' }}
      />
    </div>
  );
}

const products = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'BCH-USD',
  'LTC-USD',
  'AAVE-USD',
  'AVAX-USD',
  'LINK-USD',
];
render(
  <>
    <header className="appHeader">
      <h1 className="appTitle">Watchlist</h1>
    </header>
    <div className="list scroll">
      {products.map(productId => (
        <AssetRow key={productId} productId={productId} />
      ))}
    </div>
  </>,
);
```

:::

:::vue

```html title="AssetRow.vue" {14-20}
<script setup lang="ts">
  import { computed, useTemplateRef } from 'vue';
  import { useElementVisibility } from '@vueuse/core';
  import { useSuspense, useSubscription } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getTicker } from './Ticker';

  const props = defineProps<{ productId: string }>();
  const ticker = await useSuspense(getTicker, () => ({
    productId: props.productId,
  }));
  const el = useTemplateRef('el');
  const isVisible = useElementVisibility(el);
  // null args means don't subscribe
  useSubscription(
    getTicker,
    computed(() =>
      isVisible.value ? { productId: props.productId } : null,
    ),
  );
</script>

<template>
  <div ref="el" class="listItem">
    <h4>{{ productId }}</h4>
    <NumberFlow
      class="value"
      :value="ticker.price"
      :format="{ style: 'currency', currency: 'USD' }"
    />
  </div>
</template>
```

:::

</FrameworkPlayground>

When `null` is sent as the second argument, the subscription is deactivated. Of course,
if other components are still subscribed the data updates will still be active.

:::react

`useInView()` uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API),
which is very performant. Hooks such as [useIntersectionObserver()](https://usehooks.com/useintersectionobserver) do
the same.

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/) from VueUse uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant. [Template refs](https://vuejs.org/guide/essentials/template-refs.html) allow
us to access the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Pause while hidden

To hide a panel or tab, wrap it in [`<Activity>`](https://react.dev/reference/react/Activity). `AssetPrice` needs
no change.

<HooksPlayground row>

```typescript title="Ticker" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class Ticker extends Entity {
  product_id = '';
  price = 0;

  pk() {
    return this.product_id;
  }
  static key = 'Ticker';

  static schema = { price: Number };
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
import { useSuspense, useSubscription } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getTicker } from './Ticker';

export default function AssetPrice({ productId }: { productId: string }) {
  const ticker = useSuspense(getTicker, { productId });
  useSubscription(getTicker, { productId });
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
```

```tsx title="PricePanel" {14-16}
import React from 'react';
import AssetPrice from './AssetPrice';

function PricePanel({ productId }: { productId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Prices</h1>
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Show'} price
        </button>
      </header>
      <React.Activity mode={open ? 'visible' : 'hidden'}>
        <AssetPrice productId={productId} />
      </React.Activity>
    </>
  );
}
render(<PricePanel productId="BTC-USD" />);
```

</HooksPlayground>

A hidden `<Activity>` keeps `AssetPrice` and its state, but stops its Effects. If no other component subscribes to the
price, polling stops. When shown, polling resumes. If the last fetch is older than
[pollFrequency](/rest/api/RestEndpoint#pollfrequency), it fetches at once.

A hidden `<Activity>` still renders. So `useSuspense()` fetches the price before the panel opens, and the panel opens
without a loading state.

### Crypto prices (websockets)

We implemented our own `StreamManager` to handle our custom websocket protocol. Here we listen to the [subscribe/unsubscribe
actions](./Actions.md#subscribe) sent by `useSubscription` to ensure we only listen to updates for components that are rendered.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
