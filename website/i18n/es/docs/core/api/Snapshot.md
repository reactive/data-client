---
title: Snapshot - Acceso seguro a los datos sin condiciones de carrera
sidebar_label: Snapshot
---

# Snapshot

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointInterfaceSource from '!!raw-loader!../../../packages/endpoint/src/SnapshotInterface.ts';
import CodeBlock from '@theme/CodeBlock';
import GenericsTabs from '@site/src/components/GenericsTabs';
import VoteDemo from '../shared/\_VoteDemo.mdx';

Los snapshots se pasan a las funciones definidas por el usuario que se usan para calcular actualizaciones de estado. Estos
permiten un acceso seguro y eficiente a los datos desnormalizados según el estado actual.

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

Usa [Controller.snapshot()](./Controller.md#snapshot) para construir un snapshot

:::

## Uso {#usage}

<VoteDemo />

## Miembros {#members}

### get(schema, ...args) {#get}

Busca cualquier [Schema](/rest/api/schema#schema-overview) [Queryable](./useQuery.md#queryable).

### getResponse(endpoint, ...args) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

Obtiene la respuesta (globalmente estable por referencia) para un par endpoint/args dado a partir del estado indicado.

#### data {#data}

Los datos de la respuesta desnormalizados. Garantiza estabilidad referencial global para todos sus miembros.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status) {#expirystatus}

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

:::vue

Los componentes de Vue solo se suspenden durante el montaje; los componentes ya montados siguen mostrando sus datos mientras
se vuelven a obtener.

:::

##### Valid {#valid}

- Nunca se suspenderá.
- Podría hacer fetch si los datos están obsoletos

##### InvalidIfStale {#invalidifstale}

- Se suspenderá si los datos están obsoletos.
- Podría hacer fetch si los datos están obsoletos

##### Invalid {#invalid}

- Siempre se suspenderá
- Siempre hará fetch

#### expiresAt {#expiresat}

Un número que representa el momento en que expira. Compáralo con Date.now().

### getError(endpoint, ...args) {#getError}

Obtiene el error, si lo hay, de un endpoint dado. Devuelve undefined si no hay errores.


### fetchedAt {#fetchedat}

Momento en que se llamó al fetch que dio lugar a este snapshot.

### abort {#abort}

Este es un Error que se lanza en [Endpoint.getOptimisticResponse()](/rest/api/RestEndpoint#getoptimisticresponse)
para cancelar una actualización optimista.