---
title: Snapshot - Safe data access with zero race conditions
sidebar_label: Snapshot
---

# Snapshot

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointInterfaceSource from '!!raw-loader!../../../packages/endpoint/src/SnapshotInterface.ts';
import CodeBlock from '@theme/CodeBlock';
import GenericsTabs from '@site/src/components/GenericsTabs';
import VoteDemo from '../shared/\_VoteDemo.mdx';

Snapshots passed to user-defined function that are used to compute state updates. These
allow safe and performant access to the denormalized data based on the current state.

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

Use [Controller.snapshot()](./Controller.md#snapshot) to construct a snapshot

:::

## Usage

<VoteDemo />

## Members

### get(schema, ...args) {#get}

Looks up any [Queryable](./useQuery.md#queryable) [Schema](/rest/api/schema#schema-overview).

### getResponse(endpoint, ...args) {#getResponse}

```ts title="returns"
{
  data: DenormalizeNullable<E['schema']>;
  expiryStatus: ExpiryStatus;
  expiresAt: number;
}
```

Gets the (globally referentially stable) response for a given endpoint/args pair from state given.

#### data

The denormalize response data. Guarantees global referential stability for all members.

#### [expiryStatus](../concepts/expiry-policy.md#expiry-status)

```ts
export enum ExpiryStatus {
  Invalid = 1,
  InvalidIfStale,
  Valid,
}
```

##### Valid

- Will never suspend.
- Might fetch if data is stale

##### InvalidIfStale

- Will suspend if data is stale.
- Might fetch if data is stale

##### Invalid

- Will always suspend
- Will always fetch

#### expiresAt

A number representing time when it expires. Compare to Date.now().

### getError(endpoint, ...args) {#getError}

Gets the error, if any, for a given endpoint. Returns undefined for no errors.


### fetchedAt

When the fetch was called that resulted in this snapshot.

### abort

This is an Error to be thrown in [Endpoint.getOptimisticResponse()](/rest/api/RestEndpoint#getoptimisticresponse)
to cancel an optimistic update.