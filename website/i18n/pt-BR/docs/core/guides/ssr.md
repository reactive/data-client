---
frameworks: [react]
id: ssr
title: Renderização no servidor com NextJS, Express e mais
sidebar_label: Renderização no servidor
---

import PkgTabs from '@site/src/components/PkgTabs';
import StackBlitz from '@site/src/components/StackBlitz';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Renderização no servidor

A renderização no servidor (SSR) pode melhorar o desempenho do primeiro carregamento da sua aplicação. O Reactive Data
Client vai um passo além ao preencher previamente o store de dados. Diferentemente de outras metodologias de SSR,
o Reactive Data Client se torna interativo no instante em que a página fica visível, tornando as [mutações de dados](../getting-started/mutations.md) instantâneas. Além disso, não há necessidade de fetches de dados adicionais, que aumentam a carga do servidor
e atrasam a hidratação no cliente, podendo causar travamentos na aplicação.

## NextJS SSR {#nextjs}

### App Router {#app-router}

O NextJS 12 inclui uma nova forma de roteamento no diretório '/app'. Isso permite mais
melhorias de desempenho, além de roteamento dinâmico e aninhado.

#### Root Layout {#root-layout}

Coloque o [DataProvider](../api/DataProvider.md) no seu [root layout](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required)

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

#### Client Components {#client-components}

Para manter seus dados atualizados e com bom desempenho, você pode usar client components e [useSuspense()](../api/useSuspense.md)

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

Observe que isso é idêntico a como você escreveria componentes sem SSR. Isso torna
os componentes utilizáveis em várias plataformas.

#### Server Components {#server-components}

No entanto, se seus dados nunca mudam, você pode reduzir um pouco o bundle de javascript enviado
usando um server component. Basta usar `await` no endpoint:

```tsx title="app/todos/[userId]/page.tsx"
import { TodoResource } from '@/resources/Todo';
import TodoList from '@/components/TodoList';

export default async function StaticPage({ params }: { params: { userId: number } }) {
  const todos = await TodoResource.getList(params);
  return <TodoList todos={todos} />;
}
```

#### Demo {#demo}

<StackBlitz app="nextjs" file="components/todo/TodoList.tsx,app/layout.tsx" view="both" />

#### Class mangling e Entity.key {#class-mangling-and-entitykey}

O NextJS renomeia classes nos builds de produção. Por causa disso, é fundamental
definir [Entity.key](/rest/api/Entity#key), já que sua implementação padrão se baseia no
nome da classe.

```ts
class User extends Entity {
  id = '';
  username = '';

  // highlight-next-line
  static key = 'User';
}
```

### Pages Router {#pages-router}

Com o NextJS &lt; 14, você pode estar usando o pages router. Para isso, temos um [Document](https://nextjs.org/docs/advanced-features/custom-document)
e um wrapper específico do NextJS para o [App](https://nextjs.org/docs/advanced-features/custom-app)

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

Ao buscar dados a partir de parâmetros de [useRouter()](https://nextjs.org/docs/api-reference/next/router#userouter), você precisará
adicionar getServerSideProps para evitar que o [NextJS defina router.query como vazio](https://nextjs.org/docs/advanced-features/automatic-static-optimization)

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

#### Personalizando ainda mais o Document {#further-customizing-document}

Para personalizar ainda mais o Document, basta estender o document fornecido.

Certifique-se de usar `super.getInitialProps()` em vez de `Document.getInitialProps()`,
ou o código do Reactive Data Client não será executado!

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

O Document do Reactive Data Client serializa o estado do store em uma tag script. Caso você tenha
restrições de Content Security Policy que exijam o uso de um nonce, você pode sobrescrever
`DataClientDocument.getNonce`.

Como não há uma forma padrão de lidar com [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
no NextJS, isso permite
recuperar qualquer nonce que você tenha criado no DocumentContext para usar com o Reactive Data Client.

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

## SSR com Express JS {#express-js-ssr}

Ao implementar seu próprio servidor usando express.

### Lado do servidor {#server-side}

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
