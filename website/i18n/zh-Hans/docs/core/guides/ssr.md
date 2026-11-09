---
frameworks: [react]
id: ssr
title: 使用 NextJS、Express 等进行服务端渲染
sidebar_label: 服务端渲染
---

import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# 服务端渲染

服务端渲染（SSR）能让首次页面加载更快。Reactive Data Client 还会把数据 store 随
页面一起发送。因此页面一可见就能交互，[数据变更](../getting-started/mutations.md)也会
立即生效。客户端不会再次获取数据，否则会增加服务器负载并拖慢 hydration。

## NextJS SSR {#nextjs}

### App Router {#app-router}

Reactive Data Client 支持 Next.js App Router（`/app` 目录，Next.js 13 及更高版本）。它不支持
Pages Router。

#### 根布局 {#root-layout}

把 [DataProvider](../api/DataProvider.md) 放到你的[根布局](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required)中

```tsx title="app/layout.tsx"
import { DataProvider } from '@data-client/react/nextjs';
import { AsyncBoundary } from '@data-client/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        // highlight-next-line
        <DataProvider>
          <header>Title</header>
          <AsyncBoundary>{children}</AsyncBoundary>
          <footer></footer>
          // highlight-next-line
        </DataProvider>
      </body>
    </html>
  );
}
```

#### 客户端组件 {#client-components}

要让数据保持新鲜，请结合 [useSuspense()](../api/useSuspense.md) 使用客户端组件。

```tsx title="app/todos/[userId]/page.tsx"
'use client';
import { useSuspense } from '@data-client/react';
import { TodoResource } from '@/resources/Todo';
import TodoList from '@/components/TodoList';

export default function InteractivePage({ params }: { params: { userId: number } }) {
  const todos = useSuspense(TodoResource.getList, params);
  return <TodoList todos={todos} />;
}
```

这与不使用 SSR 时的代码相同，因此这些组件可以在所有平台上运行。

#### 服务端组件 {#server-components}

如果数据从不变化，服务端组件可以少发送一些 JavaScript。`await` 该 endpoint：

```tsx title="app/todos/[userId]/page.tsx"
import { TodoResource } from '@/resources/Todo';
import TodoList from '@/components/TodoList';

export default async function StaticPage({ params }: { params: { userId: number } }) {
  const todos = await TodoResource.getList(params);
  return <TodoList todos={todos} />;
}
```

#### 演示 {#demo}

<StackBlitz app="nextjs" file="components/todo/TodoList.tsx,app/layout.tsx" view="both" />

#### 类名混淆与 Entity.key {#class-mangling-and-entitykey}

Next.js 在生产构建中会重命名类。默认的 [Entity.key](/rest/api/Entity#key) 就是类名，所以
务必定义 `key`。

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

## Express JS SSR {#express-js-ssr}

在你自己的 Express 服务器中使用这套配置。

### 服务端 {#server-side}

```tsx
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createPersistedStore,
  createServerDataComponent,
} from '@data-client/react/ssr';

import App from './App';
import Document from './Document';
import assets from './assets';
import { NeededForPage } from './resources/NeededForPage';

const rootId = 'react-root';
const PORT = 3000;

const app = express();
app.get('/*', (req: any, res: any) => {
  let didError = false;
  const [ServerDataProvider, useReadyCacheState, controller] =
    createPersistedStore();
  const ServerDataComponent =
    createServerDataComponent(useReadyCacheState);

  controller.fetch(NeededForPage, { id: 5 });

  const { pipe, abort } = renderToPipeableStream(
    <Document
      assets={assets}
      scripts={[<ServerDataComponent key="server-data" />]}
      rootId={rootId}
    >
      <ServerDataProvider>
        <App />
      </ServerDataProvider>
    </Document>,

    {
      onShellReady() {
        // If something errored before we started streaming, we set the error code appropriately.
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-type', 'text/html');
        pipe(res);
      },
      onError(x: any) {
        didError = true;
        console.error(x);
        res.statusCode = 500;
        pipe(res);
      },
    },
  );
  // Abandon and switch to client rendering if enough time passes.
  // Try lowering this to see the client recover.
  setTimeout(abort, 1000);
});

app.listen(PORT, () => {
  console.log(`Listening at ${PORT}...`);
});
```

### 客户端 {#client}

```tsx
import { hydrateRoot } from 'react-dom/client';
import { DataProvider } from '@data-client/react';
import { awaitInitialData } from '@data-client/react/ssr';

import App from './App';

const rootId = 'react-root';

awaitInitialData().then(initialState => {
  hydrateRoot(
    document.getElementById(rootId)!,
    <DataProvider initialState={initialState}>
      <App />
    </DataProvider>,
  );
});
```
