---
title: Controlando o comportamento automático de fetch com Políticas de Expiração declarativas
sidebar_label: Política de expiração
description: Quando os dados são considerados Fresh, Stale ou Invalid, e como esse estado afeta o fetch e a renderização.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Política de expiração do Endpoint

Por padrão, a política de cache do Reactive Data Client pode ser descrita como [stale-while-revalidate](https://web.dev/stale-while-revalidate/).
Isso significa que, quando há dados disponíveis, é possível evitar bloquear a aplicação usando os dados desatualizados. No entanto, em segundo plano,
ele ainda atualizará os dados se forem antigos o suficiente.

## Status de expiração {#expiry-status}

### Fresh {#fresh}

Dados nesse estado são considerados novos o suficiente para que não precisem de fetch.

### Stale {#stale}

Os dados ainda podem ser exibidos, porém o Reactive Data Client pode tentar revalidá-los fazendo fetch novamente.

[useSuspense()](../api/useSuspense.md) considera fazer fetch na montagem, bem como quando seus parâmetros mudam.
Nesses casos, ele fará o fetch se os dados forem considerados desatualizados.

::::react

:::info[React Native]

Ao usar o React Navigation, [eventos de foco](https://reactnavigation.org/docs/use-focus-effect/) também disparam fetches para dados desatualizados.

:::

::::

### Invalid {#invalid}

Os dados não devem ser exibidos. Qualquer componente que precise desses dados disparará o fetch:react[ e o suspense]:vue[
([componentes montados mantêm seus dados](#invalidate) até que ele seja resolvido)]. Se nenhum componente se importar com esses
dados, nenhuma ação será tomada.

## Tempo de expiração {#expiry-time}

### Endpoint.dataExpiryLength {#endpointdataexpirylength}

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) define quanto tempo (em milissegundos) leva para os dados
passarem do status '[fresh](#fresh)' para '[stale](#stale)'. Experimente definir um número bem baixo, como '50',
para que fiquem [stale](#stale) quase instantaneamente; ou um número muito grande para que permaneçam por muito tempo.

Alternar entre 'first' e 'second' muda os parâmetros. Se os dados ainda forem considerados fresh,
você continuará vendo o horário antigo, sem nenhuma atualização.

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
});
```

```ts title="getUpdated"
import { lastUpdated } from './api/lastUpdated';

export const getUpdated = lastUpdated.extend({ dataExpiryLength: 10000 });
```

:::react

```tsx title="TimePage"
import { useSuspense } from '@data-client/react';
import { getUpdated } from './getUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="Navigator" collapsed
import React from 'react';
import { AsyncBoundary } from '@data-client/react';
import TimePage from './TimePage';

function Navigator() {
  const [id, setId] = React.useState('1');
  const handleChange = e => setId(e.currentTarget.value);
  return (
    <div>
      <div>
        <button value="1" onClick={handleChange}>
          First
        </button>
        <button value="2" onClick={handleChange}>
          Second
        </button>
      </div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id={id} />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<Navigator />);
```

:::

:::vue

```html title="TimePage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUpdated } from './getUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(getUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    API time for {{ id }}:
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="Navigator.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import TimePage from './TimePage.vue';

  const id = ref('1');
</script>

<template>
  <div>
    <div>
      <button @click="id = '1'">First</button>
      <button @click="id = '2'">Second</button>
    </div>
    <!-- :key remounts TimePage so it suspends for the new id -->
    <Suspense timeout="0">
      <TimePage :key="id" :id="id" />
      <template #fallback><div>loading...</div></template>
    </Suspense>
  </div>
</template>
```

:::

</FrameworkPlayground>

<details>
<summary><b>@data-client/rest</b></summary>

Longa duração de cache

```typescript title="LongLivingResource.ts"
import {
  RestEndpoint,
  RestGenerics,
  resource,
} from '@data-client/rest';

// We can now use LongLivingEndpoint to create endpoints that will be cached for one hour
class LongLivingEndpoint<
  O extends RestGenerics,
> extends RestEndpoint<O> {
  dataExpiryLength = 60 * 60 * 1000; // one hour
}

const LongLivingResource = resource({
  path: '/:id',
  Endpoint: LongLivingEndpoint,
});
```

Nunca tentar novamente em caso de erro

```typescript title="NoRetryResource.ts"
import {
  RestEndpoint,
  RestGenerics,
  resource,
} from '@data-client/rest';

// We can now use NoRetryEndpoint to create endpoints that will be cached for one hour
class NoRetryEndpoint<
  O extends RestGenerics,
> extends RestEndpoint<O> {
  errorExpiryLength = Infinity;
}

const NoRetryResource = resource({
  path: '/:id',
  Endpoint: NoRetryEndpoint,
});
```

</details>

### Endpoint.invalidIfStale {#endpointinvalidifstale}

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) elimina o status '[stale](#stale)', fazendo com que dados
que expiram sejam imediatamente considerados '[invalid](#invalid)'.

Isso é demonstrado pelo componente que suspende assim que seus dados ficam stale. Se os dados ainda estiverem
dentro do tempo de expiração, ele simplesmente continua a exibi-los.

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
});
```

```ts title="getUpdated"
import { lastUpdated } from './api/lastUpdated';

export const getUpdated = lastUpdated.extend({
  invalidIfStale: true,
  dataExpiryLength: 5000,
});
```

:::react

```tsx title="TimePage"
import { useSuspense } from '@data-client/react';
import { getUpdated } from './getUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="Navigator" collapsed
import React from 'react';
import { AsyncBoundary } from '@data-client/react';
import TimePage from './TimePage';

function Navigator() {
  const [id, setId] = React.useState('1');
  const handleChange = e => setId(e.currentTarget.value);
  return (
    <div>
      <div>
        <button value="1" onClick={handleChange}>
          First
        </button>
        <button value="2" onClick={handleChange}>
          Second
        </button>
      </div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id={id} />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<Navigator />);
```

:::

:::vue

```html title="TimePage.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUpdated } from './getUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(getUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    API time for {{ id }}:
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="Navigator.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import TimePage from './TimePage.vue';

  const id = ref('1');
</script>

<template>
  <div>
    <div>
      <button @click="id = '1'">First</button>
      <button @click="id = '2'">Second</button>
    </div>
    <!-- :key remounts TimePage so it suspends for the new id -->
    <Suspense timeout="0">
      <TimePage :key="id" :id="id" />
      <template #fallback><div>loading...</div></template>
    </Suspense>
  </div>
</template>
```

:::

</FrameworkPlayground>

## Forçar atualização {#force-refresh}

Às vezes queremos buscar dados novos, continuando a mostrar os dados antigos (stale).

### Um endpoint específico {#a-specific-endpoint}

[Controller.fetch](../api/Controller#fetch) pode ser usado para disparar um fetch enquanto ainda se mostram
os dados anteriores. Isso pode ser feito mesmo com dados 'fresh'.

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
});
```

:::react

```tsx title="ShowTime"
import { useSuspense, useController } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

function ShowTime() {
  const { updatedAt } = useSuspense(lastUpdated, { id: '1' });
  const ctrl = useController();
  return (
    <div>
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>{' '}
      <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
        Refresh
      </button>
    </div>
  );
}
render(<ShowTime />);
```

:::

:::vue

```html title="ShowTime.vue"
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';

  const time = await useSuspense(lastUpdated, { id: '1' });
  const ctrl = useController();
</script>

<template>
  <div>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
    <button @click="ctrl.fetch(lastUpdated, { id: '1' })">Refresh</button>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Atualizar endpoints visíveis {#refresh-visible-endpoints}

[Controller.expireAll()](../api/Controller.md#expireAll) define o [status de expiração](#expiry-status) de todas as respostas que correspondem a `testKey` como [Stale](#stale).

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
});
```

:::react

```tsx title="ShowTime" collapsed
import { useSuspense, useController } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

export default function ShowTime({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  const ctrl = useController();
  return (
    <div>
      <b>{id}</b>{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="Loading" collapsed
export default function Loading({ id }: { id: string }) {
  return <div>{id} Loading...</div>;
}
```

```tsx title="Demo"
import { AsyncBoundary, useController } from '@data-client/react';

import { lastUpdated } from './api/lastUpdated';
import ShowTime from './ShowTime';
import Loading from './Loading';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<Loading id="1" />}>
        <ShowTime id="1" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="2" />}>
        <ShowTime id="2" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="3" />}>
        <ShowTime id="3" />
      </AsyncBoundary>

      <button onClick={() => ctrl.expireAll(lastUpdated)}>
        Expire All
      </button>
      <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
        Force Refresh First
      </button>
    </div>
  );
}
render(<Demo />);
```

:::

:::vue

```html title="ShowTime.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(lastUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    <b>{{ id }}</b> <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="Demo.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';
  import ShowTime from './ShowTime.vue';

  const ctrl = useController();
</script>

<template>
  <div>
    <Suspense v-for="id in ['1', '2', '3']" :key="id">
      <ShowTime :id="id" />
      <template #fallback><div>{{ id }} Loading...</div></template>
    </Suspense>

    <button @click="ctrl.expireAll(lastUpdated)">Expire All</button>
    <button @click="ctrl.fetch(lastUpdated, { id: '1' })">
      Force Refresh First
    </button>
  </div>
</template>
```

:::

</FrameworkPlayground>

## :react[Invalidate (suspender novamente)]:vue[Invalidate] {#invalidate}

Tanto [endpoints](/rest/api/Endpoint) quanto [entities](/rest/api/Entity) podem ser alvos de invalidação.

:::vue

Dados invalidados sempre fazem refetch, mesmo quando estão fresh. O Vue não consegue suspender um componente novamente depois que seu
setup foi executado, então componentes montados continuam mostrando os dados anteriores até que o refetch seja resolvido.
Enquanto isso, [useCache()](../api/useCache.md) retorna `undefined` e o `loading` de [useDLE()](../api/useDLE.md)
é `true`. Componentes montados após a invalidação suspendem até que os novos dados cheguem.

:::

### Um endpoint específico {#invalidate-endpoint}

Neste exemplo, [invalidar o endpoint](../api/Controller.md#invalidate) :react[exibe o fallback de carregamento, já que os dados não podem ser exibidos]:vue[faz o refetch dele, mesmo que seus dados ainda estejam fresh].

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
});
```

:::react

```tsx title="ShowTime" collapsed
import { useSuspense, useController } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

export default function ShowTime({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  const ctrl = useController();
  return (
    <div>
      <b>{id}</b>{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="Loading" collapsed
export default function Loading({ id }: { id: string }) {
  return <div>{id} Loading...</div>;
}
```

```tsx title="Demo"
import { AsyncBoundary, useController } from '@data-client/react';

import { lastUpdated } from './api/lastUpdated';
import ShowTime from './ShowTime';
import Loading from './Loading';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<Loading id="1" />}>
        <ShowTime id="1" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="2" />}>
        <ShowTime id="2" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="3" />}>
        <ShowTime id="3" />
      </AsyncBoundary>

      <button onClick={() => ctrl.invalidateAll(lastUpdated)}>
        Invalidate All
      </button>
      <button
        onClick={() => ctrl.invalidate(lastUpdated, { id: '1' })}
      >
        Invalidate First
      </button>
    </div>
  );
}
render(<Demo />);
```

:::

:::vue

```html title="ShowTime.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(lastUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    <b>{{ id }}</b> <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="Demo.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';
  import ShowTime from './ShowTime.vue';

  const ctrl = useController();
</script>

<template>
  <div>
    <Suspense v-for="id in ['1', '2', '3']" :key="id">
      <ShowTime :id="id" />
      <template #fallback><div>{{ id }} Loading...</div></template>
    </Suspense>

    <button @click="ctrl.invalidateAll(lastUpdated)">Invalidate All</button>
    <button @click="ctrl.invalidate(lastUpdated, { id: '1' })">
      Invalidate First
    </button>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Qualquer endpoint com uma entity {#invalidate-entity}

Usar o [schema Invalidate](/rest/api/Invalidate) nos permite invalidar _qualquer_ endpoint que dependa dessa [entity](/rest/api/Entity) em sua
resposta. Se o endpoint usa a entity em um [Array](/rest/api/Array), ela simplesmente será removida desse [Array](/rest/api/Array).

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
delay: () => 200,
},
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
method: 'DELETE',
}),
response({ id }) {
return {id}
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
});
```

:::react

```tsx title="TimePage" collapsed
import { useSuspense } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}
      </time>
    </div>
  );
}
```

```tsx title="ShowTime"
import { Invalidate, RestEndpoint } from '@data-client/rest';
import { AsyncBoundary, useController, useLoading } from '@data-client/react';
import { TimedEntity } from './api/lastUpdated';
import TimePage from './TimePage';

const InvalidateTimedEntity = new Invalidate(TimedEntity);
export const deleteLastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  method: 'DELETE',
  schema: InvalidateTimedEntity,
});

function ShowTime() {
  const ctrl = useController();
  const [handleDelete, loadingDelete] = useLoading(
    () => ctrl.fetch(deleteLastUpdated, { id: '1' }),
    [],
  );
  return (
    <div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id="1" />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
      <button onClick={handleDelete}>
        {loadingDelete ? 'loading...' : 'Invalidate'}
      </button>
      <button
        onClick={() =>
          ctrl.setResponse(
            deleteLastUpdated,
            { id: '1' },
            { id: '1' },
          )
        }
      >
        Invalidate (without fetching DELETE)
      </button>
      <button
        onClick={() => ctrl.set([InvalidateTimedEntity], [{ id: '1' }])}
      >
        Invalidate Entity with ctrl.set
      </button>
    </div>
  );
}
render(<ShowTime />);
```

:::

:::vue

```html title="TimePage.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(lastUpdated, () => ({ id: props.id }));
</script>

<template>
  <div>
    API time for {{ id }}:
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="ShowTime.vue"
<script setup lang="ts">
  import { Invalidate, RestEndpoint } from '@data-client/rest';
  import { useController, useLoading } from '@data-client/vue';
  import { TimedEntity } from './api/lastUpdated';
  import TimePage from './TimePage.vue';

  const InvalidateTimedEntity = new Invalidate(TimedEntity);
  const deleteLastUpdated = new RestEndpoint({
    path: '/api/currentTime/:id',
    method: 'DELETE',
    schema: InvalidateTimedEntity,
  });

  const ctrl = useController();
  const [handleDelete, loadingDelete] = useLoading(() =>
    ctrl.fetch(deleteLastUpdated, { id: '1' }),
  );
</script>

<template>
  <div>
    <Suspense>
      <TimePage id="1" />
      <template #fallback><div>loading...</div></template>
    </Suspense>
    <button @click="handleDelete">
      {{ loadingDelete ? 'loading...' : 'Invalidate' }}
    </button>
    <button
      @click="ctrl.setResponse(deleteLastUpdated, { id: '1' }, { id: '1' })"
    >
      Invalidate (without fetching DELETE)
    </button>
    <button @click="ctrl.set([InvalidateTimedEntity], [{ id: '1' }])">
      Invalidate Entity with ctrl.set
    </button>
  </div>
</template>
```

:::

</FrameworkPlayground>

[Controller.fetch()](../api/Controller.md#fetch) nos permite atualizar o servidor e o store.
Podemos usar [Controller.setResponse()](../api/Controller.md#setResponse) ou [Controller.set()](../api/Controller.md#set)
quando queremos alterar diretamente o store local.

#### Invalidação condicional com base nos dados {#conditional-invalidation-based-on-data}

Se a `invalidation` deve acontecer apenas às vezes, com base nos dados da resposta, podemos 
retornar `undefined` de [Entity.process](/rest/api/Entity#process).

```ts
class PriceLevel extends Entity {
  price = 0;
  amount = 0;

  pk() {
    return this.price;
  }

  static process(
    input: [number, number],
    parent: any,
    key: string | undefined,
  ): any {
    const [price, amount] = input;
    // highlight-next-line
    if (amount === 0) return undefined;
    return { price, amount };
  }
}
```