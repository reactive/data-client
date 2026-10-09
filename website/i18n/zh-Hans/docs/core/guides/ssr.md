---
frameworks: [react]
id: ssr
title: 使用 NextJS、Express 等进行服务端渲染
sidebar_label: 服务端渲染
---

import PkgTabs from '@site/src/components/PkgTabs';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# 服务端渲染

服务端渲染（SSR）可以提升应用的首次加载性能。Reactive Data
Client 更进一步，会预先填充数据 store。与其他 SSR 方案不同，
Reactive Data Client 在页面可见的那一刻就能交互，让[数据变更](../getting-started/mutations.md)即时生效。此外，也不需要额外的数据获取——那会增加服务器
负载、拖慢客户端 hydration，并可能导致应用卡顿。

## NextJS SSR {#nextjs}

### App Router {#app-router}

NextJS 12 在 '/app' 目录中引入了一种新的路由方式。它带来了进一步的
性能提升，并支持动态路由和嵌套路由。

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

为了让数据保持最新且高效，你可以使用客户端组件和 [useSuspense()](../api/useSuspense.md)

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

注意，这与不使用 SSR 时编写组件的方式完全相同。这让
组件可以跨平台使用。

#### 服务端组件 {#server-components}

不过，如果你的数据从不变化，可以通过使用服务端组件来略微减小发送的
javascript bundle。只需 `await` 该 endpoint：

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

NextJS 在生产构建中会重命名类。因此，务必
定义 [Entity.key](/rest/api/Entity#key)，因为它的默认实现基于
类名。

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Pages Router {#pages-router}

在 NextJS &lt; 14 中，你可能在使用 pages router。为此我们提供了 NextJS 专用的 [Document](https://nextjs.org/docs/advanced-features/custom-document)
和 [App](https://nextjs.org/docs/advanced-features/custom-app) 封装

<PkgTabs pkgs="@data-client/ssr @data-client/redux redux" />

```tsx title="pages/_document.tsx"
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default DataClientDocument;
```

```tsx title="pages/_app.tsx"
import { AppDataProvider } from '@data-client/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppDataProvider>
      <Component {...pageProps} />
    </AppDataProvider>
  );
}
```

:::warning

根据 [useRouter()](https://nextjs.org/docs/api-reference/next/router#userouter) 中的参数获取数据时，你需要
添加 getServerSideProps，以避免 [NextJS 将 router.query 设为空](https://nextjs.org/docs/advanced-features/automatic-static-optimization)

```typescript
export default function MyComponent() {
  const id: string; = useRouter().query.id;
  const post = useSuspense(getPost, { id });
  // etc
}
// highlight-next-line
export const getServerSideProps = () => ({ props: {} });
```

:::

#### 进一步自定义 Document {#further-customizing-document}

要进一步自定义 Document，只需继承我们提供的 document。

务必使用 `super.getInitialProps()` 而不是 `Document.getInitialProps()`，
否则 Reactive Data Client 的代码将不会运行！

```tsx title="pages/_document.tsx"
import { Html, Head, Main, NextScript } from 'next/document';
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default class MyDocument extends DataClientDocument {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage;

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: App => App,
        // Useful for wrapping in a per-page basis
        enhanceComponent: Component => Component,
      });

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await super.getInitialProps(ctx);

    return initialProps;
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

#### CSP Nonce {#csp-nonce}

Reactive Data Client 的 Document 会把 store 状态序列化到一个 script 标签中。如果你有
需要使用 nonce 的内容安全策略（CSP）限制，可以覆盖
`DataClientDocument.getNonce`。

由于 NextJS 中没有处理 [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
的标准方式，这让你
可以取出你在 DocumentContext 中创建的任意 nonce，供 Reactive Data Client 使用。

```tsx title="pages/_document.tsx"
import { DataClientDocument } from '@data-client/ssr/nextjs';
import type { DocumentContext } from 'next/document.js';

export default class MyDocument extends DataClientDocument {
  static getNonce(ctx: DocumentContext & { res: { nonce?: string } }) {
    // this assumes nonce has been added here - customize as you need
    return ctx?.res?.nonce;
  }
}
```

## Express JS SSR {#express-js-ssr}

适用于使用 express 自行实现服务器的场景。

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
