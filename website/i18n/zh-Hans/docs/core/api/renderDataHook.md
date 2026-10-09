---
frameworks: [react]
framework_equivalent: guides/unit-testing-composables
title: renderDataHook()
---

`renderDataHook()` 用于测试依赖 `Reactive Data Client` 的 hook。它与 [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library) 的 [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) 相仿，但会额外提供一个 `<Suspense/>` 边界，
并运行在 `<Provider />` 上下文中。

:::note

`renderDataHook()` 会使用新的 manager 实例创建一个 Provider 上下文。这意味着每次调用
`renderDataHook()` 都会得到全新的缓存状态和 manager 状态。

:::

<details>
<summary><b>类型</b></summary>

```typescript
type RenderDataHook = {
  <P, R, T = any>(
    callback: (props: P) => R,
    options?: {
      initialProps?: P;
      initialFixtures?: Fixture[];
      resolverFixtures?: (Fixture | Interceptor<T>)[];
      getInitialInterceptorData?: () => T;
      wrapper?: React.ComponentType;
    },
  ): {
    rerender: (props?: Props) => void;
    result: {
      current: Result;
      error?: Error;
    };
    unmount: () => void;
    controller: Controller;
    cleanup(): void;
    allSettled(): Promise<unknown>;
    /* @deprecated */
    waitForNextUpdate: (options?: waitForOptions) => Promise<void>;
    waitFor<T>(
      callback: () => Promise<T> | T,
      options?: waitForOptions,
    ): Promise<T>;
  };
  /** cleanup is automatic; only needed for ordering (e.g., before jest.useRealTimers()) */
  cleanup(): void;
  allSettled(): Promise<unknown>;
};
```

</details>

## 用法 {#usage}

```typescript
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

it('useSuspense() should render the response', async () => {
  const { result, waitFor } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, { id: 5 });
    },
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response,
        },
      ],
    },
  );
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
});
```

## 参数 {#arguments}

### callback {#callback}

在 React 中运行的 hook。其返回值可以通过 [result.current](#result) 获取

### options.initialFixtures {#optionsinitialfixtures}

如果测试需要缓存中预先存在数据，可以用它来预填充缓存。接收一个
[fixture 数组](./Fixtures.md)

其效果等同于使用 [mockInitialState()](../api/mockInitialState) 初始化 [&lt;DataProvider /\>](../api/DataProvider)

### options.resolverFixtures {#optionsresolverfixtures}

这些 [fixture 或 interceptor](./Fixtures.md) 用于响应任何新的请求。它最适合用来模拟变更这类命令式请求，也可以用来测试挂起状态或过渡。

其实现方式是添加 [MockResolver](../api/MockResolver.md) 作为 wrapper。

### options.getInitialInterceptorData {#optionsgetinitialinterceptordata}

用于为所有 interceptor 初始化 `this` 属性的函数。

### options.initialProps {#optionsinitialprops}

传给回调函数的初始值

### options.wrapper {#optionswrapper}

将一个 React 组件作为 wrapper 选项传入，它会被渲染在内部元素的外层

## 返回值 {#returns}

### controller {#controller}

用于 dispatch 命令式副作用的 [Controller](./Controller.md)

```ts
import { act } from '@testing-library/react';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Todo, TodoResource } from './resources/Todo';

it('should update', async () => {
  const id = 5;
  const payload = { title: 'first item', id, completed: false };
  // highlight-next-line
  const { result, controller } = renderDataHook(
    () => {
      return useSuspense(TodoResource.getList);
    },
    {
      initialFixtures: [
        {
          endpoint: TodoResource.getList,
          args: [],
          response: [payload],
        },
      ],
      resolverFixtures: [
        {
          endpoint: TodoResource.update,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  expect(result.current).toEqual([Todo.fromJS(payload)]);
  // highlight-start
  await act(async () => {
    await controller.fetch(
      TodoResource.update,
      { id },
      { title: 'updated title' },
    );
  });
  // highlight-end
  expect(result.current[0].title).toBe('updated title');
});
```

### cleanup() {#cleanup}

清理本次渲染中使用的所有 manager。
这在模拟定时器时尤其重要，因为 Reactive Data Client 的内部实现依赖真实的定时器来
避免竞态条件。

清理会通过模块级的 `afterEach` hook 在每个测试结束后自动运行（与 `@testing-library/react` 类似）。
只有当你必须在测试体内控制清理顺序时才需要手动调用——例如，
在从模拟定时器切换回真实定时器之前进行清理：

```ts
it('should handle polling', async () => {
  jest.useFakeTimers();
  const { result } = renderDataHook(/* ... */);
  // ... assertions ...
  // highlight-next-line
  renderDataHook.cleanup(); // must run while fake timers are still active
  jest.useRealTimers();
});
```

### allSettled() {#allsettled}

返回一个 promise，在所有进行中的请求完成后 resolve。

每次调用 `renderDataHook()` 的返回值上也提供了该方法。

### result {#result}

- `current`（`any`）——`callback` 函数的返回值
- `error`（`Error`）——如果 `callback` 函数在渲染期间抛出错误，则为所抛出的错误

### waitFor {#waitfor}

返回一个 `Promise`，当提供的回调执行时没有抛出异常、并返回真值或 undefined 时 resolve。可以放心地在回调中使用 renderDataHook 的结果来进行断言或检验值。

### waitForNextUpdate {#waitfornextupdate}

:::warning[已弃用]

请改用 waitFor

:::

返回一个 `Promise`，在 hook 下一次渲染时 resolve，通常发生在异步操作导致状态更新时。

### rerender {#rerender}

（`function([newProps])`）——用于重新渲染测试组件（包括 `callback` 函数中调用的所有 hook）的函数。如果传入了 `newProps`，在之后的渲染中它们会替换传给 `callback` 函数的 `initialProps`。

### unmount {#unmount}

（`function()`）——用于卸载测试组件的函数，通常用来触发 `useEffect` hook 的清理副作用。

## 示例 {#examples}

```typescript
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

it('should resolve useSuspense()', async () => {
  const { result, waitFor, controller } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, response);
    },
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          response: ({ id }) => ({ ...response, id }),
        },
        {
          endpoint: ArticleResource.partialUpdate,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  // this indicates suspense
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: response.id },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```
