---
title: LogoutManager - Tratando 401s e outros gatilhos de desautorização
sidebar_label: LogoutManager
---

import StackBlitz from '@site/src/components/StackBlitz';
import ProviderManagers from '../shared/_provider_managers.mdx';

# LogoutManager

Faz logout com base nas respostas de fetch. Por padrão, isso é disparado por respostas com status [401 (Unauthorized)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401).

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

### Handler de logout personalizado {#custom-logout-handler}

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

Use [controller.invalidateAll](./Controller.md#invalidateAll) para limpar apenas parte do cache.

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

## Membros {#members}

### handleLogout(controller) {#handlelogoutcontroller}

Por padrão, simplesmente chama [controller.resetEntireStore()](./Controller.md#resetEntireStore)

Isso deve ser suficiente se o estado de login for determinado pela existência de uma entity de usuário no store do Reactive Data Client. No entanto,
você pode sobrescrever este método via herança se mais coisas precisarem ser feitas.

### shouldLogout(error) {#shouldlogouterror}

```ts
protected shouldLogout(error: UnknownError) {
  // 401 indicates reauthorization is needed
  return error.status === 401;
}
```

:::react

## Exemplo do Github {#github-example}

<StackBlitz app="github-app" file="src/RootProvider.tsx" view="editor" />

:::
