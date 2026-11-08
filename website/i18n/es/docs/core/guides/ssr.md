---
frameworks: [react]
id: ssr
title: Renderizado del lado del servidor con NextJS, Express y más
sidebar_label: Renderizado del lado del servidor
---

import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Renderizado del lado del servidor

El renderizado del lado del servidor (SSR) hace que la primera carga de la página sea más rápida. Reactive Data Client además envía el store de datos con la
página. Así la página es interactiva en cuanto es visible, y las [mutaciones de datos](../getting-started/mutations.md) son
inmediatas. El cliente no vuelve a hacer fetch de los datos, lo que aumentaría la carga del servidor y ralentizaría la hidratación.

## NextJS SSR {#nextjs}

### App Router {#app-router}

Reactive Data Client es compatible con el App Router de Next.js (el directorio `/app`, Next.js 13 y posteriores). No es compatible con el
Pages Router.

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

Para mantener los datos actualizados, usa componentes de cliente con [useSuspense()](../api/useSuspense.md).

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

Es el mismo código que sin SSR, así que los componentes funcionan en todas las plataformas.

#### Componentes de servidor {#server-components}

Si los datos nunca cambian, un componente de servidor envía algo menos de JavaScript. Usa `await` con el endpoint:

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

Next.js renombra las clases en las compilaciones de producción. El [Entity.key](/rest/api/Entity#key) predeterminado es el nombre de la clase, así que
define siempre `key`.

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

## SSR con Express JS {#express-js-ssr}

Usa esta configuración para tu propio servidor Express.

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
