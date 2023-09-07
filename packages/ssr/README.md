# Data Client Server Side Rendering helpers

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/ssr.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/ssr)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/ssr?style=flat-square)](https://bundlephobia.com/result?p=@data-client/ssr)
[![npm version](https://img.shields.io/npm/v/@data-client/ssr.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/ssr)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

<div align="center">

**[📖Read The Docs](https://dataclient.io/docs/guides/ssr)** &nbsp;|&nbsp;
[🎮NextJS SSR Demo](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=pages%2FAssetPrice.tsx)

</div>

Hydrate/dehydration utilities for [Data Client](https://dataclient.io)

## Server side

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
```

## Client

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

## NextJS

We've optimized integration into NextJS with a custom [Document](https://nextjs.org/docs/advanced-features/custom-document)
and NextJS specific wrapper for [App](https://nextjs.org/docs/advanced-features/custom-app)

<details open><summary><b>pages/_document.tsx</b></summary>

```tsx
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default DataClientDocument;
```

</details>

<details open><summary><b>pages/_app.tsx</b></summary>

```tsx
import { AppCacheProvider } from '@data-client/ssr/nextjs';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

</details>

### Further customizing Document

To further customize Document, simply extend from the provided document.

Make sure you use `super.getInitialProps()` instead of `Document.getInitialProps()`
or the Data Client code won't run!

<details open><summary><b>pages/_document.tsx</b></summary>

```tsx
import { Html, Head, Main, NextScript } from 'next/document'
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default class MyDocument extends DataClientDocument {
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

</details>

### CSP Nonce

Data Client Document serializes the store state in a script tag. In case you have
Content Security Policy restrictions that require use of a nonce, you can override
`DataClientDocument.getNonce`.

Since there is no standard way of handling [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
in NextJS, this allows you
to retrieve any nonce you created in the DocumentContext to use with Data Client.

<details open><summary><b>pages/_document.tsx</b></summary>

```tsx
import { DataClientDocument } from '@data-client/ssr/nextjs';

export default class MyDocument extends DataClientDocument {
  static getNonce(ctx: DocumentContext) {
    // this assumes nonce has been added here - customize as you need
    return ctx.res.nonce;
  }
}
```

</details>

## API

### createPersistedStore(managers) => [ServerCacheProvider, useReadyCacheState, controller, store]

Used to server side render cache. Renders &lt;ServerDataComponent/> inside to serialize cache so client can hydrate.

### createServerDataComponent(useReadyCacheState, id = 'data-client-data')

Contents are a script with JSON encoding of cache state sent from server. Be sure to place outside hydration
element so React will not need to hydrate it.

### getInitialData(id = 'data-client-data') => Promise(State)

Resolves promise with serialized initialState to pass to &lt;CacheProvider />
