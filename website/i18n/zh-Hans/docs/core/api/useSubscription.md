---
title: useSubscription() - 在 React 中更新频繁变化的数据
vue_title: useSubscription() - 在 Vue 中更新频繁变化的数据
sidebar_label: useSubscription()
description: 保持数据最新，但仅在组件处于活跃状态时生效。支持轮询、websocket 和 SSE。
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
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

```typescript title="api/Price"
import { RestEndpoint, Entity } from '@data-client/rest';

export class Price extends Entity {
  symbol = '';
  price = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
}

export const getPrice = new RestEndpoint({
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

## 行为 {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

使用 React Navigation 时，useSubscription() 会分别在获得焦点/失去焦点时订阅/取消订阅。

:::

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

:::react

```tsx title="MasterPrice.tsx"
import { useIntersectionObserver } from '@uidotdev/usehooks';
import { useSuspense, useSubscription } from '@data-client/react';
import { getPrice } from 'api/Price';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(getPrice, { symbol });
  const [ref, entry] = useIntersectionObserver();
  // null params means don't subscribe
  useSubscription(getPrice, entry?.isIntersecting ? { symbol } : null);

  return <div ref={ref}>{price.price}</div>;
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

当第二个参数传入 `null` 时，订阅会被停用。当然，
如果还有其他组件在订阅，数据更新仍会继续。

:::react

[useIntersectionObserver()](https://usehooks.com/useintersectionobserver) 使用了性能非常好的 [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。[ref](https://react.dev/reference/react/useRef) 让
我们可以访问 [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)。

:::

:::vue

VueUse 的 [useElementVisibility()](https://vueuse.org/core/useElementVisibility/) 使用了性能非常好的 [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。[模板引用](https://vuejs.org/guide/essentials/template-refs.html)让
我们可以访问 [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)。

:::

:::react

### 加密货币价格（websocket） {#crypto-prices-websockets}

我们实现了自己的 `StreamManager` 来处理自定义的 websocket 协议。这里我们监听 `useSubscription` 发出的
[订阅/取消订阅 action](./Actions.md#subscribe)，以确保只监听已渲染组件所需的更新。

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
