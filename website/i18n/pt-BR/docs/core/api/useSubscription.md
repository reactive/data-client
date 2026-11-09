---
title: useSubscription() - Atualizando mudanças frequentes de dados no React
vue_title: useSubscription() - Atualizando mudanças frequentes de dados no Vue
sidebar_label: useSubscription()
description: Mantém os dados atualizados, mas apenas enquanto o componente está ativo. Suporta polling, websockets e SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import HooksPlayground from '@site/src/components/HooksPlayground';
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

## Comportamento {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

Ao usar o React Navigation, useSubscription() assina e cancela a assinatura quando a tela ganha e perde o foco, respectivamente.

:::

Em um [`<Activity>`](https://react.dev/reference/react/Activity) oculto, `useSubscription()` cancela a assinatura. Ele
assina novamente quando é exibido. [Exemplo](#pause-while-hidden)

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

Quando `null` é enviado como segundo argumento, a assinatura é desativada. Claro que,
se outros componentes ainda estiverem inscritos, as atualizações dos dados continuarão ativas.

:::react

`useInView()` usa o [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API),
que tem ótimo desempenho. Hooks como [useIntersectionObserver()](https://usehooks.com/useintersectionobserver) fazem
o mesmo.

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/), do VueUse, usa o [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que tem ótimo desempenho. As [template refs](https://vuejs.org/guide/essentials/template-refs.html) nos permitem
acessar o [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Pausar enquanto oculto {#pause-while-hidden}

Para ocultar um painel ou uma aba, envolva-o em [`<Activity>`](https://react.dev/reference/react/Activity). `AssetPrice` não
precisa de nenhuma mudança.

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

Um `<Activity>` oculto mantém `AssetPrice` e seu estado, mas interrompe seus Effects. Se nenhum outro componente assinar o
preço, o polling para. Quando é exibido, o polling é retomado. Se o último fetch for mais antigo que
[pollFrequency](/rest/api/RestEndpoint#pollfrequency), ele faz fetch imediatamente.

Um `<Activity>` oculto ainda renderiza. Então `useSuspense()` busca o preço antes de o painel abrir, e o painel abre
sem estado de carregamento.

### Preços de criptomoedas (websockets) {#crypto-prices-websockets}

Implementamos nosso próprio `StreamManager` para tratar nosso protocolo de websocket personalizado. Aqui escutamos as [actions de subscribe/unsubscribe](./Actions.md#subscribe)
enviadas pelo `useSubscription` para garantir que só escutemos atualizações dos componentes que estão renderizados.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
