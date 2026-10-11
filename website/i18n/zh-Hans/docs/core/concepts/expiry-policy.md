---
title: 用声明式过期策略控制自动获取行为
sidebar_label: 过期策略
description: 数据何时被视为新鲜、过时或无效，以及这些状态如何影响获取和渲染。
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Endpoint 过期策略

默认情况下，Reactive Data Client 的缓存策略可以描述为 [stale-while-revalidate](https://web.dev/stale-while-revalidate/)。
这意味着当数据可用时，它可以使用过时的数据，从而避免阻塞应用。不过在后台，
如果数据足够旧，它仍然会刷新数据。

## 过期状态 {#expiry-status}

### 新鲜（Fresh） {#fresh}

处于这种状态的数据被认为足够新，无需获取。

### 过时（Stale） {#stale}

数据仍然可以展示，但 Reactive Data Client 可能会尝试重新获取以重新验证。

[useSuspense()](../api/useSuspense.md) 会在挂载时以及参数变化时考虑是否获取。
在这些情况下，如果数据被视为过时，它就会发起获取。

::::react

:::info[React Native]

使用 React Navigation 时，[焦点事件](https://reactnavigation.org/docs/use-focus-effect/)也会为过时的数据触发获取。

:::

::::

### 无效（Invalid） {#invalid}

数据不应展示。任何需要这些数据的组件都会触发获取:react[并挂起]:vue[
（在获取完成之前，[已挂载的组件会保留其数据](#invalidate)）]。如果没有组件关心这些
数据，则不会执行任何操作。

## 过期时间 {#expiry-time}

### Endpoint.dataExpiryLength {#endpointdataexpirylength}

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) 用于设置数据从“[新鲜](#fresh)”状态转变为“[过时](#stale)”状态
所需的时间（毫秒）。试着把它设置为很小的数字，比如 '50'，
让数据几乎立即变为[过时](#stale)；或者设置为很大的数字，让数据保留很长时间。

在 'first' 和 'second' 之间切换会改变参数。如果数据仍被视为新鲜，
你会一直看到旧的时间，而不会发生任何刷新。

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

较长的缓存寿命

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

出错时从不重试

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

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) 去掉了“[过时](#stale)”状态，使得
过期的数据立即被视为“[无效](#invalid)”。

在演示中，组件的数据一旦过时，组件就会挂起。如果数据仍在
过期时间之内，组件就会继续展示它。

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

## 强制刷新 {#force-refresh}

有时我们想要获取新数据，同时继续展示旧的（过时的）数据。

### 某个特定的 endpoint {#a-specific-endpoint}

[Controller.fetch](../api/Controller#fetch) 可以用来触发获取，同时仍展示
之前的数据。即使数据是“新鲜”的，也可以这样做。

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

### 刷新可见的 endpoint {#refresh-visible-endpoints}

[Controller.expireAll()](../api/Controller.md#expireAll) 会把所有与 `testKey` 匹配的响应的[过期状态](#expiry-status)设置为[过时](#stale)。

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

## :react[使失效（重新挂起）]:vue[使失效] {#invalidate}

[endpoint](/rest/api/Endpoint) 和 [Entity](/rest/api/Entity) 都可以作为失效的目标。

:::vue

失效的数据总是会重新获取，即使它仍然新鲜。组件的 setup 一旦运行，Vue 就无法再次挂起该组件，
因此已挂载的组件会继续展示之前的数据，直到重新获取完成。
在此期间，[useCache()](../api/useCache.md) 返回 `undefined`，[useDLE()](../api/useDLE.md) 的 `loading`
为 `true`。在失效之后挂载的组件会挂起，直到新数据到达。

:::

### 某个特定的 endpoint {#invalidate-endpoint}

在这个示例中，[使 endpoint 失效](../api/Controller.md#invalidate):react[会显示加载 fallback，因为此时数据不允许展示]:vue[会重新获取它，即使其数据仍然新鲜]。

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

### 包含某个 Entity 的任意 endpoint {#invalidate-entity}

使用 [Invalidate schema](/rest/api/Invalidate)，我们可以让响应中依赖该 [Entity](/rest/api/Entity) 的_任意_ endpoint
失效。如果 endpoint 在 [Array](/rest/api/Array) 中使用了该 Entity，它只会被从该 [Array](/rest/api/Array) 中移除。

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

[Controller.fetch()](../api/Controller.md#fetch) 让我们可以同时更新服务器和 store。
当我们想直接修改本地 store 时，可以使用 [Controller.setResponse()](../api/Controller.md#setResponse) 或 [Controller.set()](../api/Controller.md#set)。

#### 根据数据有条件地失效 {#conditional-invalidation-based-on-data}

如果 `invalidation` 只应在某些情况下根据响应数据发生，我们可以
从 [Entity.process](/rest/api/Entity#process) 返回 `undefined`。

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