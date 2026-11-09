---
title: Control del comportamiento automático de fetch con políticas de caducidad declarativas
sidebar_label: Política de caducidad
description: Cuándo se considera que los datos están Fresh, Stale o Invalid, y cómo ese estado afecta al fetch y al renderizado.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ExpiryTimeline from '@site/src/components/ExpiryTimeline';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Política de caducidad de Endpoint

Por defecto, Reactive Data Client usa [stale-while-revalidate](https://web.dev/stale-while-revalidate/). Cuando hay datos
disponibles, los componentes los renderizan de inmediato. Si los datos son lo bastante antiguos, Data Client vuelve a obtenerlos en segundo plano.

## Estado de caducidad {#expiry-status}

<ExpiryTimeline>

### Fresh {#fresh}

Los datos son lo bastante recientes. Data Client no hace fetch de ellos.

### Stale {#stale}

Los componentes pueden mostrar los datos. Data Client vuelve a hacer fetch de ellos cuando un componente los necesita.

### Invalid {#invalid}

Los componentes no pueden mostrar los datos. Un componente que los necesita hace fetch:react[ y se suspende]:vue[
([los componentes montados conservan sus datos](#invalidate) hasta que se resuelva)]. Si ningún componente necesita los
datos, no ocurre nada.

</ExpiryTimeline>

[useSuspense()](../api/useSuspense.md) revisa los datos al montarse y cuando cambian sus parámetros. Hace fetch si los
datos están obsoletos.

::::react

:::info[React Native]

Al usar React Navigation, los [eventos de foco](https://reactnavigation.org/docs/use-focus-effect/) también desencadenan fetch de los datos obsoletos.

:::

::::

## Tiempo de caducidad {#expiry-time}

### Endpoint.dataExpiryLength {#endpointdataexpirylength}

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) establece cuántos milisegundos permanecen los datos
'[fresh](#fresh)' antes de pasar a '[stale](#stale)'. Establécelo en un número bajo, como `50`, para que los datos pasen a
[stale](#stale) casi de inmediato, o en un número grande para mantenerlos fresh durante mucho tiempo.

Alternar entre 'first' y 'second' cambia los parámetros. Mientras los datos están fresh,
la hora anterior se mantiene sin un nuevo fetch.

<FrameworkPlayground row defaultTab="getUpdated" fixtures={[
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

```tsx title="TimePage" route="/time/:id" start="/time/1"
import { useSuspense } from '@data-client/react';
import { getUpdated } from './getUpdated';

export default function TimePage({ id }: { id: string }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <>
      <h2>
        <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'medium' })}</time>
      </h2>
      <span className="meta">Fetched for page {id}</span>
    </>
  );
}
```

```tsx title="Navigator" layout collapsed docs-only
export default function Navigator({ children }) {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Server time</h1>
        <CurrentTime />
      </header>
      <nav>
        <Link to="/time/1">First</Link>
        <Link to="/time/2">Second</Link>
      </nav>
      {children}
    </>
  );
}
```

:::

:::vue

```html title="TimePage.vue" route="/time/:id" start="/time/1"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUpdated } from './getUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(getUpdated, () => ({ id: props.id }));
</script>

<template>
  <h2>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'medium' }) }}</time>
  </h2>
  <span class="meta">Fetched for page {{ id }}</span>
</template>
```

```html title="Navigator.vue" layout collapsed docs-only
<template>
  <header class="appHeader">
    <h1 class="appTitle">Server time</h1>
  </header>
  <nav>
    <RouterLink to="/time/1">First</RouterLink>
    <RouterLink to="/time/2">Second</RouterLink>
  </nav>
  <RouterView v-slot="{ Component, route }">
    <!-- :key remounts TimePage so it suspends for the new id -->
    <Suspense timeout="0">
      <component
        :is="Component"
        :key="route.fullPath"
        :id="route.params.id"
      />
      <template #fallback><Loading /></template>
    </Suspense>
  </RouterView>
</template>
```

:::

</FrameworkPlayground>

<details>
<summary><b>@data-client/rest</b></summary>

Tiempo de vida largo en la caché

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

Nunca reintentar en caso de error

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

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) elimina el estado '[stale](#stale)', de modo que los datos
que caducan se consideran '[invalid](#invalid)' de inmediato.

Esto se demuestra porque la página se suspende en cuanto sus datos pasan a stale:react[ (la navegación espera en la barra de progreso)].
Mientras los datos están fresh, la página los muestra.

<FrameworkPlayground row defaultTab="getUpdated" fixtures={[
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

```tsx title="TimePage" route="/time/:id" start="/time/1"
import { useSuspense } from '@data-client/react';
import { getUpdated } from './getUpdated';

export default function TimePage({ id }: { id: string }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <>
      <h2>
        <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'medium' })}</time>
      </h2>
      <span className="meta">Fetched for page {id}</span>
    </>
  );
}
```

```tsx title="Navigator" layout collapsed docs-only
export default function Navigator({ children }) {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Server time</h1>
        <CurrentTime />
      </header>
      <nav>
        <Link to="/time/1">First</Link>
        <Link to="/time/2">Second</Link>
      </nav>
      {children}
    </>
  );
}
```

:::

:::vue

```html title="TimePage.vue" route="/time/:id" start="/time/1"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getUpdated } from './getUpdated';

  const props = defineProps<{ id: string }>();
  const time = await useSuspense(getUpdated, () => ({ id: props.id }));
</script>

<template>
  <h2>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'medium' }) }}</time>
  </h2>
  <span class="meta">Fetched for page {{ id }}</span>
</template>
```

```html title="Navigator.vue" layout collapsed docs-only
<template>
  <header class="appHeader">
    <h1 class="appTitle">Server time</h1>
  </header>
  <nav>
    <RouterLink to="/time/1">First</RouterLink>
    <RouterLink to="/time/2">Second</RouterLink>
  </nav>
  <RouterView v-slot="{ Component, route }">
    <!-- :key remounts TimePage so it suspends for the new id -->
    <Suspense timeout="0">
      <component
        :is="Component"
        :key="route.fullPath"
        :id="route.params.id"
      />
      <template #fallback><Loading /></template>
    </Suspense>
  </RouterView>
</template>
```

:::

</FrameworkPlayground>

## Forzar la actualización {#force-refresh}

Para obtener datos nuevos mientras muestras los datos antiguos:

### Un endpoint específico {#a-specific-endpoint}

[Controller.fetch](../api/Controller.md#fetch) hace fetch mientras los componentes muestran los datos anteriores. Lo hace incluso
cuando los datos están 'fresh'.

<FrameworkPlayground row fixtures={[
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
    <>
      <div className="listItem">
        <span className="meta">API time</span>
        <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}</time>
      </div>
      <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
        Refresh
      </button>
    </>
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
  <div class="listItem">
    <span class="meta">API time</span>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
  <button @click="ctrl.fetch(lastUpdated, { id: '1' })">Refresh</button>
</template>
```

:::

</FrameworkPlayground>

### Actualizar los endpoints visibles {#refresh-visible-endpoints}

[Controller.expireAll()](../api/Controller.md#expireAll) establece en [Stale](#stale) el [estado de caducidad](#expiry-status) de todas las respuestas que coincidan con `testKey`.

<FrameworkPlayground row fixtures={[
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

```tsx title="TimeList" collapsed
import { AsyncBoundary, useSuspense } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

const ids = ['1', '2', '3'];

export default function TimeList() {
  return ids.map(id => (
    <AsyncBoundary key={id} fallback={<TimeSkeleton id={id} />}>
      <TimeRow id={id} />
    </AsyncBoundary>
  ));
}

function TimeRow({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <div className="listItem">
      <b>{id}</b>
      <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}</time>
    </div>
  );
}

function TimeSkeleton({ id }: { id: string }) {
  return (
    <div className="listItem">
      <b>{id}</b>
      <span className="skeleton" />
    </div>
  );
}
```

```tsx title="Demo"
import { useController } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';
import TimeList from './TimeList';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <TimeList />
      <div className="buttonGroup">
        <button onClick={() => ctrl.expireAll(lastUpdated)}>
          Expire All
        </button>
        <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
          Force Refresh First
        </button>
      </div>
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
  <div class="listItem">
    <b>{{ id }}</b>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="TimeList.vue" collapsed
<script setup lang="ts">
  import ShowTime from './ShowTime.vue';

  const ids = ['1', '2', '3'];
</script>

<template>
  <Suspense v-for="id in ids" :key="id">
    <ShowTime :id="id" />
    <template #fallback>
      <div class="listItem"><b>{{ id }}</b><span class="skeleton" /></div>
    </template>
  </Suspense>
</template>
```

```html title="Demo.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';
  import TimeList from './TimeList.vue';

  const ctrl = useController();
</script>

<template>
  <div>
    <TimeList />
    <div class="buttonGroup">
      <button @click="ctrl.expireAll(lastUpdated)">Expire All</button>
      <button @click="ctrl.fetch(lastUpdated, { id: '1' })">
        Force Refresh First
      </button>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

## :react[Invalidar (volver a suspender)]:vue[Invalidar] {#invalidate}

Tanto los [endpoints](/rest/api/Endpoint) como las [entities](/rest/api/Entity) pueden invalidarse.

:::vue

Los datos invalidados siempre se vuelven a obtener, incluso cuando están fresh. Vue no puede volver a suspender un componente una vez que su
setup se ha ejecutado, así que los componentes montados siguen mostrando sus datos anteriores hasta que se resuelva el nuevo fetch.
Mientras tanto, [useCache()](../api/useCache.md) devuelve `undefined` y el `loading` de [useDLE()](../api/useDLE.md)
es `true`. Los componentes montados después de la invalidación se suspenden hasta que llegan los datos nuevos.

:::

### Un endpoint específico {#invalidate-endpoint}

En este ejemplo, [invalidar el endpoint](../api/Controller.md#invalidate) :react[muestra el fallback de carga, ya que no se permite mostrar los datos]:vue[lo vuelve a obtener, aunque sus datos todavía estén fresh].

<FrameworkPlayground row fixtures={[
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

```tsx title="TimeList" collapsed
import { AsyncBoundary, useSuspense } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

const ids = ['1', '2', '3'];

export default function TimeList() {
  return ids.map(id => (
    <AsyncBoundary key={id} fallback={<TimeSkeleton id={id} />}>
      <TimeRow id={id} />
    </AsyncBoundary>
  ));
}

function TimeRow({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <div className="listItem">
      <b>{id}</b>
      <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'long' })}</time>
    </div>
  );
}

function TimeSkeleton({ id }: { id: string }) {
  return (
    <div className="listItem">
      <b>{id}</b>
      <span className="skeleton" />
    </div>
  );
}
```

```tsx title="Demo"
import { useController } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';
import TimeList from './TimeList';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <TimeList />
      <div className="buttonGroup">
        <button onClick={() => ctrl.invalidateAll(lastUpdated)}>
          Invalidate All
        </button>
        <button onClick={() => ctrl.invalidate(lastUpdated, { id: '1' })}>
          Invalidate First
        </button>
      </div>
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
  <div class="listItem">
    <b>{{ id }}</b>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="TimeList.vue" collapsed
<script setup lang="ts">
  import ShowTime from './ShowTime.vue';

  const ids = ['1', '2', '3'];
</script>

<template>
  <Suspense v-for="id in ids" :key="id">
    <ShowTime :id="id" />
    <template #fallback>
      <div class="listItem"><b>{{ id }}</b><span class="skeleton" /></div>
    </template>
  </Suspense>
</template>
```

```html title="Demo.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { lastUpdated } from './api/lastUpdated';
  import TimeList from './TimeList.vue';

  const ctrl = useController();
</script>

<template>
  <div>
    <TimeList />
    <div class="buttonGroup">
      <button @click="ctrl.invalidateAll(lastUpdated)">
        Invalidate All
      </button>
      <button @click="ctrl.invalidate(lastUpdated, { id: '1' })">
        Invalidate First
      </button>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

### Cualquier endpoint con una entity {#invalidate-entity}

El [schema Invalidate](/rest/api/Invalidate) invalida _todos_ los endpoints cuya respuesta incluye esa
[entity](/rest/api/Entity). Si el endpoint tiene la entity en un [Array](/rest/api/Array), Data Client la elimina de
ese [Array](/rest/api/Array).

<FrameworkPlayground row fixtures={[
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
import { Entity, Invalidate, RestEndpoint } from '@data-client/rest';
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

export const InvalidateTimedEntity = new Invalidate(TimedEntity);

export const deleteLastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  method: 'DELETE',
  schema: InvalidateTimedEntity,
});
```

:::react

```tsx title="ServerTime" collapsed
import { AsyncBoundary, useSuspense } from '@data-client/react';
import { lastUpdated } from './api/lastUpdated';

export default function ServerTime({ id }: { id: string }) {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Server time</h1>
        <CurrentTime />
      </header>
      <section>
        <AsyncBoundary
          fallback={
            <h2>
              <span className="skeleton" />
            </h2>
          }
        >
          <TimeReadout id={id} />
        </AsyncBoundary>
      </section>
    </>
  );
}

function TimeReadout({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <h2>
      <time>{updatedAt.toLocaleString('en-US', { timeStyle: 'medium' })}</time>
    </h2>
  );
}
```

```tsx title="ShowTime"
import { useController, useLoading } from '@data-client/react';
import {
  InvalidateTimedEntity,
  deleteLastUpdated,
} from './api/lastUpdated';
import ServerTime from './ServerTime';

function ShowTime() {
  const ctrl = useController();
  const [handleDelete, loadingDelete] = useLoading(
    () => ctrl.fetch(deleteLastUpdated, { id: '1' }),
    [],
  );
  return (
    <div>
      <ServerTime id="1" />
      <div className="buttonGroup">
        <button onClick={handleDelete} aria-busy={loadingDelete}>
          Invalidate
        </button>
        <button
          onClick={() =>
            ctrl.setResponse(deleteLastUpdated, { id: '1' }, { id: '1' })
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
  <h2>
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'medium' }) }}</time>
  </h2>
</template>
```

```html title="ServerTime.vue" collapsed
<script setup lang="ts">
  import TimePage from './TimePage.vue';

  defineProps<{ id: string }>();
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Server time</h1>
  </header>
  <section>
    <Suspense>
      <TimePage :id="id" />
      <template #fallback>
        <h2><span class="skeleton" /></h2>
      </template>
    </Suspense>
  </section>
</template>
```

```html title="ShowTime.vue"
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import {
    InvalidateTimedEntity,
    deleteLastUpdated,
  } from './api/lastUpdated';
  import ServerTime from './ServerTime.vue';

  const ctrl = useController();
  const [handleDelete, loadingDelete] = useLoading(() =>
    ctrl.fetch(deleteLastUpdated, { id: '1' }),
  );
</script>

<template>
  <div>
    <ServerTime id="1" />
    <div class="buttonGroup">
      <button @click="handleDelete" :aria-busy="loadingDelete">
        Invalidate
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
  </div>
</template>
```

:::

</FrameworkPlayground>

[Controller.fetch()](../api/Controller.md#fetch) actualiza el servidor y el store. Para cambiar solo el store, usa
[Controller.setResponse()](../api/Controller.md#setResponse) o [Controller.set()](../api/Controller.md#set).

#### Invalidación condicional según los datos {#conditional-invalidation-based-on-data}

Para invalidar solo en algunas respuestas, devuelve `undefined` desde [Entity.process](/rest/api/Entity#process).

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
