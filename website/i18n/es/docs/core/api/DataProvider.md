---
frameworks: [react]
title: DataProvider - Gestión de datos asíncronos normalizados en React
sidebar_label: <DataProvider />
description: Gestión de datos de alto rendimiento y globalmente consistente en React
---

import Installation from '../shared/\_installation.mdx';
import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# &lt;DataProvider />

Gestiona el estado y proporciona todo el contexto necesario para usar los hooks. Debe colocarse lo más arriba posible
en el árbol de la aplicación, ya que los hooks solo pueden usarse en los componentes que están por debajo del provider
en el árbol de React.

<Installation />

## Props {#props}

```typescript
interface ProviderProps {
  children: ReactNode;
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: new (props: { gcPolicy: GCInterface }) => Controller;
  gcPolicy?: GCInterface;
  devButton?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | null;
}
```

### initialState: State&lt;unknown\> {#initialState}

<StateType />

En lugar de empezar con una caché vacía, puedes proporcionar tu propio estado inicial. Esto puede
ser útil para pruebas o para rehidratar el estado de la caché al usar renderizado del lado del servidor.

### managers?: Manager[] {#managers}

Lista de [Manager](./Manager.md)s que se usarán. Es el principal punto de extensibilidad del provider.

[getDefaultManagers()](./getDefaultManagers.md) puede usarse para ampliar los managers predeterminados.

Predeterminado en producción:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Predeterminado en desarrollo:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### Controller?: clase Controller {#Controller}

Te permite extender [Controller](./Controller.md) para ofrecer funcionalidad adicional.
Puede ser útil si tienes acciones adicionales que quieres despachar a [Managers](./Manager.md) personalizados

```tsx
import { DataProvider, Controller } from '@data-client/react';
import App from './App';

class MyController extends Controller {
  doSomething = () => {
    console.log('hi');
  };
}

const RealApp = (
  <DataProvider Controller={MyController}>
    <App />
  </DataProvider>
);
```

### gcPolicy?: GCInterface {#gcPolicy}

Elimina datos del store cuando ningún componente los usa y se han vuelto obsoletos. El valor predeterminado es
`new GCPolicy()`.

```tsx
import { DataProvider, GCPolicy } from '@data-client/react';
import App from './App';

const gcPolicy = new GCPolicy({ intervalMS: 60 * 1000 * 10 });

const RealApp = (
  <DataProvider gcPolicy={gcPolicy}>
    <App />
  </DataProvider>
);
```

<GCPolicyOptions />

### devButton {#devbutton}

<img src="/img/client-logo.svg" style={{float:'right',width:'40px'}} />

En desarrollo aparece un pequeño botón que da acceso fácil a las [devtools del navegador](../getting-started/debugging.md), si
están instaladas. Esta opción configura dónde se muestra o, si es null, lo desactiva por completo.

`'bottom-right' | 'bottom-left' | 'top-right'| 'top-left' | null` = `'bottom-right'`

```tsx title="Disable button"
import { DataProvider } from '@data-client/react';
import App from './App';

<DataProvider devButton={null}>
  <App/>
</DataProvider>
```

```tsx title="Place in top right corner"
import { DataProvider } from '@data-client/react';
import App from './App';

<DataProvider devButton="top-right">
  <App/>
</DataProvider>
```
