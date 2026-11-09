---
title: useLive() - Renderizar datos dinámicos en React
vue_title: useLive() - Renderizar datos dinámicos en Vue
sidebar_label: useLive()
description: Renderizado asíncrono de mutaciones de datos activadas de forma remota. useSuspense() + useSubscription() en un solo hook.
vue_description: Renderizado asíncrono de mutaciones de datos activadas de forma remota. useSuspense() + useSubscription() en un solo composable.
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

Renderizado asíncrono de mutaciones de datos activadas de forma remota.

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) en un solo :react[hook]:vue[composable].

`useLive()` reacciona a las [mutaciones](../getting-started/mutations.md) de datos; vuelve a renderizar solo cuando es necesario.

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

Al igual que [useSuspense()](./useSuspense.md), `useLive()` devuelve una Promise, por lo que se usa con `await` en
`<script setup>` y requiere un ancestro [Suspense](https://vuejs.org/guide/built-ins/suspense.html).
La suscripción se elimina automáticamente cuando el componente se desmonta.

:::

## Comportamiento {#behavior}

<ConditionalDependencies hook="useLive" />

::::react

:::info[React Native]

Al usar React Navigation, useLive() activará las peticiones al recibir el foco si los datos se consideran
obsoletos. useLive() también se suscribirá y cancelará la suscripción con el foco y la pérdida de foco, respectivamente.

:::

En un [`<Activity>`](https://react.dev/reference/react/Activity) oculto, `useLive()` cancela la suscripción. Vuelve a suscribirse
cuando se muestra. [Ejemplo](#pause-hidden-tabs)

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

El resultado se actualiza (y la suscripción se restablece) cuando cambian los argumentos.
Mientras se cargan los datos de los nuevos argumentos, el resultado conserva los datos anteriores en lugar de volverse `undefined`.
Si esa petición falla, leer el resultado lanza el error (según su [política de errores](../concepts/error-policy.md)), por lo que llega a
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Ejemplos {#examples}

### Precio de Bitcoin (sondeo) {#bitcoin-price-polling}

Cuando se renderiza nuestro componente con `useLive`, `getTicker` obtendrá los datos cada [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
milisegundos.

:::react

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />

:::

:::react

### Pausar las pestañas ocultas {#pause-hidden-tabs}

Mantén las pestañas montadas en [`<Activity>`](https://react.dev/reference/react/Activity). Solo la pestaña visible hace sondeo.

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

Una pestaña oculta conserva su estado, pero sus Effects se detienen. Si ningún otro componente se suscribe a su precio, el sondeo se detiene. Cuando
se muestra, el sondeo se reanuda. Si el último fetch es más antiguo que [pollFrequency](/rest/api/RestEndpoint#pollfrequency), hace
fetch de inmediato.

Las pestañas ocultas siguen renderizándose, así que cada pestaña obtiene su precio antes de mostrarse. Al cambiar de pestaña se muestra un precio sin estado
de carga.

:::
