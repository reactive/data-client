---
title: Distinguishing recoverable fetch errors in React
vue_title: Distinguishing recoverable fetch errors in Vue
sidebar_label: Error Policy
description: Controlling how errors affect revalidation strategies in Reactive Data Client.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SiteOnly from '@site/src/components/SiteOnly';
import {RestEndpoint} from '@data-client/rest';

# Endpoint Error Policy

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) controls cache behavior upon a fetch rejection.
It uses the rejection error to determine whether it should be treated as 'soft' or 'hard' error.

### Soft

Soft errors will continue showing valid data if it exists. However, if no previous data is in the store,
it will reject with `error`. In this case [useSuspense()](../api/useSuspense.md) throws the
error to be caught by the nearest :react[[ErrorBoundary](../api/ErrorBoundary.md) or [AsyncBoundary](../api/AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]

### Hard

Hard errors always reject with `error` - even when data has previously made available.

'hard' | `undefined` can both be used to indicate this state.

<SiteOnly>

:::react

Once an error shows, **Reset preview** (↻ in the preview header) starts the demo over with a fresh store.

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
import { AsyncBoundary, useController } from '@data-client/react';
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
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id="1" />
      </AsyncBoundary>
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

### Policy for RestEndpoint

Since `500`s indicate a failure of the server, we want to use stale data
if it exists. On the other hand, something like a `4xx` indicates 'user error', which
means the error indicates something about application flow - like if a record is deleted, resulting
in `404`. Keeping the record around would be inaccurate.

Since this is the typical behavior for REST APIs, this is the default policy in [@data-client/rest](https://www.npmjs.com/package/@data-client/rest)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

`undefined` is another way of specifying a [hard error](#hard)
