---
title: mockInitialState()
---

```typescript
function mockInitialState(results: Fixture[]): State;
```

`mockInitialState()` 让你可以轻松地用 [fixtures](./Fixtures.md) 预填充缓存。它
被 :react[[&lt;MockResolver /\>](./MockResolver) 用来处理 results prop]:vue[`MockPlugin` 用来处理 fixtures 选项]。不过，
在测试需要处理 `dispatches`（因而会发起 fetch）的更完整流程时，
也可以把它传入普通的 provider。

### 参数 {#arguments}

#### results {#results}

```typescript
export type Fixture = SuccessFixture | ErrorFixture;
```

这个 prop 指定要从中获取数据的 [fixtures](./Fixtures.md)。每一项代表一次由
[Endpoint](/rest/api/Endpoint) 和参数定义的 fetch。`Result` 包含该 fetch 预期的 JSON 响应。

它可以用作 :react[[&lt;DataProvider /\>](./DataProvider) 的 initialState prop]:vue[[DataClientPlugin](./DataClientPlugin.md) 的 [initialState 选项](./DataClientPlugin.md#initialState)]

## 示例 {#example}

```ts title="fixtures.ts"
import ArticleResource from 'resources/ArticleResource';

export const results = [
  {
    endpoint: ArticleResource.getList,
    args: [{ maxResults: 10 }],
    response: [
      {
        id: 5,
        content: 'have a merry christmas',
        author: 2,
        contributors: [],
      },
      {
        id: 532,
        content: 'never again',
        author: 23,
        contributors: [5],
      },
    ],
  },
];
```

:::react

```tsx
import { DataProvider } from '@data-client/react';
import { mockInitialState } from '@data-client/test';

import MyComponentToTest from 'components/MyComponentToTest';
import { results } from './fixtures';

<DataProvider initialState={mockInitialState(results)}>
  <MyComponentToTest />
</DataProvider>;
```

:::

:::vue

```ts
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { mockInitialState } from '@data-client/vue/test';

import MyComponentToTest from 'components/MyComponentToTest.vue';
import { results } from './fixtures';

const app = createApp(MyComponentToTest);
app.use(DataClientPlugin, { initialState: mockInitialState(results) });
app.mount('#app');
```

:::
