---
title: useSubscription() - Actualización de datos que cambian con frecuencia en React
vue_title: useSubscription() - Actualización de datos que cambian con frecuencia en Vue
sidebar_label: useSubscription()
description: Mantiene los datos al día, pero solo cuando el componente está activo. Admite sondeo (polling), websockets y SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
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

## Comportamiento {#behavior}

<ConditionalDependencies hook="useSubscription" />

::::react

:::info[React Native]

Al usar React Navigation, useSubscription() se suscribirá o cancelará la suscripción cuando la pantalla gane o pierda el foco, respectivamente.

:::

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

Cuando se envía `null` como segundo argumento, la suscripción se desactiva. Por supuesto,
si otros componentes siguen suscritos, las actualizaciones de datos seguirán activas.

:::react

[useIntersectionObserver()](https://usehooks.com/useintersectionobserver) usa [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que es muy eficiente. [ref](https://react.dev/reference/react/useRef) nos permite
acceder al [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::vue

[useElementVisibility()](https://vueuse.org/core/useElementVisibility/) de VueUse usa [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), que es muy eficiente. Las [Template refs](https://vuejs.org/guide/essentials/template-refs.html) nos permiten
acceder al [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

:::

:::react

### Precios de criptomonedas (websockets) {#crypto-prices-websockets}

Implementamos nuestro propio `StreamManager` para manejar nuestro protocolo de websocket personalizado. Aquí escuchamos las [acciones
subscribe/unsubscribe](./Actions.md#subscribe) enviadas por `useSubscription` para asegurarnos de escuchar solo las actualizaciones de los componentes que se están renderizando.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />

:::
