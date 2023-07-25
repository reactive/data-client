---
id: ssr
title: Server Side Rendering
---

import PkgTabs from '@site/src/components/PkgTabs';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <title>Server Side Rendering Integrations - NextJS, Express</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

## NextJS

We've optimized integration into NextJS with a custom [Document](https://nextjs.org/docs/advanced-features/custom-document)
and NextJS specific wrapper for [App](https://nextjs.org/docs/advanced-features/custom-app)

<PkgTabs pkgs="@data-client/ssr @data-client/redux redux" />

```tsx title="pages/_document.tsx"
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default DataClientDocument;
```

```tsx title="pages/_app.tsx"
import { AppCacheProvider } from '@data-client/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

:::caution

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

### Demo

<StackBlitz app="nextjs" file="pages/AssetPrice.tsx" view="both" />

### Further customizing Document

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

### CSP Nonce

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

### Class mangling and Entity.key

NextJS will rename classes for production builds. Due to this, it's critical to
define [Entity.key](/rest/api/Entity#key) as its default implementation is based on
the class name.

```ts
class User extends Entity {
  id = '';
  username = '';

  pk() { return this.id }

  // highlight-next-line
  static key = 'User';
}
```

## Express JS

When implementing your own server using express.

<PkgTabs pkgs="@data-client/ssr @data-client/redux redux" />

### Server side

```tsx
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createPersistedStore,
  createServerDataComponent,
} from '@data-client/ssr';

const rootId = 'react-root';

const app = express();
app.get('/*', (req: any, res: any) => {
  const [ServerCacheProvider, useReadyCacheState, controller] =
    createPersistedStore();
  const ServerDataComponent = createServerDataComponent(useReadyCacheState);

  controller.fetch(NeededForPage, { id: 5 });

  const { pipe, abort } = renderToPipeableStream(
    <Document
      assets={assets}
      scripts={[<ServerDataComponent key="server-data" />]}
      rootId={rootId}
    >
      <ServerCacheProvider>{children}</ServerCacheProvider>
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
````

### Client

```tsx
import { hydrateRoot } from 'react-dom';
import { awaitInitialData } from '@data-client/ssr';

const rootId = 'react-root';

awaitInitialData().then(initialState => {
  hydrateRoot(
    document.getElementById(rootId),
    <CacheProvider initialState={initialState}>{children}</CacheProvider>,
  );
});
```
