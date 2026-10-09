---
title: 组件单元测试
---

import PkgTabs from '@site/src/components/PkgTabs';

:::warning

对 Reactive Data Client 这类模块使用 [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) 时要小心。去掉本应存在的
导出可能会导致难以追踪的
错误，例如 `TypeError: Class extends value undefined is not a function or null`。

请改用 [Fixtures](../api/Fixtures.md) 加载响应。

:::

`@data-client/vue/test` 会结合 [DataClientPlugin](../api/DataClientPlugin.md)、
一个 `<Suspense>` 边界和 [Fixtures](../api/Fixtures.md) 来挂载组件，这样测试无需经历网络请求周期，就能检查组件
渲染出的内容。如果要单独测试组合式函数，请参阅
[组合式函数单元测试](./unit-testing-composables.md)。

## 设置 {#setup}

这些测试工具基于 [Vue Test Utils](https://test-utils.vuejs.org/) 构建，因此请把它
和测试运行器一起安装。Jest 需要 [jsdom 环境](https://jestjs.io/docs/configuration#testenvironment-string)。

<PkgTabs pkgs="@vue/test-utils jest-environment-jsdom" dev />

## mountDataClient() {#mountdataclient}

[initialFixtures](#options)
会在首次渲染之前填充 store，因此 `await`
[useSuspense()](../api/useSuspense.md) 的组件会立即渲染出数据。

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { useSuspense } from '@data-client/vue';
import { defineComponent, h } from 'vue';
import { ArticleResource } from './resources';
import { flushUntil } from './flushUntil';

const ArticleDetail = defineComponent({
  props: { id: { type: Number, required: true } },
  async setup(props) {
    // a getter so the fetch follows props.id
    const article = await useSuspense(ArticleResource.get, () => ({
      id: props.id,
    }));
    return () => h('h3', article.value.title);
  },
});

it('renders the article', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');

  cleanup();
});
```

务必在测试结束时调用 `cleanup()`；它会卸载应用及其 Manager。

### 等待渲染 {#waiting-for-renders}

异步 `setup()` 和 Suspense 需要经过多个微任务和 tick 才会完成，因此应等待
测试所期望的结果，而不是等待固定数量的 tick：

```typescript title="flushUntil.ts"
import { nextTick } from 'vue';

export async function flushUntil(predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  throw new Error('flushUntil: condition never became true');
}
```

### 加载状态 {#loading-state}

当组件处于挂起状态时，`mountDataClient()` 会渲染一个带有
`data-testid="suspense-fallback"` 的元素。使用 [resolverFixtures](#options) 来响应 store
中尚不存在的数据请求：

```typescript
it('shows the fallback until the fetch resolves', async () => {
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(true);

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('Article 5');

  cleanup();
});
```

interceptor 的 `response` 会接收 endpoint 的参数，因此一个 fixture 就能响应所有
`id`。给 fixture 加上 `error: true` 可以让它 reject；所有 fixture 形式请参阅
[Fixtures](../api/Fixtures.md)。

### 修改 props {#changing-props}

传入一个 `reactive()` 对象作为 `props`，然后设置它的成员来修改组件的 props：

```typescript
import { reactive } from 'vue';

it('fetches the new article when id changes', async () => {
  const props = reactive({ id: 1 });
  const { wrapper, cleanup } = mountDataClient(ArticleDetail, {
    props,
    resolverFixtures: [
      {
        endpoint: ArticleResource.get,
        response: ({ id }) => ({ id, title: `Article ${id}`, content: '' }),
      },
    ],
  });

  await flushUntil(() => wrapper.text() === 'Article 1');

  props.id = 2;
  await flushUntil(() => wrapper.text() === 'Article 2');

  cleanup();
});
```

异步 `setup()` 在每个组件实例中只运行一次，因此由 props 派生的参数应以 getter
（`() => ({ id: props.id })`）或 `computed()` 的形式传入。普通的 `{ id: props.id }` 只会被读取一次，
不会跟随 props 的变化。

### 变更 {#mutations}

返回的 `controller` 就是应用的 [Controller](../api/Controller.md)。用它执行变更或
[setResponse()](../api/Controller.md#setResponse)，然后等待组件更新：

```typescript
it('re-renders when the store changes', async () => {
  const { wrapper, controller, cleanup } = mountDataClient(ArticleDetail, {
    props: { id: 5 },
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });
  await flushUntil(() => wrapper.find('h3').exists());

  controller.setResponse(
    ArticleResource.get,
    { id: 5 },
    { id: 5, title: 'updated', content: 'whatever' },
  );

  await flushUntil(() => wrapper.find('h3').text() === 'updated');
  cleanup();
});
```

## API {#api}

### mountDataClient(component, options?) {#mountdataclient-api}

返回值

| 成员         | 说明                                                  |
| -------------- | ------------------------------------------------------------ |
| `wrapper`      | 已挂载树的 Vue Test Utils [VueWrapper](https://test-utils.vuejs.org/api/#wrapper-methods) |
| `controller`   | 应用的 [Controller](../api/Controller.md)                 |
| `app`          | Vue 应用实例                                         |
| `cleanup()`    | 卸载并停止各个 Manager                              |
| `allSettled()` | 在所有进行中的请求（包括刚由 props 变化触发的请求）都完成、且组件已重新渲染后 resolve |

### 选项 {#options}

`mountDataClient()` 和 [renderDataCompose()](./unit-testing-composables.md) 接受相同的选项。

```typescript
interface RenderDataClientOptions<P = any> {
  /** Props for the component; pass a reactive() object to change them */
  props?: Reactive<P>;
  /** Responses in the store before the first render */
  initialFixtures?: readonly Fixture[];
  /** Answer fetches made during the test */
  resolverFixtures?: readonly (Fixture | Interceptor)[];
  /** Initial `this` for interceptors */
  getInitialInterceptorData?: () => any;
  /** Replace the default NetworkManager and SubscriptionManager */
  managers?: Manager[];
  /** Replace the state built from initialFixtures */
  initialState?: State<unknown>;
  gcPolicy?: GCInterface;
  /** Component rendered around the tested component (receives the same props) */
  wrapper?: Component;
}
```

[mockInitialState()](../api/mockInitialState.md) 会根据 fixture 构建 `initialState`，
便于配合你自己的 `DataClientPlugin` 设置进行挂载。
