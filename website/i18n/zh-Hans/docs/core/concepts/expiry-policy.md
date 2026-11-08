---
title: 用声明式过期策略控制自动获取行为
sidebar_label: 过期策略
description: 数据何时处于新鲜、过时或无效状态，以及每种状态如何影响获取和渲染。
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ExpiryTimeline from '@site/src/components/ExpiryTimeline';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Endpoint 过期策略

默认情况下，Reactive Data Client 使用 [stale-while-revalidate](https://web.dev/stale-while-revalidate/)。当数据
可用时，组件会立即渲染它。如果数据足够旧，Data Client 会在后台重新获取它。

## 过期状态 {#expiry-status}

<ExpiryTimeline>

### 新鲜（Fresh） {#fresh}

数据足够新。Data Client 不会获取它。

### 过时（Stale） {#stale}

组件可以展示这些数据。当有组件需要它时，Data Client 会再次获取它。

### 无效（Invalid） {#invalid}

组件不能展示这些数据。需要它的组件会获取它:react[并挂起]:vue[
（在获取完成之前，[已挂载的组件会保留其数据](#invalidate)）]。如果没有组件需要这些
数据，则什么也不会发生。

</ExpiryTimeline>

[useSuspense()](../api/useSuspense.md) 会在挂载时以及参数变化时检查数据。如果
数据已过时，它就会发起获取。

::::react

:::info[React Native]

使用 React Navigation 时，[焦点事件](https://reactnavigation.org/docs/use-focus-effect/)也会为过时的数据触发获取。

:::

::::

## 过期时间 {#expiry-time}

### Endpoint.dataExpiryLength {#endpointdataexpirylength}

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) 用于设置数据保持“[新鲜](#fresh)”多少毫秒后
变为“[过时](#stale)”。把它设置为很小的数字，比如 `50`，可以让数据
几乎立即变为[过时](#stale)；设置为很大的数字，则可以让数据长时间保持新鲜。

在 'first' 和 'second' 之间切换会改变参数。在数据新鲜期间，
旧的时间会保持不变，不会重新获取。

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

在演示中，页面的数据一旦过时，页面就会挂起:react[（导航会在进度条上等待）]。
在数据新鲜期间，页面会展示它。

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

## 强制刷新 {#force-refresh}

要在展示旧数据的同时获取新数据：

### 某个特定的 endpoint {#a-specific-endpoint}

[Controller.fetch](../api/Controller.md#fetch) 会在组件展示之前数据的同时发起获取。即使
数据是“新鲜”的，它也会获取。

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

### 刷新可见的 endpoint {#refresh-visible-endpoints}

[Controller.expireAll()](../api/Controller.md#expireAll) 会把所有与 `testKey` 匹配的响应的[过期状态](#expiry-status)设置为[过时](#stale)。

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

## :react[使失效（重新挂起）]:vue[使失效] {#invalidate}

[endpoint](/rest/api/Endpoint) 和 [Entity](/rest/api/Entity) 都可以被设为失效。

:::vue

失效的数据总是会重新获取，即使它仍然新鲜。组件的 setup 一旦运行，Vue 就无法再次挂起该组件，
因此已挂载的组件会继续展示之前的数据，直到重新获取完成。
在此期间，[useCache()](../api/useCache.md) 返回 `undefined`，[useDLE()](../api/useDLE.md) 的 `loading`
为 `true`。在失效之后挂载的组件会挂起，直到新数据到达。

:::

### 某个特定的 endpoint {#invalidate-endpoint}

在这个示例中，[使 endpoint 失效](../api/Controller.md#invalidate):react[会显示加载 fallback，因为此时数据不允许展示]:vue[会重新获取它，即使其数据仍然新鲜]。

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

### 包含某个 Entity 的任意 endpoint {#invalidate-entity}

[Invalidate schema](/rest/api/Invalidate) 会让响应中包含该
[Entity](/rest/api/Entity) 的_每个_ endpoint 失效。如果 endpoint 在 [Array](/rest/api/Array) 中包含该 Entity，Data Client 会把它从
该 [Array](/rest/api/Array) 中移除。

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

[Controller.fetch()](../api/Controller.md#fetch) 会同时更新服务器和 store。如果只想修改 store，请使用
[Controller.setResponse()](../api/Controller.md#setResponse) 或 [Controller.set()](../api/Controller.md#set)。

#### 根据数据有条件地失效 {#conditional-invalidation-based-on-data}

如果只想对部分响应进行失效，请从 [Entity.process](/rest/api/Entity#process) 返回 `undefined`。

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
