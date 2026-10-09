---
frameworks: [react]
title: '<ErrorBoundary />'
---

Exibe um componente de fallback quando um erro é lançado (incluindo [useSuspense()](./useSuspense.md) rejeitado).

:::info

Componente reutilizável de Error Boundary para React.

:::

## Uso {#usage}

Coloque `ErrorBoundary` [em limites de navegação ou acima deles](../getting-started/data-dependency.md#boundaries), como **páginas, rotas ou modais**, para "capturar" erros e renderizar uma UI de fallback.

```tsx
import React from 'react';
import { ErrorBoundary, useSuspense } from '@data-client/react';
import { MyEndpoint } from './MyEndpoint';

export default function MyPage() {
  return (
    <ErrorBoundary>
      <SuspendingComponent />
    </ErrorBoundary>
  );
}

function SuspendingComponent() {
  const data = useSuspense(MyEndpoint);

  return <div>{data.text}</div>;
}
```

## Props {#props}

```tsx
interface Props<E extends Error> {
  children: React.ReactNode;
  className?: string;
  fallbackComponent: React.ComponentType<{
    error: E;
    resetErrorBoundary: () => void;
    className?: string;
  }>;
  listen?: (resetListener: () => void) => () => void;
}
```

### fallbackComponent {#fallbackcomponent}

```tsx
import React from 'react';
import { DataProvider, ErrorBoundary } from '@data-client/react';
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
      <ErrorBoundary fallbackComponent={ErrorPage} className="error">
        <Router />
      </ErrorBoundary>
    </DataProvider>
  );
}
```

### listen {#listen}

Handler de assinatura para redefinir o estado de erro em eventos como mudanças na URL. É ótimo
para envolver componentes de roteamento com um boundary.

Um exemplo usando o [Anansi Router](https://www.npmjs.com/package/@anansi/router), que usa a
assinatura do [history](https://www.npmjs.com/package/history).

```tsx
import { useRouter, Link, MatchedRoute } from '@anansi/router';
import { ErrorBoundary } from '@data-client/react';

function App() {
  const { history } = useRouter();
  return (
    <div>
      <nav>
        <Link name="Home">Coin App</Link>
      </nav>
      <main>
        // highlight-start
        <ErrorBoundary listen={history.listen}>
          <MatchedRoute index={0} />
        </ErrorBoundary>
        // highlight-end
      </main>
    </div>
  );
}
```

### className {#classname}

`className` a ser repassado para [fallbackComponent](#fallbackcomponent)
