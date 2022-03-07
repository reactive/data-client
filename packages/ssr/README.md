# Rest Hooks Server Side Rendering helpers

[![CircleCI](https://circleci.com/gh/coinbase/rest-hooks/tree/master.svg?style=shield)](https://circleci.com/gh/coinbase/rest-hooks)
[![Coverage Status](https://img.shields.io/codecov/c/gh/coinbase/rest-hooks/master.svg?style=flat-square)](https://app.codecov.io/gh/coinbase/rest-hooks?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@rest-hooks/ssr.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/ssr)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@rest-hooks/ssr?style=flat-square)](https://bundlephobia.com/result?p=@rest-hooks/ssr)
[![npm version](https://img.shields.io/npm/v/@rest-hooks/ssr.svg?style=flat-square)](https://www.npmjs.com/package/@rest-hooks/ssr)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Chat](https://img.shields.io/discord/768254430381735967.svg?style=flat-square&colorB=758ED3)](https://discord.gg/35nb8Mz)

<div align="center">

**[📖Read The Docs](https://resthooks.io/docs/guides/ssr)**

</div>

Hydrate/dehydration utilities for [Rest Hooks](https://resthooks.io)

## Server side

```tsx
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import { createPersistedCacheProvder } from '@rest-hooks/ssr';

const app = express();
app.get('/*', (req: any, res: any) => {
  const [ServerCacheProvider, controller] = createPersistedCacheProvder();

  controller.fetch(NeededForPage, { id: 5 });

  const { pipe, abort } = renderToPipeableStream(
    <Document assets={assets}>
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
import { getDatafromDOM } from '@rest-hooks/ssr';

const data = getDatafromDOM();
hydrateRoot(
  document,
  <Document assets={assets}>
    <CacheProvider initialState={data}>
      {children}
      <ServerDataComponent data={data} />
    </CacheProvider>
  </Document>,
);
```

## API

### createPersistedStore(managers) => [ServerCacheProvider, controller]

Used to server side render cache. Renders &lt;ServerDataComponent/> inside to serialize cache so client can hydrate.

### ServerDataComponent

Hydrate/dehydrates Rest Hooks cache. Contents are a script with JSON encoding of cache state sent from server.

### getDatafromDOM()

Loads data from ServerDataComponent to initialize cache.
