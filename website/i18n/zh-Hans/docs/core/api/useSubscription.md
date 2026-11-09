---
title: useSubscription() - 在 React 中更新频繁变化的数据
vue_title: useSubscription() - 在 Vue 中更新频繁变化的数据
sidebar_label: useSubscription()
description: 保持数据最新，但仅在组件处于活跃状态时生效。支持轮询、websocket 和 SSE。
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';

# useSubscription()

非常适合让频繁变化的资源保持最新。

使用默认的[轮询订阅](./PollingSubscription)时，必须在 [Endpoint](/rest/api/Endpoint) 中设置频率，
否则不会生效。

:::tip

[useLive()](./useLive.md) 是与 [useSuspense()](./useSuspense.md) 组合使用的更简洁写法，

:::

## 用法 {#usage}

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

## 行为 {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

使用 React Navigation 时，useSubscription() 会分别在获得焦点/失去焦点时订阅/取消订阅。

:::

在隐藏的 [`<Activity>`](https://react.dev/reference/react/Activity) 中，`useSubscription()` 会取消订阅。
显示时会重新订阅。[示例](#pause-while-hidden)

::::

:::vue

订阅会在组件 setup 时创建，在组件卸载时移除。当以
[ref](https://vuejs.org/api/reactivity-core.html#ref) 形式传入的参数发生变化时，之前的
订阅会被移除，并为新参数创建新的订阅。

:::

## 类型 {#types}

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

## 示例 {#examples}

### 仅在元素可见时订阅 {#only-subscribe-while-element-is-visible}

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

当第二个参数传入 `null` 时，订阅会被停用。当然，
如果还有其他组件在订阅，数据更新仍会继续。

:::react

`useInView()` 使用了性能非常好的 [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。
[useIntersectionObserver()](https://usehooks.com/useintersectionobserver) 等 hook 也是如此。

:::

:::vue

VueUse 的 [useElementVisibility()](https://vueuse.org/core/useElementVisibility/) 使用了性能非常好的 [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。[模板引用](https://vuejs.org/guide/essentials/template-refs.html)让
我们可以访问 [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)。

:::

:::react

### 隐藏时暂停 {#pause-while-hidden}

要隐藏某个面板或标签页，请用 [`<Activity>`](https://react.dev/reference/react/Activity) 包裹它。`AssetPrice` 无需
任何改动。

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

隐藏的 `<Activity>` 会保留 `AssetPrice` 及其状态，但会停止它的 Effect。如果没有其他组件订阅该
价格，轮询就会停止。显示时，轮询会恢复。如果上次获取早于
[pollFrequency](/rest/api/RestEndpoint#pollfrequency)，会立即获取。

隐藏的 `<Activity>` 仍会渲染。因此 `useSuspense()` 会在面板打开之前获取价格，面板打开时不会出现
加载状态。

### 加密货币价格（websocket） {#crypto-prices-websockets}

我们实现了自己的 `StreamManager` 来处理自定义的 websocket 协议。这里我们监听 `useSubscription` 发出的
[订阅/取消订阅 action](./Actions.md#subscribe)，以确保只监听已渲染组件所需的更新。

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
