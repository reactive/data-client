---
title: LogoutManager - Gestión de 401 y otros desencadenantes de desautorización
sidebar_label: LogoutManager
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# LogoutManager

Cierra la sesión según las respuestas de fetch. De forma predeterminada se activa con las respuestas de estado [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401).

:::info implements

`LogoutManager` implements [Manager](./Manager.md)

:::

## Uso {#usage}

<ProviderManagers imports={['LogoutManager', 'getDefaultManagers']}>

```ts
// highlight-next-line
const managers = [new LogoutManager(), ...getDefaultManagers()];
```

</ProviderManagers>

### Manejador de logout personalizado {#custom-logout-handler}

```ts
import { unAuth } from '../authentication';

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      controller.resetEntireStore();
    },
  }),
  ...getDefaultManagers(),
];
```

:::tip

Usa [controller.invalidateAll](./Controller.md#invalidateAll) para borrar solo una parte de la caché.

```ts
import { unAuth } from '../authentication';

const myDomain = 'http://test.com';
// highlight-next-line
const testKey = (key: string) => key.startsWith(`GET ${myDomain}`);

const managers = [
  new LogoutManager({
    handleLogout(controller) {
      // call custom unAuth function we defined
      unAuth();
      // still reset the store
      // highlight-next-line
      controller.invalidateAll({ testKey });
    },
  }),
  ...getDefaultManagers(),
];
```

:::

## Miembros {#members}

### handleLogout(controller) {#handlelogoutcontroller}

De forma predeterminada simplemente llama a [controller.resetEntireStore()](./Controller.md#resetEntireStore)

Esto debería ser suficiente si el estado de inicio de sesión se determina por la existencia de una entidad de usuario en el store de Reactive Data Client. Sin embargo,
puedes sobrescribir este método mediante herencia si hay que hacer más cosas.

### shouldLogout(error) {#shouldlogouterror}

```ts
protected shouldLogout(error: UnknownError) {
  // 401 indicates reauthorization is needed
  return error.status === 401;
}
```

:::react

## Ejemplo de Github {#github-example}

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />

:::
