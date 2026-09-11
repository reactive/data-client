---
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

Server Side Rendering (SSR) can improve the first-load performance of your application. Reactive Data
Client takes this one step further by pre-populating the data store. Unlike other SSR methodologies,
Reactive Data Client becomes interactive the moment the page is visible, making [data mutations](../getting-started/mutations.md) instantaneous. Additionally there is no need for additional data fetches that increase server
load and slow client hydration, potentially causing application stutters.

## NextJS SSR {#nextjs}

### App Router

NextJS 12 includes a new way of routing in the '/app' directory. This allows further
performance improvements, as well as dynamic and nested routing.

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

Async Server Components anywhere between the provider and your Client Components are fine:
the store is streamed to the browser alongside the HTML, so data fetched by a component that
renders late still arrives before the HTML it produced. Every [Suspense](https://react.dev/reference/react/Suspense)
boundary then hydrates from exactly the data it was rendered with, without refetching.

```tsx title="app/[userId]/layout.tsx"
export default async function UserLayout({ children, params }) {
  // resolves after the shell has already been sent
  const { userId } = await params;
  return <section data-user={userId}>{children}</section>;
}
```

#### Props

```typescript
interface NextDataProviderProps {
  children: ReactNode;
  managers?: () => Manager[];
  nonce?: string;
  Controller?: typeof Controller;
  gcPolicy?: GCInterface;
  devButton?: DevToolsPosition | null;
}
```

`Controller` applies on both server and client. `gcPolicy` applies in the browser only: a
request-scoped server store has nothing to collect.

##### managers {#managers}

The server builds a store per request, so [Managers](../api/Manager.md) must be created per
request as well. Unlike the [browser DataProvider](../api/DataProvider.md#managers), this takes a
**function** that is called once per request on the server and once in the browser:

```tsx title="app/Provider.tsx"
'use client';
import { getDefaultManagers } from '@data-client/react';
import { DataProvider } from '@data-client/react/nextjs';

// highlight-next-line
const managers = () => [...getDefaultManagers(), new MyManager()];

export default function Provider({ children }: { children: React.ReactNode }) {
  return <DataProvider managers={managers}>{children}</DataProvider>;
}
```

Manager instances shared across requests would mix up users' data, so an array is rejected.
Server-side managers should not hold resources: their `cleanup()` is not run per request.

##### nonce {#nonce}

State is streamed in inline `<script>` tags. When your
[Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy) requires
a nonce, pass it through:

```tsx title="app/layout.tsx"
import { headers } from 'next/headers';
import { DataProvider } from '@data-client/react/nextjs';

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html>
      <body>
        <DataProvider nonce={nonce}>{children}</DataProvider>
      </body>
    </html>
  );
}
```

#### Limitations

- Use one `DataProvider` per document. Nested or sibling providers share the same streamed state.
- Only the initial document is transferred. Client-side navigations and `router.refresh()` fetch
  in the browser like any client render.
- With [Partial Prerendering](https://nextjs.org/docs/app/getting-started/partial-prerendering) the
  static shell's state is transferred; data fetched while resuming dynamic holes is fetched again
  in the browser.
- If the same entity is returned with different data by two requests during one render, the
  browser hydrates with the latest one. Boundaries rendered from the earlier value are re-rendered
  by React (a recoverable hydration mismatch in development). Likewise, data the browser fetched on
  its own during streaming fills in anything the server never sent or removed, so a boundary the
  server rendered without that data is re-rendered with it.
- On React 18 (including the version bundled with Next.js 13 and 14), a store update while a
  boundary is still hydrating - a streamed delta, a WebSocket manager, a mutation - can make React
  client-render that boundary. The data is still correct and nothing is refetched, but the server
  DOM nodes are replaced. React 19 keeps them and hydrates at a matching priority instead.

#### Client Components

To keep your data fresh and performant, you can use client components and [useSuspense()](../api/useSuspense.md)

```tsx title="app/todos/[userId]/page.tsx"
'use client';
import { useSuspense } from '@data-client/react';
import { TodoResource } from '@/resources/Todo';

export default function InteractivePage({ params }: { params: { userId: number } }) {
  const todos = useSuspense(TodoResource.getList, params);
  return <TodoList todos={todos} />;
}
```

Note that this is identical to how you would write components without SSR. This makes
makes the components usable across platforms.

#### Server Components

However, if your data never changes, you can slightly decrease the javascript bundle sent, by
using a server component. Simply `await` the endpoint:

```tsx title="app/todos/[userId]/page.tsx"
import { TodoResource } from '@/resources/Todo';

export default async function StaticPage({ params }: { params: { userId: number } }) {
  const todos = await TodoResource.getList(params);
  return <TodoList todos={todos} />;
}
```

#### Demo

<StackBlitz app="nextjs" file="components/todo/TodoList.tsx,app/layout.tsx" view="both" />

#### Class mangling and Entity.key

NextJS will rename classes for production builds. Due to this, it's critical to
define [Entity.key](/rest/api/Entity#key) as its default implementation is based on
the class name.

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Pages Router

With NextJS &lt; 14, you might be using the pages router. For this we have [Document](https://nextjs.org/docs/advanced-features/custom-document)
and NextJS specific wrapper for [App](https://nextjs.org/docs/advanced-features/custom-app)

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

When fetching from parameters from [useRouter()](https://nextjs.org/docs/api-reference/next/router#userouter), you will need to
add getServerSideProps to avoid [NextJS setting router.query to nothing](https://nextjs.org/docs/advanced-features/automatic-static-optimization)

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

#### Further customizing Document

To further customize Document, simply extend from the provided document.

Make sure you use `super.getInitialProps()` instead of `Document.getInitialProps()`
or the Reactive Data Client code won't run!

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

Reactive Data Client Document serializes the store state in a script tag. In case you have
Content Security Policy restrictions that require use of a nonce, you can override
`DataClientDocument.getNonce`.

Since there is no standard way of handling [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
in NextJS, this allows you
to retrieve any nonce you created in the DocumentContext to use with Reactive Data Client.

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

When implementing your own server using express.

### Server side

```tsx
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createPersistedStore,
  createServerDataComponent,
} from '@data-client/react/ssr';

const rootId = 'react-root';

const app = express();
app.get('/*', (req: any, res: any) => {
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
      <ServerDataProvider>{children}</ServerDataProvider>
    </Document>,

    {
      onCompleteShell() {
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

app.listen(3000, () => {
  console.log(`Listening at ${PORT}...`);
});
```

### Client

```tsx
import { hydrateRoot } from 'react-dom';
import { awaitInitialData } from '@data-client/react/ssr';

const rootId = 'react-root';

awaitInitialData().then(initialState => {
  hydrateRoot(
    document.getElementById(rootId),
    <DataProvider initialState={initialState}>{children}</DataProvider>,
  );
});
```
