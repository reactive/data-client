---
frameworks: [react]
id: ssr
title: Server Side Rendering with NextJS, Express, and more
sidebar_label: Server Side Rendering
---

import PkgTabs from '@site/src/components/PkgTabs';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Server Side Rendering

Server Side Rendering (SSR) makes the first page load faster. Reactive Data Client also sends the data store with the
page. So the page is interactive as soon as it is visible, and [data mutations](../getting-started/mutations.md) are
immediate. The client does not fetch the data again, which would add server load and slow hydration.

## NextJS SSR {#nextjs}

### App Router

Next.js 13 added the App Router in the `/app` directory. It adds nested layouts and React Server Components.

#### Root Layout

Place [DataProvider](../api/DataProvider.md) in your [root layout](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required)

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

#### Client Components

To keep data fresh, use client components with [useSuspense()](../api/useSuspense.md).

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

This is the same code as without SSR, so the components work on every platform.

#### Server Components

If the data never changes, a server component sends slightly less JavaScript. `await` the endpoint:

```tsx title="app/todos/[userId]/page.tsx"
import { TodoResource } from '@/resources/Todo';
import TodoList from '@/components/TodoList';

export default async function StaticPage({ params }: { params: { userId: number } }) {
  const todos = await TodoResource.getList(params);
  return <TodoList todos={todos} />;
}
```

#### Demo

<StackBlitz app="nextjs" file="components/todo/TodoList.tsx,app/layout.tsx" view="both" />

#### Class mangling and Entity.key

Next.js renames classes in production builds. The default [Entity.key](/rest/api/Entity#key) is the class name, so
always define `key`.

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Pages Router

For the Pages Router, use the Next.js [Document](https://nextjs.org/docs/advanced-features/custom-document) and
[App](https://nextjs.org/docs/advanced-features/custom-app) wrappers:

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

To fetch with parameters from [useRouter()](https://nextjs.org/docs/api-reference/next/router#userouter), add
`getServerSideProps`. Otherwise [Next.js leaves router.query empty](https://nextjs.org/docs/advanced-features/automatic-static-optimization)
during prerendering.

```typescript
export default function MyComponent() {
  const id = useRouter().query.id as string;
  const post = useSuspense(getPost, { id });
  // etc
}
// highlight-next-line
export const getServerSideProps = () => ({ props: {} });
```

:::

#### Further customizing Document

To customize Document, extend `DataClientDocument`. Call `super.getInitialProps()`, not `Document.getInitialProps()`,
or Reactive Data Client's code does not run.

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

#### CSP Nonce

`DataClientDocument` serializes the store in a script tag. If your Content Security Policy requires a
[nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce), override
`DataClientDocument.getNonce`. Next.js has no standard nonce API, so return the nonce you created in the
`DocumentContext`.

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

## Express JS SSR

Use this setup for your own Express server.

### Server side

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

### Client

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
