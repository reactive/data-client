---
id: ssr
title: Server Side Rendering
---

import PkgInstall from '@site/src/components/PkgInstall';
import PkgTabs from '@site/src/components/PkgTabs';


## NextJS

We've optimized integration into NextJS with a custom [Document](https://nextjs.org/docs/advanced-features/custom-document)
and NextJS specific wrapper for [App](https://nextjs.org/docs/advanced-features/custom-app)

<PkgTabs pkgs="@rest-hooks/ssr @rest-hooks/redux redux" />

```tsx title="pages/_document.tsx"
import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';

export default RestHooksDocument;
```

```tsx  title="pages/_app.tsx"
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

### Demo

<iframe
  src="https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/nextjs?embed=1&file=src%2Fpages%2FHome%2FTodoListComponent.tsx&hidedevtools=1&view=both&ctl=1"
  width="100%"
  height="500"
></iframe>

[Open demo in own tab](https://stackblitz.com/github/coinbase/rest-hooks/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)

### Further customizing Document

To further customize Document, simply extend from the provided document.

Make sure you use `super.getInitialProps()` instead of `Document.getInitialProps()`
or the Rest Hooks code won't run!

```tsx title="pages/_document.tsx"
import { Html, Head, Main, NextScript } from 'next/document'
import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';

export default class MyDocument extends RestHooksDocument {
  static async getInitialProps(ctx) {
    const originalRenderPage = ctx.renderPage

    // Run the React rendering logic synchronously
    ctx.renderPage = () =>
      originalRenderPage({
        // Useful for wrapping the whole react tree
        enhanceApp: (App) => App,
        // Useful for wrapping in a per-page basis
        enhanceComponent: (Component) => Component,
      })

    // Run the parent `getInitialProps`, it now includes the custom `renderPage`
    const initialProps = await super.getInitialProps(ctx)

    return initialProps
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
    )
  }
}
```


### CSP Nonce

Rest Hooks Document serializes the store state in a script tag. In case you have
Content Security Policy restrictions that require use of a nonce, you can override
`RestHooksDocument.getNonce`.

Since there is no standard way of handling [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
in NextJS, this allows you
to retrieve any nonce you created in the DocumentContext to use with Rest Hooks.


```tsx title="pages/_document.tsx"
import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';

export default class MyDocument extends RestHooksDocument {
  static getNonce(ctx: DocumentContext) {
    // this assumes nonce has been added here - customize as you need
    return ctx.res.nonce;
  }
}
```

## Express JS

When implementing your own server using express.

<PkgTabs pkgs="@rest-hooks/ssr @rest-hooks/redux redux" />

### Server side

```tsx
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import {
  createPersistedStore,
  createServerDataComponent,
} from '@rest-hooks/ssr';

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
```

### Client

```tsx
import { hydrateRoot } from 'react-dom';
import { awaitInitialData } from '@rest-hooks/ssr';

const rootId = 'react-root';

awaitInitialData().then(initialState => {
  hydrateRoot(
    document.getElementById(rootId),
    <CacheProvider initialState={initialState}>{children}</CacheProvider>,
  );
});
```
