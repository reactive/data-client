---
title: Snapshot - Acesso seguro a dados sem condições de corrida
sidebar_label: Snapshot
---

# Snapshot

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointInterfaceSource from '!!raw-loader!../../../packages/endpoint/src/SnapshotInterface.ts';
import CodeBlock from '@theme/CodeBlock';
import GenericsTabs from '@site/src/components/GenericsTabs';
import VoteDemo from '../shared/\_VoteDemo.mdx';

Snapshots são passados para funções definidas pelo usuário que calculam atualizações de estado. Eles
permitem acesso seguro e eficiente aos dados desnormalizados com base no estado atual.

```ts
interface Snapshot {
  get(schema, ...args)​ => DenormalizeNullable<typeof schema> | undefined;
  getResponse(endpoint, ...args)​ => { data, expiryStatus, expiresAt };
  getError(endpoint, ...args)​ => ErrorTypes | undefined;
  fetchedAt: number;
  abort: Error;
}
```

:::tip

Use [Controller.snapshot()](./Controller.md#snapshot) para construir um snapshot

:::

## Uso {#usage}

<VoteDemo />

## Membros {#members}

### get(schema, ...args) {#get}

Busca qualquer [Schema](/rest/api/schema#schema-overview) [Queryable](./useQuery.md#queryable).

### getResponse(endpoint, ...args) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

Obtém a resposta (globalmente estável por referência) de um par endpoint/args a partir do estado fornecido.

#### data {#data}

Os dados de resposta desnormalizados. Garante estabilidade referencial global para todos os membros.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

:::vue

Os componentes Vue só suspendem durante a montagem; componentes já montados continuam exibindo seus dados enquanto eles
são buscados novamente.

:::

##### Valid {#valid}

- Nunca suspende.
- Pode fazer fetch se os dados estiverem desatualizados

##### InvalidIfStale {#invalidifstale}

- Suspende se os dados estiverem desatualizados.
- Pode fazer fetch se os dados estiverem desatualizados

##### Invalid {#invalid}

- Sempre suspende
- Sempre faz fetch

#### expiresAt {#expiresat}

Um número que representa o momento em que expira. Compare com Date.now().

### getError(endpoint, ...args) {#getError}

Obtém o erro, se houver, de um determinado endpoint. Retorna undefined quando não há erros.


### fetchedAt {#fetchedat}

Quando o fetch que resultou neste snapshot foi chamado.

### abort {#abort}

Este é um Error a ser lançado em [Endpoint.getOptimisticResponse()](/rest/api/RestEndpoint#getoptimisticresponse)
para cancelar uma atualização otimista.
