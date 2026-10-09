---
title: useSubscription() - Atualizando mudanças frequentes de dados no React
vue_title: useSubscription() - Atualizando mudanças frequentes de dados no Vue
sidebar_label: useSubscription()
description: Mantém os dados atualizados, mas apenas enquanto o componente está ativo. Suporta polling, websockets e SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';

# useSubscription()

Ótimo para manter recursos atualizados quando eles mudam com frequência.

Ao usar as [assinaturas de polling](./PollingSubscription) padrão, a frequência deve ser definida no
[Endpoint](/rest/api/Endpoint); caso contrário, não terá nenhum efeito.

:::tip

[useLive()](./useLive.md) é uma forma mais concisa de usar em combinação com [useSuspense()](./useSuspense.md),

:::

## Uso {#usage}

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

## Comportamento {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

Ao usar o React Navigation, useSubscription() assina e cancela a assinatura quando a tela ganha e perde o foco, respectivamente.

:::

::::

:::vue

A assinatura é criada quando o componente é configurado e removida quando ele é desmontado. Quando
um argumento passado como [ref](https://vuejs.org/api/reactivity-core.html#ref) muda, a assinatura
anterior é removida e uma nova é criada para os novos argumentos.

:::

## Tipos {#types}

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

## Exemplos {#examples}

### Assinar apenas enquanto o elemento está visível {#only-subscribe-while-element-is-visible}

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

Quando `null` é enviado como segundo argumento, a assinatura é desativada. Claro que,
se outros componentes ainda estiverem inscritos, as atualizações dos dados continuarão ativas.

:::react

[useIntersectionObserver()](https://usehooks.com/useintersectionobserver) usa o [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que tem ótimo desempenho. O [ref](https://react.dev/reference/react/useRef) nos permite
acessar o [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/), do VueUse, usa o [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que tem ótimo desempenho. Os [template refs](https://vuejs.org/guide/essentials/template-refs.html) nos permitem
acessar o [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Preços de criptomoedas (websockets) {#crypto-prices-websockets}

Implementamos nosso próprio `StreamManager` para tratar nosso protocolo de websocket personalizado. Aqui escutamos as [actions de subscribe/unsubscribe](./Actions.md#subscribe)
enviadas pelo `useSubscription` para garantir que só escutemos atualizações dos componentes que estão renderizados.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
