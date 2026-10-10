---
frameworks: [react]
title: AsyncBoundary - 集中处理加载与错误
sidebar_label: <AsyncBoundary />
description: 处理 Suspense 的加载与错误状态。
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';


# &lt;AsyncBoundary />

处理 Suspense 的加载与错误状态。

在 React 18 中，它会创建一个[并发拆分](https://react.dev/reference/react/useTransition)；在 16 和 17 中，它会显示加载 fallback。如果出现无法恢复的错误，它会显示错误 fallback。

:::tip

通过学习如何[就近声明数据依赖](../getting-started/data-dependency.md)，进一步了解边界应该放在哪里

:::

## 用法 {#usage}

将 `AsyncBoundary` 放在**页面、路由或模态框**等[导航边界处或其上方](../getting-started/data-dependency.md#boundaries)。

<AsyncBoundaryExamples />

然后在渲染数据的组件中使用 [useSuspense()](./useSuspense.md)。`<AsyncBoundary />` 的*任何*后代产生的错误或加载状态
都会在 `<AsyncBoundary />` 处渲染。这种对 fallback UI 的整合
可以提升性能和可用性。

```ts
function SuspendingComponent() {
  const data = useSuspense(getMyThing);

  return <div>{data.text}</div>;
}
```

## Props {#props}

```ts
interface BoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  errorComponent?: React.ComponentType<{
    error: NetworkError;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallback {#fallback}

加载时显示的任意可渲染（React Node）元素

### errorComponent {#errorcomponent}

用于处理捕获到的错误的组件

#### 自定义 fallback 示例 {#custom-fallback}

```tsx
import React from 'react';
import { DataProvider, AsyncBoundary } from '@data-client/react';
import Router from './Router';

function ErrorPage({
  error,
  className,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}) {
  return (
    <pre role="alert" className={className}>
      {error.message} <button onClick={resetErrorBoundary}>Reset</button>
    </pre>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AsyncBoundary fallback="loading" errorComponent={ErrorPage}>
        <Router />
      </AsyncBoundary>
    </DataProvider>
  );
}
```

### errorClassName {#errorclassname}

转发给 [errorComponent](#errorcomponent) 的 `className`

### listen {#listen}

订阅处理函数，用于在 URL 位置变化等事件发生时重置错误状态。非常适合
用边界包裹路由组件的场景。

下面是使用 [Anansi Router](https://www.npmjs.com/package/@anansi/router) 的示例，它使用了
[history](https://www.npmjs.com/package/history) 订阅。

```tsx
import { useRouter, Link, MatchedRoute } from '@anansi/router';
import { AsyncBoundary } from '@data-client/react';

function App() {
  const { history } = useRouter();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <AsyncBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </AsyncBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```
