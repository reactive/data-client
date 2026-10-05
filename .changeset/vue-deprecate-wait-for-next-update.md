---
'@data-client/vue': patch
---

`waitForNextUpdate()` from `renderDataCompose()` is deprecated

It gives up silently after 1 second, so a test could pass while the composable was still suspended. When the Promise
had already resolved, it waited the full second for nothing, and under `jest.useFakeTimers()` it could hang. Await the
result directly instead. After changing props or calling the controller, let Vue start the new fetch with `nextTick()`,
then wait for it with `allSettled()` and `nextTick()`.

#### Before

```ts
import { reactive } from 'vue';

const props = reactive({ id: 5 });
const { result, waitForNextUpdate } = await renderDataCompose(
  (props: { id: number }) =>
    useSuspense(ArticleResource.get, () => ({ id: props.id })),
  { props, resolverFixtures },
);
await waitForNextUpdate();
const article = await result;

props.id = 6;
await waitForNextUpdate();
```

#### After

```ts
import { nextTick, reactive } from 'vue';

const props = reactive({ id: 5 });
const { result, allSettled } = await renderDataCompose(
  (props: { id: number }) =>
    useSuspense(ArticleResource.get, () => ({ id: props.id })),
  { props, resolverFixtures },
);
const article = await result;

props.id = 6;
await nextTick();
await allSettled();
await nextTick();
```
