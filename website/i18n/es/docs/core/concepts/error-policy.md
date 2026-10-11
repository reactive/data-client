---
title: Distinguir errores de fetch recuperables en React
vue_title: Distinguir errores de fetch recuperables en Vue
sidebar_label: Política de errores
description: Controla cómo los errores afectan a las estrategias de revalidación en Reactive Data Client.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SiteOnly from '@site/src/components/SiteOnly';
import {RestEndpoint} from '@data-client/rest';

# Política de errores de Endpoint

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) controla el comportamiento de la caché cuando un fetch es rechazado.
Usa el error del rechazo para determinar si debe tratarse como un error 'soft' (suave) o 'hard' (duro).

### Soft {#soft}

Los errores soft siguen mostrando datos válidos si existen. Sin embargo, si no hay datos previos en el store,
se rechazará con `error`. En este caso [useSuspense()](../api/useSuspense.md) lanza el
error para que lo capture el :react[[ErrorBoundary](../api/ErrorBoundary.md) o [AsyncBoundary](../api/AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] más cercano

### Hard {#hard}

Los errores hard siempre se rechazan con `error`, incluso cuando antes ya había datos disponibles.

Tanto 'hard' como `undefined` se pueden usar para indicar este estado.

<SiteOnly>

:::react

Un error soft sigue mostrando los últimos datos. Los errores hard (y los soft sin nada que mostrar) quedan sin capturar, por lo que la vista previa los muestra con **Reset preview** para empezar de nuevo.

:::

</SiteOnly>

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';
import { Temporal } from 'temporal-polyfill';

export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
  errorPolicy: error =>
    error.status >= 500 ? ('soft' as const) : ('hard' as const),
});
```

:::react

```tsx title="TimePage"
import { useSuspense } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <div>
      API time:{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="ShowTime" collapsed
import { useController } from '@data-client/react';
import { Suspense } from 'react';
import { lastUpdated } from './api/lastUpdated';
import TimePage from './TimePage';

function ShowTime() {
  const ctrl = useController();
  // stores a rejected fetch, as if the server answered with `status`
  const fail = (status: number, invalidate = false) => {
    if (invalidate) ctrl.invalidate(lastUpdated, { id: '1' });
    ctrl.setError(
      lastUpdated,
      { id: '1' },
      Object.assign(new Error(`fake ${status} error`), { status }),
    );
  };
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <TimePage id="1" />
      </Suspense>
      <div>
        <button onClick={() => fail(500)}>Fail Soft</button>
        <button onClick={() => fail(400)}>Fail Hard</button>
        <button onClick={() => fail(500, true)}>Invalidate Soft</button>
        <button onClick={() => fail(400, true)}>Invalidate Hard</button>
      </div>
    </div>
  );
}

render(<ShowTime />);
```

:::

:::vue

```html title="TimePage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(lastUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    API time:
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="ShowTime.vue" collapsed
<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';
  import TimePage from './TimePage.vue';

  const ctrl = useController();
  const error = ref<Error | null>(null);
  onErrorCaptured(e => {
    error.value = e;
    return false;
  });

  // stores a rejected fetch, as if the server answered with `status`
  const fail = (status: number, invalidate = false) => {
    if (invalidate) ctrl.invalidate(lastUpdated, { id: '1' });
    ctrl.setError(
      lastUpdated,
      { id: '1' },
      Object.assign(new Error(`fake ${status} error`), { status }),
    );
  };
</script>

<template>
  <div>
    <div v-if="error">{{ error.message }}</div>
    <Suspense v-else>
      <TimePage id="1" />
      <template #fallback><div>loading...</div></template>
    </Suspense>
    <div>
      <button @click="fail(500)">Fail Soft</button>
      <button @click="fail(400)">Fail Hard</button>
      <button @click="fail(500, true)">Invalidate Soft</button>
      <button @click="fail(400, true)">Invalidate Hard</button>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Política para RestEndpoint {#policy-for-restendpoint}

Como los `500` indican un fallo del servidor, queremos usar datos obsoletos
si existen. En cambio, algo como un `4xx` indica un 'error del usuario', lo que
significa que el error señala algo sobre el flujo de la aplicación, por ejemplo, que un registro fue eliminado y por eso se obtiene
un `404`. Conservar el registro sería incorrecto.

Como este es el comportamiento típico de las APIs REST, es la política por defecto en [@data-client/rest](https://www.npmjs.com/package/@data-client/rest)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

`undefined` es otra forma de especificar un [error hard](#hard)
