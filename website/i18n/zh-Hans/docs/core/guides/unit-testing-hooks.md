---
frameworks: [react]
title: hook 的单元测试
---

import PkgTabs from '@site/src/components/PkgTabs';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::warning

对 Reactive Data Client 的模块使用 [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) 时要小心。移除导出的
mock 会导致难以追踪的错误，例如
`TypeError: Class extends value undefined is not a function or null`。

请改用[部分 mock](https://jestjs.io/docs/mock-functions#mocking-partials)，或者更好的做法是对你的 endpoint 使用
[mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules)。

:::

[renderDataHook()](../api/renderDataHook.md) 会在 `DataProvider` 和 `Suspense` 边界内渲染 hook。在 React
18 或更高版本中，它在 DOM 环境下封装 [@testing-library/react](https://testing-library.com/docs/react-testing-library/api#renderhook) 的
`renderHook()`，在 React Native 上则封装 [@testing-library/react-native](https://github.com/callstack/react-native-testing-library) 的版本。其他情况下它使用
[@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library)。

在 hook 首次返回之前，`result.current` 为 `undefined`。如果之后它再次挂起，`result.current` 会保留最后一个
值。`result.error` 保存 hook 抛出的任何错误。

每次调用 `renderDataHook()` 都会创建新的 store 和新的 manager 实例，因此测试之间不会延续任何状态。
使用 `initialFixtures` 预先填充缓存。每个测试结束后会自动执行清理。

### 为 fetch 添加 polyfill {#polyfill-fetch}

Jest 的 `jsdom` 环境没有全局 `fetch`，即使在 Node 18 及更高版本上也是如此。请添加一个 polyfill：

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

### 示例 {#example}

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
