---
frameworks: [react]
title: '<ErrorBoundary />'
---

Muestra un componente de reserva cuando se lanza un error (incluido un rechazo de [useSuspense()](./useSuspense.md)).

:::info

Componente reutilizable de error boundary de React.

:::

## Uso {#usage}

Coloca `ErrorBoundary` [en los límites de navegación o por encima de ellos](../getting-started/data-dependency.md#boundaries), como **páginas, rutas o modales**, para "capturar" errores y renderizar una interfaz de reserva.

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

Manejador de suscripción para restablecer el estado de error ante eventos como los cambios de la URL. Es ideal
para colocar un límite que envuelva los componentes de enrutamiento.

Un ejemplo con [Anansi Router](https://www.npmjs.com/package/@anansi/router), que usa la suscripción de
[history](https://www.npmjs.com/package/history).

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

`className` que se reenvía a [fallbackComponent](#fallbackcomponent)
