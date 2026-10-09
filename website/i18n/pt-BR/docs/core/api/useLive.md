---
title: useLive() - Renderizando dados dinâmicos no React
vue_title: useLive() - Renderizando dados dinâmicos no Vue
sidebar_label: useLive()
description: Renderização assíncrona de mutações de dados disparadas remotamente. useSuspense() + useSubscription() em um único hook.
vue_description: Renderização assíncrona de mutações de dados disparadas remotamente. useSuspense() + useSubscription() em um único composable.
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
import VueArgs from '../shared/\_vueArgs.mdx';

# useLive()

Renderização assíncrona de mutações de dados disparadas remotamente.

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) em um único :react[hook]:vue[composable].

`useLive()` reage às [mutações](../getting-started/mutations.md) de dados, rerrenderizando apenas quando necessário.

## Uso {#usage}

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
  <div style="text-align: center">
    {{ productId }}
    <NumberFlow
      :value="ticker.price"
      :format="{ style: 'currency', currency: 'USD' }"
    />
  </div>
</template>
```

</FrameworkPlayground>

Assim como [useSuspense()](./useSuspense.md), `useLive()` retorna uma Promise, então é usado com `await` em
`<script setup>` e exige um ancestral [Suspense](https://vuejs.org/guide/built-ins/suspense.html).
A subscription é removida automaticamente quando o componente é desmontado.

:::

## Comportamento {#behavior}

<ConditionalDependencies hook="useLive" />

::::react

:::info[React Native]

Ao usar o React Navigation, useLive() dispara fetches ao receber foco se os dados forem considerados
desatualizados. useLive() também faz subscribe/unsubscribe com o foco/perda de foco, respectivamente.

:::

::::

## Tipos {#types}

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

O resultado é atualizado (e a subscription é restabelecida) quando os argumentos mudam.
Enquanto os dados para os novos argumentos carregam, o resultado mantém os dados anteriores em vez de se tornar `undefined`.
Se esse fetch falhar, a leitura do resultado lança o erro (conforme sua [política de erros](../concepts/error-policy.md)), que chega então a
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Exemplos {#examples}

### Preço do Bitcoin (polling) {#bitcoin-price-polling}

Quando nosso componente com `useLive` é renderizado, `getTicker` fará fetch a cada [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
milissegundos.

:::react

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />

:::
