---
frameworks: [react]
title: "<ExternalDataProvider />"
---

import PkgTabs from '@site/src/components/PkgTabs';

Integra stores externos com o `Reactive Data Client`. Deve ser colocado o mais alto possível
na árvore da aplicação, pois o uso dos hooks só é possível para componentes abaixo do provider
na árvore do React.

:::warning

**É um substituto para o [&lt;DataProvider /\>](./DataProvider.md) - NÃO use os dois ao mesmo tempo**

:::

## Instalação {#installation}

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

Veja o [exemplo com redux](../guides/redux.md) para um exemplo mais completo.

## Props {#props}

### store {#store}

```typescript
interface Store<S> {
  subscribe(listener: () => void): () => void;
  getState(): S;
}
```

O store só precisa estar em conformidade com esta interface. Uma implementação comum é um [store do redux](https://redux.js.org/api/store),
mas, em teoria, qualquer store externo pode ser usado.

[Leia mais sobre como integrar o redux.](../guides/redux.md)

### selector {#selector}

```typescript
(state: S) => State<unknown>
```

Esta função é usada para obter a parte da árvore de estado do store específica do `Reactive Data Client`.

### controller {#controller}

Instância do [Controller](./Controller.md) a ser usada.

### devButton {#devbutton}

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

Em desenvolvimento, um pequeno botão aparece dando acesso fácil às devtools do navegador, se
instaladas. Esta opção configura onde ele aparece ou, se for null, o desativa por completo.

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
