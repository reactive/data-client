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
  fetch(this: any, arg) {
    // fail once with FAKE_ERROR when it is set
    const error = this.FAKE_ERROR;
    this.FAKE_ERROR = undefined;
    return error ? Promise.reject(error) : lastUpdated(arg);
  },
  errorPolicy: error =>
    error.status >= 500 ? ('soft' as const) : ('hard' as const),
  FAKE_ERROR: undefined as Error | undefined,
});

export const createError = (status: number) =>
  Object.assign(new Error('fake error'), { status });
```

:::react

```tsx title="TimePage"
import { getUpdated } from './getUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API time:{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="ShowTime" collapsed
import { getUpdated, createError } from './getUpdated';
import TimePage from './TimePage';

function ShowTime() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id="1" />
      </AsyncBoundary>
      <div>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(500);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Soft
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(400);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Hard
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(500);
            ctrl.invalidate(getUpdated, { id: '1' });
          }}
        >
          Invalidate Soft
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(400);
            ctrl.invalidate(getUpdated, { id: '1' });
          }}
        >
          Invalidate Hard
        </button>
      </div>
    </div>
  );
}

render(
  <ResetableErrorBoundary>
    <ShowTime />
  </ResetableErrorBoundary>,
);
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
    API time:
    <time>{{ time.updatedAt.toLocaleString('en-US', { timeStyle: 'long' }) }}</time>
  </div>
</template>
```

```html title="ShowTime.vue" collapsed
<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue';
  import { useController } from '@data-client/vue';
  import { getUpdated, createError } from './getUpdated';
  import TimePage from './TimePage.vue';

  const ctrl = useController();
  const error = ref<Error | null>(null);
  onErrorCaptured(e => {
    error.value = e;
    return false;
  });

  const fail = (action: 'fetch' | 'invalidate', status: number) => {
    getUpdated.FAKE_ERROR = createError(status);
    ctrl[action](getUpdated, { id: '1' });
  };
</script>

<template>
  <div>
    <div v-if="error">
      {{ error.message }}
      <button @click="error = null">Reset</button>
    </div>
    <Suspense v-else>
      <TimePage id="1" />
      <template #fallback><div>loading...</div></template>
    </Suspense>
    <div>
      <button @click="fail('fetch', 500)">Fetch Soft</button>
      <button @click="fail('fetch', 400)">Fetch Hard</button>
      <button @click="fail('invalidate', 500)">Invalidate Soft</button>
      <button @click="fail('invalidate', 400)">Invalidate Hard</button>
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
