---
title: useLive() - 在 React 中渲染动态数据
vue_title: useLive() - 在 Vue 中渲染动态数据
sidebar_label: useLive()
description: 异步渲染由远端触发的数据变更。将 useSuspense() + useSubscription() 合二为一的 hook。
vue_description: 异步渲染由远端触发的数据变更。将 useSuspense() + useSubscription() 合二为一的 composable。
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

异步渲染由远端触发的数据变更。

将 [useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) 合二为一的 :react[hook]:vue[composable]。

`useLive()` 会响应数据[变更](../getting-started/mutations.md)，仅在必要时重新渲染。

## 用法 {#usage}

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

与 [useSuspense()](./useSuspense.md) 一样，`useLive()` 返回一个 Promise，因此需要在
`<script setup>` 中配合 `await` 使用，并且需要一个 [Suspense](https://vuejs.org/guide/built-ins/suspense.html) 祖先组件。
组件卸载时，订阅会自动移除。

:::

## 行为 {#behavior}

<ConditionalDependencies hook="useLive" />

::::react

:::info[React Native]

使用 React Navigation 时，如果数据被视为过时，useLive() 会在获得焦点时触发获取。
useLive() 还会分别在获得焦点/失去焦点时订阅/取消订阅。

:::

在隐藏的 [`<Activity>`](https://react.dev/reference/react/Activity) 中，`useLive()` 会取消订阅。显示时
会重新订阅。[示例](#pause-hidden-tabs)

::::

## 类型 {#types}

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

参数变化时，结果会随之更新（订阅也会重新建立）。
在加载新参数对应的数据期间，结果会保留之前的数据，而不会变为 `undefined`。
如果这次获取失败，读取结果时会抛出该错误（取决于其[错误策略](../concepts/error-policy.md)），从而被
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) 捕获。

:::

## 示例 {#examples}

### 比特币价格（轮询） {#bitcoin-price-polling}

当使用了 `useLive` 的组件被渲染时，`getTicker` 会每隔 [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
毫秒获取一次。

:::react

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />

:::

:::react

### 暂停隐藏的标签页 {#pause-hidden-tabs}

让标签页在 [`<Activity>`](https://react.dev/reference/react/Activity) 中保持挂载。只有显示的标签页会轮询。

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

隐藏的标签页会保留其状态，但它的 Effect 会停止。如果没有其他组件订阅它的价格，轮询就会停止。显示时，
轮询会恢复。如果上次获取早于 [pollFrequency](/rest/api/RestEndpoint#pollfrequency)，
会立即获取。

隐藏的标签页仍会渲染，因此每个标签页都会在显示之前获取其价格。切换标签页时，价格会直接显示，不会出现加载
状态。

:::
