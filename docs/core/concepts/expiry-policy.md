---
title: Controlling automatic fetch behavior with declarative Expiry Policies
sidebar_label: Expiry Policy
description: When data is Fresh, Stale, or Invalid, and how each state affects fetching and rendering.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ExpiryTimeline from '@site/src/components/ExpiryTimeline';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';

# Endpoint Expiry Policy

By default, Reactive Data Client uses [stale-while-revalidate](https://web.dev/stale-while-revalidate/). When data is
available, components render it immediately. If the data is old enough, Data Client refetches it in the background.

## Expiry status

<ExpiryTimeline>

### Fresh

The data is new enough. Data Client does not fetch it.

### Stale

Components can show the data. Data Client fetches it again when a component needs it.

### Invalid

Components cannot show the data. A component that needs it fetches it:react[ and suspends]:vue[
([mounted components keep their data](#invalidate) until it resolves)]. If no component needs the
data, nothing happens.

</ExpiryTimeline>

[useSuspense()](../api/useSuspense.md) checks the data on mount and when its parameters change. It fetches if the
data is stale.

::::react

:::info[React Native]

When using React Navigation, [focus events](https://reactnavigation.org/docs/use-focus-effect/) also trigger fetches for stale data.

:::

::::

## Expiry Time

### Endpoint.dataExpiryLength

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) sets how many milliseconds data stays
'[fresh](#fresh)' before it becomes '[stale](#stale)'. Set it to a low number like `50` to make data
[stale](#stale) almost immediately, or to a large number to keep it fresh for a long time.

Toggling between 'first' and 'second' changes the parameters. While the data is fresh,
the old time stays without a refetch.

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

Long cache lifetime

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

Never retry on error

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

### Endpoint.invalidIfStale

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) eliminates the '[stale](#stale)' status, making data
that expires immediately be considered '[invalid](#invalid)'.

This is demonstrated by the page suspending once its data goes stale:react[ (navigation waits on the progress bar)].
While the data is fresh, the page shows it.

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

## Force refresh

To fetch new data while you show the old data:

### A specific endpoint

[Controller.fetch](../api/Controller.md#fetch) fetches while components show the previous data. It fetches even
when the data is 'fresh'.

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

### Refresh visible endpoints

[Controller.expireAll()](../api/Controller.md#expireAll) sets all responses' [expiry status](#expiry-status) matching `testKey` to [Stale](#stale).

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

## :react[Invalidate (re-suspend)]:vue[Invalidate] {#invalidate}

Both [endpoints](/rest/api/Endpoint) and [entities](/rest/api/Entity) can be invalidated.

:::vue

Invalidated data always refetches, even when it is fresh. Vue can't suspend a component again once its
setup has run, so mounted components keep showing their previous data until the refetch resolves.
Meanwhile [useCache()](../api/useCache.md) returns `undefined` and [useDLE()](../api/useDLE.md)'s `loading`
is `true`. Components mounted after invalidation suspend until the new data arrives.

:::

### A specific endpoint {#invalidate-endpoint}

In this example [invalidating the endpoint](../api/Controller.md#invalidate) :react[shows the loading fallback since the data is not allowed to be displayed]:vue[refetches it, even though its data is still fresh].

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

### Any endpoint with an entity {#invalidate-entity}

The [Invalidate schema](/rest/api/Invalidate) invalidates _every_ endpoint whose response includes that
[entity](/rest/api/Entity). If the endpoint has the entity in an [Array](/rest/api/Array), Data Client removes it from
that [Array](/rest/api/Array).

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

[Controller.fetch()](../api/Controller.md#fetch) updates the server and the store. To change only the store, use
[Controller.setResponse()](../api/Controller.md#setResponse) or [Controller.set()](../api/Controller.md#set).

#### Conditional Invalidation based on data

To invalidate only for some responses, return `undefined` from [Entity.process](/rest/api/Entity#process).

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
