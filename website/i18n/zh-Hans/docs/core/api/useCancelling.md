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

## 类型 {#types}

```typescript
function useCancelling<
  E extends EndpointInterface & {
    extend: (o: { signal?: AbortSignal }) => any;
  },
>(endpoint: E, ...args: readonly [...Parameters<E>] | readonly [null]): E {
```
