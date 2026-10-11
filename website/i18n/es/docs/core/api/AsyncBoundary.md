---
frameworks: [react]
title: AsyncBoundary - Centraliza el manejo de carga y errores
sidebar_label: <AsyncBoundary />
description: Maneja los estados de carga y error de Suspense.
---

<head>
  <meta name="docsearch:pagerank" content="20"/>
</head>

import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';


# &lt;AsyncBoundary />

Maneja los estados de carga y error de Suspense.

En React 18 esto creará una [división concurrente](https://react.dev/reference/react/useTransition), y en 16 y 17 mostrará fallbacks de carga. Si hay un error irrecuperable, mostrará un fallback de error.

:::tip

Aprende más sobre dónde colocar los límites viendo cómo [colocalizar las dependencias de datos](../getting-started/data-dependency.md)

:::

## Uso {#usage}

Coloca `AsyncBoundary` [en o por encima de los límites de navegación](../getting-started/data-dependency.md#boundaries) como **páginas, rutas o modales**.

<AsyncBoundaryExamples />

Luego usa [useSuspense()](./useSuspense.md) en los componentes que renderizan los datos. Cualquier error o estado de carga
de *cualquier* descendiente del `<AsyncBoundary />` se renderizará en el `<AsyncBoundary />`. Esta consolidación
de la interfaz de fallback mejora el rendimiento y la usabilidad.

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

Cualquier elemento renderizable (React Node) que se muestra mientras carga

### errorComponent {#errorcomponent}

Componente que maneja los errores capturados

#### Ejemplo de fallback personalizado {#custom-fallback}

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

`className` que se reenvía a [errorComponent](#errorcomponent)

### listen {#listen}

Manejador de suscripción para restablecer el estado de error ante eventos como los cambios de ubicación de la URL. Es ideal
para colocar un límite que envuelva los componentes de enrutamiento.

Un ejemplo con [Anansi Router](https://www.npmjs.com/package/@anansi/router), que usa la suscripción de
[history](https://www.npmjs.com/package/history).

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
