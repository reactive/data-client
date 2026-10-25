---
frameworks: [react]
title: MockResolver - React 的数据模拟
sidebar_label: <MockResolver />
---

# &lt;MockResolver />

```typescript
function MockResolver<T>(props: {
  children: React.ReactNode;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData: () => T;
}): JSX.Element;
```

&lt;MockResolver /\> 可以轻松加载 fixture，以查看不同的网络响应会呈现什么样子。
这对 [storybook](../guides/storybook.md) 以及组件测试都很有用。

## 参数 {#arguments}

### fixtures {#fixtures}

```ts
(Fixture | Interceptor<T>)[]
```

该 prop 指定用于提供数据的 [fixture 或 interceptor](./Fixtures.md)。每一项代表一次由
[Endpoint](/rest/api/Endpoint) 和 params 定义的 fetch。`Result` 包含该 fetch 预期的 JSON 响应。

### getInitialInterceptorData {#getinitialinterceptordata}

为所有 interceptor 初始化 `this` 属性的函数。

```ts
<MockResolver
  fixtures={[
    {
      endpoint: new RestEndpoint({
        path: '/api/count/increment',
        method: 'POST',
        body: undefined,
      }),
      response() {
        return {
          // highlight-next-line
          count: (this.count = this.count + 1),
        };
      },
      delay: () => 500 + Math.random() * 4500,
    },
  ]}
  // highlight-next-line
  getInitialInterceptorData={() => ({ count: 0 })}
>
  {children}
</MockResolver>
```

## 示例 {#example}

```tsx
import { MockResolver } from '@data-client/test';
import type { Story } from '@storybook/react';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  // fixture
  {
    endpoint: ArticleResource.getList,
    args: [{ maxResults: 10 }] as const,
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
  // interceptor
  {
    endpoint: ArticleResource.partialUpdate,
    response: ({ id }, body) => ({
      ...body,
      id,
    }),
  },
];

const Template: Story = () => (
  <MockResolver fixtures={results}>
    <MyComponentToTest />
  </MockResolver>
);

export const MyStory = Template.bind({});
```
