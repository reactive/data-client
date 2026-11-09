---
title: useSubscription() - Actualización de datos que cambian con frecuencia en React
vue_title: useSubscription() - Actualización de datos que cambian con frecuencia en Vue
sidebar_label: useSubscription()
description: Mantiene los datos al día, pero solo cuando el componente está activo. Admite sondeo (polling), websockets y SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';

# useSubscription()

Ideal para mantener actualizados los recursos que cambian con frecuencia.

Al usar las [suscripciones de sondeo](./PollingSubscription) por defecto, la frecuencia debe establecerse en
[Endpoint](/rest/api/Endpoint); de lo contrario, no tendrá ningún efecto.

:::tip

[useLive()](./useLive.md) es una forma más concisa de usarlo en combinación con [useSuspense()](./useSuspense.md),

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

## Comportamiento {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

Al usar React Navigation, useSubscription() se suscribirá o cancelará la suscripción cuando la pantalla gane o pierda el foco, respectivamente.

:::

En un [`<Activity>`](https://react.dev/reference/react/Activity) oculto, `useSubscription()` cancela la suscripción.
Vuelve a suscribirse cuando se muestra. [Ejemplo](#pause-while-hidden)

::::

:::vue

La suscripción se crea cuando se configura el componente y se elimina cuando se desmonta. Cuando
cambia un argumento pasado como [ref](https://vuejs.org/api/reactivity-core.html#ref), la suscripción
anterior se elimina y se crea una nueva para los nuevos argumentos.

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

## Ejemplos {#examples}

### Suscribirse solo mientras el elemento es visible {#only-subscribe-while-element-is-visible}

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

Cuando se envía `null` como segundo argumento, la suscripción se desactiva. Por supuesto,
si otros componentes siguen suscritos, las actualizaciones de datos seguirán activas.

:::react

`useInView()` usa [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API),
que es muy eficiente. Hooks como [useIntersectionObserver()](https://usehooks.com/useintersectionobserver) hacen
lo mismo.

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/) de VueUse usa [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que es muy eficiente. Las [Template refs](https://vuejs.org/guide/essentials/template-refs.html) nos permiten
acceder al [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Pausar mientras está oculto {#pause-while-hidden}

Para ocultar un panel o una pestaña, envuélvelo en [`<Activity>`](https://react.dev/reference/react/Activity). `AssetPrice` no necesita
ningún cambio.

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

Un `<Activity>` oculto conserva `AssetPrice` y su estado, pero detiene sus Effects. Si ningún otro componente se suscribe al
precio, el sondeo se detiene. Cuando se muestra, el sondeo se reanuda. Si el último fetch es más antiguo que
[pollFrequency](/rest/api/RestEndpoint#pollfrequency), hace fetch de inmediato.

Un `<Activity>` oculto sigue renderizándose. Por eso `useSuspense()` obtiene el precio antes de que se abra el panel, y el panel se abre
sin estado de carga.

### Precios de criptomonedas (websockets) {#crypto-prices-websockets}

Implementamos nuestro propio `StreamManager` para manejar nuestro protocolo de websocket personalizado. Aquí escuchamos las [acciones
subscribe/unsubscribe](./Actions.md#subscribe) enviadas por `useSubscription` para asegurarnos de escuchar solo las actualizaciones de los componentes que se están renderizando.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
