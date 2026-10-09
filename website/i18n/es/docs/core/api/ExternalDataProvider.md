---
frameworks: [react]
title: "<ExternalDataProvider />"
---

import PkgTabs from '@site/src/components/PkgTabs';

Integra stores externos con `Reactive Data Client`. Debe colocarse lo más arriba posible
en el árbol de la aplicación, ya que los hooks solo se pueden usar en componentes que estén por debajo del provider
en el árbol de React.

:::warning

**Es un reemplazo de [&lt;DataProvider /\>](./DataProvider.md); NO uses ambos a la vez**

:::

## Instalación {#installation}

## Uso {#usage}

```tsx title="index.tsx"
import { ExternalDataProvider } from '@data-client/react/redux';
import { createRoot } from 'react-dom/client';

import { store, selector, controller } from './store';
import App from './App';

createRoot(document.body).render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <App />
  </ExternalDataProvider>,
);
```

Consulta el [ejemplo con redux](../guides/redux.md) para ver un ejemplo más completo.

## Props {#props}

### store {#store}

```typescript
interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
}
```

El store solo necesita ajustarse a esta interfaz. Una implementación común es un [store de redux](https://redux.js.org/api/store),
pero en teoría se podría usar cualquier store externo.

[Lee más sobre cómo integrar redux.](../guides/redux.md)

### selector {#selector}

```typescript
(state: S) => State<unknown>
```

Esta función se usa para obtener la parte del árbol de estado del store que corresponde a `Reactive Data Client`.

### controller {#controller}

Instancia de [Controller](./Controller.md) que se usará.

### devButton {#devbutton}

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

En desarrollo aparece un pequeño botón que da acceso fácil a las devtools del navegador, si están
instaladas. Esta opción configura dónde aparece, o, si es null, lo deshabilita por completo.

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null` = `'bottom-right'`

```tsx title="Disable button"
import { ExternalDataProvider } from '@data-client/react/redux';
import { store, selector, controller } from './store';
import App from './App';

<ExternalDataProvider
  store={store}
  selector={selector}
  controller={controller}
  devButton={null}
>
  <App />
</ExternalDataProvider>;
```

```tsx title="Place in top right corner"
import { ExternalDataProvider } from '@data-client/react/redux';
import { store, selector, controller } from './store';
import App from './App';

<ExternalDataProvider
  store={store}
  selector={selector}
  controller={controller}
  devButton="top-right"
>
  <App />
</ExternalDataProvider>;
```
