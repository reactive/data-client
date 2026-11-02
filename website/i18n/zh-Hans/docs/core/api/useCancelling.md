---
frameworks: [react]
title: useCancelling() - React 的声明式 fetch 中止
sidebar_label: useCancelling()
description: 构建一个在参数每次变化时取消 fetch 的 Endpoint。参数变化时中止进行中的请求。
---

import HooksPlayground from '@site/src/components/HooksPlayground';
import PkgInstall from '@site/src/components/PkgInstall';
import UseCancelling from '../shared/\_useCancelling.mdx';

# useCancelling()

构建一个在参数每次变化时取消 fetch 的 Endpoint

如果参数发生变化，会[中止](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)进行中的请求。

## 用法 {#usage}

<UseCancelling />

:::warning[警告]

当许多互不相关的组件向 useSuspense() 获取相同参数（Endpoint/params 组合）时，请谨慎使用。
该方案按组件中止 fetch，这意味着你可能会取消另一个组件仍然需要的 fetch。

:::

## 取消与防抖 {#cancel-vs-debounce}

当用户会在每个值上停留时使用 `useCancelling()`，比如用方向键逐项浏览的列表。它会立即获取，
并中止上一次的 fetch。

当用户在输入时使用 [useDebounce()](./useDebounce.md)。它会等到输入停止，因此发出的请求
更少。

对于搜索，两者一起使用：

```tsx
import {
  useCancelling,
  useDebounce,
  useSuspense,
} from '@data-client/react';
import { searchIssues } from './resources/Issue';

function IssueList({ query }: { query: string }) {
  const [q] = useDebounce(query, 200);
  const { items } = useSuspense(useCancelling(searchIssues, { q }), { q });
  // ...
}
```

## 类型 {#types}

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```
