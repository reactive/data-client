---
title: composable 的单元测试
framework_equivalent: guides/unit-testing-hooks
---

composable 把数据逻辑从组件中抽离出来，因此它往往是测试这些逻辑最容易的地方。
`@data-client/vue/test` 提供的 `renderDataCompose()` 会在一个挂载了
[DataClientPlugin](../api/DataClientPlugin.md) 和 [Fixtures](../api/Fixtures.md) 的组件中运行 composable。
它接受与 [mountDataClient()](./unit-testing-components.md) 相同的 [options](./unit-testing-components.md#options)，也需要相同的
[setup](./unit-testing-components.md#setup)。

## renderDataCompose() {#renderdatacompose}

`renderDataCompose()` 是异步的，在读取 `result` 之前要先 `await` 它；后者就是
composable 的返回值。[useQuery()](../api/useQuery.md) 和 [useCache()](../api/useCache.md) 返回的是
`ComputedRef`，因此它们的数据位于 `result.value`：

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

务必在测试结束时调用 `cleanup()`；它会卸载应用及其 manager。

### useSuspense() {#usesuspense}

[useSuspense()](../api/useSuspense.md) 返回一个 Promise，数据可用后它会 resolve 为一个 `ComputedRef`。
只需 `await` 一次，然后读取 `.value`；随着 store 的变化，这个 ref 会保持响应式。

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

在 fixture 中添加 `error: true` 来测试失败情况；此时 Promise 会以该错误 reject：

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

### 修改 props {#changing-props}

composable 会接收 `props`。传入一个 `reactive()` 对象，并把基于它构建的 getter 或
`computed()` 交给 composable，使其能跟随变化：

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

### 变更 {#mutations}

返回的 `controller` 就是应用的 [Controller](../api/Controller.md)。执行变更之后，
先 `await` 它，再 `nextTick()`，然后检查结果：

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

## API {#api}

### renderDataCompose(composable, options?) {#renderdatacompose-api}

composable 运行完毕后，它会 resolve 为与 [mountDataClient()](./unit-testing-components.md#mountdataclient-api) 相同的 `controller`、`wrapper`、`cleanup()` 和
`allSettled()`，另外还有：

| 成员                  | 说明                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `result`              | composable 的返回值                                                                                                                                                            |
| `waitForNextUpdate()` | **已弃用。** 1 秒后会静默放弃，因此测试可能在仍处于挂起状态时就通过了。对于 Promise 类型的 `result`，请使用 `await result`；发生变化后请使用 `await allSettled()` |
