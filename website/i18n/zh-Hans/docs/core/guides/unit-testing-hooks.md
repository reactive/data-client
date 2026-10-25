---
frameworks: [react]
title: hook 的单元测试
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

对 Reactive Data Client 这类模块使用 [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) 时要小心。去掉预期的
导出可能导致难以追踪的
错误，例如 `TypeError: Class extends value undefined is not a function or null`。

你可以改用[部分 mock](https://jestjs.io/docs/mock-functions#mocking-partials)，
或者更好的做法是对你的 endpoint 使用
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules)。

:::

hook 让你可以把复杂的行为从组件中抽离出来，变成简洁、
可组合的函数。这可能会让测试组件行为变得容易得多。
但如果你想使用 `Reactive Data Client` 提供的 hook，又该怎么做呢？

我们提供了一些简单的工具来减少单元测试的样板代码，
它们是对 [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library) 的 [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) 的封装。

我们需要一个 [renderDataHook()](../api/renderDataHook.md) 函数，它会同时在
`Provider` 和 `Suspense` 边界的上下文中渲染。

这些通常在测试初始化时完成。每个测试结束后会自动执行清理。

:::note

`renderDataHook()` 会创建一个带有全新 manager 实例的 Provider context。这意味着每次调用
`renderDataHook()` 都会得到全新的缓存状态和 manager 状态。

:::

### 在 node &lt; 18 中为 fetch 添加 polyfill {#polyfill-fetch-in-node-lt-18}

Node 默认不自带 fetch，因此我们必须为它添加 polyfill。

<PkgTabs pkgs="whatwg-fetch" dev />

### Jest {#jest}

```js
// jest.config.js
module.exports = {
  // other things
  setupFiles: ['./testSetup.js'],
};
```

```js
// testSetup.js
require('whatwg-fetch');
```

### 示例： {#example}

<Tabs
defaultValue="DataProvider"
values={[
{ label: '@data-client/react', value: 'DataProvider' },
{ label: '@data-client/react/redux', value: 'ExternalDataProvider' },
]}>
<TabItem value="DataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
<TabItem value="ExternalDataProvider">

```typescript
import nock from 'nock';
import { useSuspense } from '@data-client/react';
import { makeRenderDataHook } from '@data-client/test';
import { DataProvider } from '@data-client/react/redux';
import { ArticleResource } from '../resources/Article';

describe('useSuspense()', () => {
  let renderDataHook: ReturnType<typeof makeRenderDataHook>;

  beforeEach(() => {
    nock(/.*/)
      .persist()
      .defaultReplyHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      })
      .options(/.*/)
      .reply(200)
      .get(`/article/0`)
      .reply(403, {});
    renderDataHook = makeRenderDataHook(DataProvider);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should throw errors on bad network', async () => {
    const { result, waitFor } = renderDataHook(() => {
      return useSuspense(ArticleResource.get, {
        title: '0',
      });
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.error).toBeDefined();
    expect((result.error as any).status).toBe(403);
  });
});
```

</TabItem>
</Tabs>
