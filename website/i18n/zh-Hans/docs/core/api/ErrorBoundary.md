---
frameworks: [react]
title: '<ErrorBoundary />'
---

在抛出错误（包括 [useSuspense()](./useSuspense.md) 被 reject）时显示一个 fallback 组件。

:::info

可复用的 React Error Boundary 组件。

:::

## 用法 {#usage}

将 `ErrorBoundary` 放在 **页面、路由或弹窗** 等[导航边界处或其上方](../getting-started/data-dependency.md#boundaries)，用来“捕获”错误并渲染 fallback UI。

```tsx
import React from 'react';
import { ErrorBoundary, useSuspense } from '@data-client/react';
import { MyEndpoint } from './MyEndpoint';

export default function MyPage() {
  return (
    <ErrorBoundary>
      <SuspendingComponent />
    </ErrorBoundary>
  );
}

function SuspendingComponent() {
  const data = useSuspense(MyEndpoint);

  return <div>{data.text}</div>;
}
```

## Props {#props}

```tsx
interface Props<E extends Error> {
  children: React.ReactNode;
  className?: string;
  fallbackComponent: React.ComponentType<{
    error: E;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallbackComponent {#fallbackcomponent}

```tsx
import React from 'react';
import { DataProvider, ErrorBoundary } from '@data-client/react';
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
      <ErrorBoundary fallbackComponent={ErrorPage} className="error">
        <Router />
      </ErrorBoundary>
    </DataProvider>
  );
}
```

### listen {#listen}

订阅处理函数，用于在 URL 地址变化等事件发生时重置错误状态。这非常适合
在包裹路由组件的位置放置边界。

下面是一个使用 [Anansi Router](https://www.npmjs.com/package/@anansi/router) 的示例，它使用了
[history](https://www.npmjs.com/package/history) 订阅。

```tsx
import { useRouter, Link, MatchedRoute } from '@anansi/router';
import { ErrorBoundary } from '@data-client/react';

function App() {
  const { history } = useRouter();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <ErrorBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </ErrorBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```

### className {#classname}

要转发给 [fallbackComponent](#fallbackcomponent) 的 `className`
