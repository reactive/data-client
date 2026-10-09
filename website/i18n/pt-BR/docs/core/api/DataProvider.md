---
frameworks: [react]
title: DataProvider - Gerenciamento normalizado de dados assíncronos no React
sidebar_label: <DataProvider />
description: Gerenciamento de dados de alto desempenho e globalmente consistente no React
---

import Installation from '../shared/\_installation.mdx';
import StateType from '../shared/_state_type.mdx';
import GCPolicyOptions from '../shared/_gc_policy.mdx';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# &lt;DataProvider />

Gerencia o estado, fornecendo todo o contexto necessário para usar os hooks. Deve ser colocado o mais alto possível
na árvore da aplicação, pois qualquer uso dos hooks só é possível em componentes abaixo do provider
na árvore do React.

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

Em vez de começar com um cache vazio, você pode fornecer seu próprio estado inicial. Isso pode
ser útil para testes ou para reidratar o estado do cache ao usar renderização no servidor (server side rendering).

### managers?: Manager[] {#managers}

Lista de [Manager](./Manager.md)s a serem usados. Este é o principal ponto de extensibilidade do provider.

[getDefaultManagers()](./getDefaultManagers.md) pode ser usado para estender os managers padrão.

Padrão em produção:

```typescript
[new NetworkManager(), new SubscriptionManager(PollingSubscription)];
```

Padrão em desenvolvimento:

```typescript
[
  new DevToolsManager(),
  new NetworkManager(),
  new SubscriptionManager(PollingSubscription),
];
```

### Controller?: classe Controller {#Controller}

Isso permite estender o [Controller](./Controller.md) para fornecer funcionalidades adicionais.
Isso pode ser útil se você tiver actions adicionais que deseja despachar para [Managers](./Manager.md) personalizados

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

Remove dados do store quando nenhum componente os usa e eles já estão desatualizados. O padrão é
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

Em desenvolvimento, um pequeno botão aparecerá dando acesso fácil às [devtools do navegador](../getting-started/debugging.md), se
estiverem instaladas. Esta opção configura onde ele aparece ou, se for null, o desativa por completo.

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
