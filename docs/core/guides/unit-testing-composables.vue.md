---
title: Unit testing composables
framework_equivalent: guides/unit-testing-hooks
---

Composables pull data logic out of components, so they are often the easiest place to test it.
`renderDataCompose()` from `@data-client/vue/test` runs a composable inside a component mounted
with [DataClientPlugin](../api/DataClientPlugin.md) and [Fixtures](../api/Fixtures.md).
It takes the same [options](./unit-testing-components.md#options) and needs the same
[setup](./unit-testing-components.md#setup) as [mountDataClient()](./unit-testing-components.md).

## renderDataCompose()

`renderDataCompose()` is async; `await` it before reading `result`, which is whatever the
composable returned. [useQuery()](../api/useQuery.md) and [useCache()](../api/useCache.md) return a
`ComputedRef`, so their data is in `result.value`:

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { useQuery } from '@data-client/vue';
import { Article, ArticleResource } from './resources';

it('useQuery() returns cached data', async () => {
  const { result, cleanup } = await renderDataCompose(
    () => useQuery(Article, { id: 5 }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { id: 5, title: 'hi ho', content: 'whatever' },
        },
      ],
    },
  );

  expect(result.value?.title).toBe('hi ho');
  cleanup();
});
```

Always call `cleanup()` at the end of a test; it unmounts the app and its managers.

### useSuspense()

[useSuspense()](../api/useSuspense.md) returns a Promise that resolves to a `ComputedRef` once the
data is available. `await` it once, then read `.value`; the ref stays reactive as the store changes.

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { nextTick } from 'vue';
import { ArticleResource } from './resources';

it('useSuspense() follows store updates', async () => {
  const { result, controller, cleanup } = await renderDataCompose(
    () => useSuspense(ArticleResource.get, { id: 5 }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { id: 5, title: 'hi ho', content: 'whatever' },
        },
      ],
    },
  );

  const article = await result;
  expect(article.value.title).toBe('hi ho');

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );
  await nextTick();
  expect(article.value.title).toBe('updated');

  cleanup();
});
```

Add `error: true` to a fixture to test failures; the Promise then rejects with that error:

```typescript
it('rejects on a failed fetch', async () => {
  const { result, cleanup } = await renderDataCompose(
    () => useSuspense(ArticleResource.get, { id: 5 }),
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { status: 404 },
          error: true,
        },
      ],
    },
  );

  await expect(result).rejects.toMatchObject({ status: 404 });
  cleanup();
});
```

### Changing props

The composable receives `props`. Pass a `reactive()` object, and hand the composable a getter or
`computed()` built from it so it follows changes:

```typescript
import { reactive } from 'vue';

it('follows prop changes', async () => {
  const props = reactive({ id: 1 });
  const { result, cleanup } = await renderDataCompose(
    (props: { id: number }) => useQuery(Article, () => ({ id: props.id })),
    {
      props,
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 1 }],
          response: { id: 1, title: 'First', content: '' },
        },
        {
          endpoint: ArticleResource.get,
          args: [{ id: 2 }],
          response: { id: 2, title: 'Second', content: '' },
        },
      ],
    },
  );
  expect(result.value?.title).toBe('First');

  props.id = 2;
  await nextTick();
  expect(result.value?.title).toBe('Second');

  cleanup();
});
```

### Mutations

The returned `controller` is the app's [Controller](../api/Controller.md). After a mutation,
`await` it and then `nextTick()` before checking the result:

```typescript
it('push() adds to the list', async () => {
  const { result, controller, cleanup } = await renderDataCompose(
    () => useQuery(ArticleResource.getList.schema),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.getList,
          args: [],
          response: [{ id: 1, title: 'First', content: '' }],
        },
      ],
      resolverFixtures: [
        { endpoint: ArticleResource.getList.push, response: body => body },
      ],
    },
  );
  expect(result.value).toHaveLength(1);

  await controller.fetch(ArticleResource.getList.push, {
    id: 2,
    title: 'Second',
    content: '',
  });
  await nextTick();
  expect(result.value).toHaveLength(2);

  cleanup();
});
```

## API

### renderDataCompose(composable, options?) {#renderdatacompose-api}

Resolves, once the composable has run, to the same `controller`, `wrapper`, `cleanup()` and
`allSettled()` as [mountDataClient()](./unit-testing-components.md#mountdataclient-api), plus:

| Member                | Description                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `result`              | What the composable returned                                                                                                                                                   |
| `waitForNextUpdate()` | **Deprecated.** Gives up silently after 1 second, so a test can pass while still suspended. Use `await result` for a Promise `result`, and `await allSettled()` after a change |
