---
frameworks: [react]
title: AsyncBoundary - Centralize o tratamento de carregamento e erros
sidebar_label: <AsyncBoundary />
description: Trata as condições de carregamento e de erro do Suspense.
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';


# &lt;AsyncBoundary />

Trata as condições de carregamento e de erro do Suspense.

No React 18, isso cria uma [divisão concorrente](https://react.dev/reference/react/useTransition); no 16 e no 17, exibe fallbacks de carregamento. Se houver um erro irrecuperável, exibe um fallback de erro.

:::tip

Saiba mais sobre o posicionamento de boundaries aprendendo a [co-localizar dependências de dados](../getting-started/data-dependency.md)

:::

## Uso {#usage}

Coloque o `AsyncBoundary` [nos limites de navegação ou acima deles](../getting-started/data-dependency.md#boundaries), como **páginas, rotas ou modais**.

<AsyncBoundaryExamples />

Depois, use [useSuspense()](./useSuspense.md) nos componentes que renderizam os dados. Quaisquer erros ou estados de carregamento
de *qualquer* descendente do `<AsyncBoundary />` serão renderizados no `<AsyncBoundary />`. Essa consolidação
da UI de fallback melhora o desempenho e a usabilidade.

```ts
function SuspendingComponent() {
  const data = useSuspense(getMyThing);

  return <div>{data.text}</div>;
}
```

## Props {#props}

```ts
interface BoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorClassName?: string;
  errorComponent?: React.ComponentType<{
    error: NetworkError;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallback {#fallback}

Qualquer elemento renderizável (React Node) a ser exibido durante o carregamento

### errorComponent {#errorcomponent}

Componente para tratar os erros capturados

#### Exemplo de fallback personalizado {#custom-fallback}

```tsx
import React from 'react';
import { DataProvider, AsyncBoundary } from '@data-client/react';
import Router from './Router';

function ErrorPage({
  error,
  className,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}) {
  return (
    <pre role="alert" className={className}>
      {error.message} <button onClick={resetErrorBoundary}>Reset</button>
    </pre>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AsyncBoundary fallback="loading" errorComponent={ErrorPage}>
        <Router />
      </AsyncBoundary>
    </DataProvider>
  );
}
```

### errorClassName {#errorclassname}

`className` a ser repassado ao [errorComponent](#errorcomponent)

### listen {#listen}

Handler de assinatura para redefinir o estado de erro em eventos como mudanças na URL. É ótimo
para posicionar um boundary que envolve componentes de roteamento.

Um exemplo usando o [Anansi Router](https://www.npmjs.com/package/@anansi/router), que usa a
assinatura do [history](https://www.npmjs.com/package/history).

```tsx
import { useRouter, Link, MatchedRoute } from '@anansi/router';
import { AsyncBoundary } from '@data-client/react';

function App() {
  const { history } = useRouter();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <AsyncBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </AsyncBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```
