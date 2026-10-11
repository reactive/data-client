---
title: Distinguindo erros de fetch recuperáveis no React
vue_title: Distinguindo erros de fetch recuperáveis no Vue
sidebar_label: Política de erros
description: Controlando como os erros afetam as estratégias de revalidação no Reactive Data Client.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SiteOnly from '@site/src/components/SiteOnly';
import {RestEndpoint} from '@data-client/rest';

# Política de erros do Endpoint

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) controla o comportamento do cache quando um fetch é rejeitado.
Ele usa o erro da rejeição para determinar se deve ser tratado como um erro 'soft' (leve) ou 'hard' (grave).

### Soft {#soft}

Erros soft continuam exibindo dados válidos, se existirem. No entanto, se não houver dados anteriores na store,
a promise será rejeitada com `error`. Nesse caso, [useSuspense()](../api/useSuspense.md) lança o
erro para ser capturado pelo :react[[ErrorBoundary](../api/ErrorBoundary.md) ou [AsyncBoundary](../api/AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] mais próximo

### Hard {#hard}

Erros hard sempre rejeitam com `error` - mesmo quando dados já haviam sido disponibilizados anteriormente.

'hard' | `undefined` podem ser usados para indicar este estado.

<SiteOnly>

:::react

Um erro soft continua exibindo os últimos dados. Erros hard (e erros soft sem nada para exibir) não são capturados, então a pré-visualização os mostra com **Reset preview** para recomeçar.

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

Como erros `500` indicam uma falha do servidor, queremos usar dados desatualizados
caso existam. Por outro lado, algo como um `4xx` indica 'erro do usuário', o que
significa que o erro indica algo sobre o fluxo da aplicação - por exemplo, quando um registro é excluído, resultando
em `404`. Manter o registro seria impreciso.

Como este é o comportamento típico de APIs REST, ele é a política padrão em [@data-client/rest](https://www.npmjs.com/package/@data-client/rest)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

`undefined` é outra forma de especificar um [erro hard](#hard)
