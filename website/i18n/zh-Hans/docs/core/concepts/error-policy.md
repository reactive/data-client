---
title: 在 React 中区分可恢复的获取错误
vue_title: 在 Vue 中区分可恢复的获取错误
sidebar_label: 错误策略
description: 控制错误如何影响 Reactive Data Client 中的重新验证策略。
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import SiteOnly from '@site/src/components/SiteOnly';
import {RestEndpoint} from '@data-client/rest';

# Endpoint 错误策略

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) 控制获取被拒绝（reject）时的缓存行为。
它根据拒绝时的错误来判断应将其视为“软”（soft）错误还是“硬”（hard）错误。

### 软错误 {#soft}

软错误发生时，如果存在有效数据，会继续显示这些数据。但如果 store 中没有之前的数据，
则会以 `error` 拒绝。这种情况下，[useSuspense()](../api/useSuspense.md) 会抛出该
错误，由最近的 :react[[ErrorBoundary](../api/ErrorBoundary.md) 或 [AsyncBoundary](../api/AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] 捕获

### 硬错误 {#hard}

硬错误总是以 `error` 拒绝——即使之前已经有可用的数据。

'hard' | `undefined` 都可以用来表示这种状态。

<SiteOnly>

:::react

软错误会继续显示上一次的数据。硬错误（以及没有数据可显示的软错误）不会被捕获，因此预览会显示这些错误，并提供 **Reset preview** 按钮以便重新开始。

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

### RestEndpoint 的策略 {#policy-for-restendpoint}

由于 `500` 表示服务器故障，如果存在过时数据，我们希望继续使用它。
另一方面，像 `4xx` 这样的状态码表示“用户错误”，
也就是说这个错误反映了应用流程上的某种情况——例如记录被删除，从而返回
`404`。此时继续保留该记录是不准确的。

由于这是 REST API 的典型行为，它也是 [@data-client/rest](https://www.npmjs.com/package/@data-client/rest) 的默认策略

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

`undefined` 是指定[硬错误](#hard)的另一种方式
