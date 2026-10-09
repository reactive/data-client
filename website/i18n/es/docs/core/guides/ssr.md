---
frameworks: [react]
id: ssr
title: Renderizado del lado del servidor con NextJS, Express y más
sidebar_label: Renderizado del lado del servidor
---

import PkgTabs from '@site/src/components/PkgTabs';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Renderizado del lado del servidor

El renderizado del lado del servidor (SSR) puede mejorar el rendimiento de la primera carga de tu aplicación. Reactive Data
Client da un paso más al rellenar previamente el store de datos. A diferencia de otras metodologías de SSR,
Reactive Data Client se vuelve interactivo en el momento en que la página es visible, lo que hace que las [mutaciones de datos](../getting-started/mutations.md) sean instantáneas. Además, no hacen falta fetches de datos adicionales que aumenten la carga
del servidor y ralenticen la hidratación del cliente, lo que podría provocar tirones en la aplicación.

## NextJS SSR {#nextjs}

### App Router {#app-router}

NextJS 12 incluye una nueva forma de enrutamiento en el directorio '/app'. Esto permite más
mejoras de rendimiento, así como enrutamiento dinámico y anidado.

#### Layout raíz {#root-layout}

Coloca [DataProvider](../api/DataProvider.md) en tu [layout raíz](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required)

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

#### Componentes de cliente {#client-components}

Para mantener tus datos actualizados y con buen rendimiento, puedes usar componentes de cliente y [useSuspense()](../api/useSuspense.md)

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

Ten en cuenta que esto es idéntico a cómo escribirías los componentes sin SSR. Esto hace
que los componentes se puedan usar en distintas plataformas.

#### Componentes de servidor {#server-components}

Sin embargo, si tus datos nunca cambian, puedes reducir ligeramente el bundle de javascript enviado
usando un componente de servidor. Simplemente usa `await` con el endpoint:

```tsx title="app/todos/[userId]/page.tsx"
import { TodoResource } from '@/resources/Todo';
import TodoList from '@/components/TodoList';

export default async function StaticPage({ params }: { params: { userId: number } }) {
  const todos = await TodoResource.getList(params);
  return <TodoList todos={todos} />;
}
```

#### Demostración {#demo}

<StackBlitz app="nextjs" file="components/todo/TodoList.tsx,app/layout.tsx" view="both" />

#### Alteración de nombres de clases y Entity.key {#class-mangling-and-entitykey}

NextJS renombra las clases en las compilaciones de producción. Por eso, es fundamental
definir [Entity.key](/rest/api/Entity#key), ya que su implementación predeterminada se basa en
el nombre de la clase.

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Pages Router {#pages-router}

Con NextJS &lt; 14, es posible que uses el pages router. Para ello tenemos [Document](https://nextjs.org/docs/advanced-features/custom-document)
y un wrapper específico de NextJS para [App](https://nextjs.org/docs/advanced-features/custom-app)

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

Al obtener datos a partir de parámetros de [useRouter()](https://nextjs.org/docs/api-reference/next/router#userouter), necesitarás
agregar getServerSideProps para evitar que [NextJS deje router.query vacío](https://nextjs.org/docs/advanced-features/automatic-static-optimization)

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

#### Personalizar Document aún más {#further-customizing-document}

Para personalizar Document aún más, simplemente extiende el documento proporcionado.

Asegúrate de usar `super.getInitialProps()` en lugar de `Document.getInitialProps()`
o el código de Reactive Data Client no se ejecutará.

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

#### Nonce de CSP {#csp-nonce}

El Document de Reactive Data Client serializa el estado del store en una etiqueta script. Si tienes
restricciones de Content Security Policy que exigen el uso de un nonce, puedes sobrescribir
`DataClientDocument.getNonce`.

Como no existe una forma estándar de manejar el [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
en NextJS, esto te permite
recuperar cualquier nonce que hayas creado en el DocumentContext para usarlo con Reactive Data Client.

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

## SSR con Express JS {#express-js-ssr}

Al implementar tu propio servidor con express.

### Lado del servidor {#server-side}

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

### Cliente {#client}

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
