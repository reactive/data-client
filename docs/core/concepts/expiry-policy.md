---
title: Controlling automatic fetch behavior with declarative Expiry Policies
sidebar_label: Expiry Policy
description: When data is considere Fresh, Stale, or Invalid. And how that state affects fetching and rendering.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';

# Endpoint Expiry Policy

By default, Reactive Data Client cache policy can be described as [stale-while-revalidate](https://web.dev/stale-while-revalidate/).
This means that when data is available it can avoid blocking the application by using the stale data. However, in the background
it will still refresh the data if old enough.

## Expiry status

### Fresh

Data in this state is considered new enough that it doesn't need to fetch.

### Stale

Data is still allowed to be shown, however Reactive Data Client might attempt to revalidate by fetching again.

[useSuspense()](../api/useSuspense.md) considers fetching on mount as well as when its parameters change.
In these cases it will fetch if the data is considered stale.

:::info React Native

When using React Navigation, [focus events](https://reactnavigation.org/docs/use-focus-effect/) also trigger fetches for stale data.

:::

### Invalid

Data should not be shown. Any components needing this data will trigger fetch and suspense. If
no components care about this data no action will be taken.

## Expiry Time

### Endpoint.dataExpiryLength

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) sets how long (in miliseconds) it takes for data
to transition from '[fresh](#fresh)' to '[stale](#stale)' status. Try setting it to a very low number like '50'
to make it becomes [stale](#stale) almost instantly; or a very large number to stay around for a long time.

Toggling between 'first' and 'second' changes the parameters. If the data is still considered fresh
you will continue to see the old time without any refresh.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="TimePage"
import { lastUpdated } from './api/lastUpdated';

const getUpdated = lastUpdated.extend({ dataExpiryLength: 10000 });

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="Navigator" collapsed
import TimePage from './TimePage';

function Navigator() {
  const [id, setId] = React.useState('1');
  const handleChange = e => setId(e.currentTarget.value);
  return (
    <div>
      <div>
        <button value="1" onClick={handleChange}>
          First
        </button>
        <button value="2" onClick={handleChange}>
          Second
        </button>
      </div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id={id} />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<Navigator />);
```

</HooksPlayground>

<details>
<summary><b>@data-client/rest</b></summary>

Long cache lifetime

```typescript title="LongLivingResource.ts"
import {
  RestEndpoint,
  RestGenerics,
  resource,
} from '@data-client/rest';

// We can now use LongLivingEndpoint to create endpoints that will be cached for one hour
class LongLivingEndpoint<
  O extends RestGenerics,
> extends RestEndpoint<O> {
  dataExpiryLength = 60 * 60 * 1000; // one hour
}

const LongLivingResource = resource({
  path: '/:id',
  Endpoint: LongLivingEndpoint,
});
```

Never retry on error

```typescript title="NoRetryResource.ts"
import {
  RestEndpoint,
  RestGenerics,
  resource,
} from '@data-client/rest';

// We can now use NoRetryEndpoint to create endpoints that will be cached for one hour
class NoRetryEndpoint<
  O extends RestGenerics,
> extends RestEndpoint<O> {
  errorExpiryLength = Infinity;
}

const NoRetryResource = resource({
  path: '/:id',
  Endpoint: NoRetryEndpoint,
});
```

</details>

### Endpoint.invalidIfStale

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) eliminates the '[stale](#stale)' status, making data
that expires immediately be considered '[invalid](#invalid)'.

This is demonstrated by the component suspending once its data goes stale. If the data is still
within the expiry time it just continues to display it.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="TimePage"
import { lastUpdated } from './api/lastUpdated';

const getUpdated = lastUpdated.extend({
  invalidIfStale: true,
  dataExpiryLength: 5000,
});

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="Navigator" collapsed
import TimePage from './TimePage';

function Navigator() {
  const [id, setId] = React.useState('1');
  const handleChange = e => setId(e.currentTarget.value);
  return (
    <div>
      <div>
        <button value="1" onClick={handleChange}>
          First
        </button>
        <button value="2" onClick={handleChange}>
          Second
        </button>
      </div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id={id} />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<Navigator />);
```

</HooksPlayground>

## Force refresh

We sometimes want to fetch new data; while continuing to show the old (stale) data.

### A specific endpoint

[Controller.fetch](../api/Controller#fetch) can be used to trigger a fetch while still showing
the previous data. This can be done even with 'fresh' data.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="ShowTime"
import { lastUpdated } from './api/lastUpdated';

function ShowTime() {
  const { updatedAt } = useSuspense(lastUpdated, { id: '1' });
  const ctrl = useController();
  return (
    <div>
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>{' '}
      <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
        Refresh
      </button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

### Refresh visible endpoints

[Controller.expireAll()](../api/Controller.md#expireAll) sets all responses' [expiry status](#expiry-status) matching `testKey` to [Stale](#stale).

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="ShowTime" collapsed
import { lastUpdated } from './api/lastUpdated';

export default function ShowTime({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  const ctrl = useController();
  return (
    <div>
      <b>{id}</b>{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="Loading" collapsed
export default function Loading({ id }: { id: string }) {
  return <div>{id} Loading...</div>;
}
```

```tsx title="Demo"
import { AsyncBoundary } from '@data-client/react';

import { lastUpdated } from './api/lastUpdated';
import ShowTime from './ShowTime';
import Loading from './Loading';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<Loading id="1" />}>
        <ShowTime id="1" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="2" />}>
        <ShowTime id="2" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="3" />}>
        <ShowTime id="3" />
      </AsyncBoundary>

      <button onClick={() => ctrl.expireAll(lastUpdated)}>
        Expire All
      </button>
      <button onClick={() => ctrl.fetch(lastUpdated, { id: '1' })}>
        Force Refresh First
      </button>
    </div>
  );
}
render(<Demo />);
```

</HooksPlayground>

## Invalidate (re-suspend) {#invalidate}

Both [endpoints](/rest/api/Endpoint) and [entities](/rest/api/Entity) can be targetted to be invalidated.

### A specific endpoint {#invalidate-endpoint}

In this example we can see [invalidating the endpoint](../api/Controller.md#invalidate) shows the loading fallback since the data is not allowed to be displayed.

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="ShowTime" collapsed
import { lastUpdated } from './api/lastUpdated';

export default function ShowTime({ id }: { id: string }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  const ctrl = useController();
  return (
    <div>
      <b>{id}</b>{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="Loading" collapsed
export default function Loading({ id }: { id: string }) {
  return <div>{id} Loading...</div>;
}
```

```tsx title="Demo"
import { AsyncBoundary } from '@data-client/react';

import { lastUpdated } from './api/lastUpdated';
import ShowTime from './ShowTime';
import Loading from './Loading';

function Demo() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<Loading id="1" />}>
        <ShowTime id="1" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="2" />}>
        <ShowTime id="2" />
      </AsyncBoundary>
      <AsyncBoundary fallback={<Loading id="3" />}>
        <ShowTime id="3" />
      </AsyncBoundary>

      <button onClick={() => ctrl.invalidateAll(lastUpdated)}>
        Invalidate All
      </button>
      <button
        onClick={() => ctrl.invalidate(lastUpdated, { id: '1' })}
      >
        Invalidate First
      </button>
    </div>
  );
}
render(<Demo />);
```

</HooksPlayground>

### Any endpoint with an entity {#invalidate-entity}

Using the [Invalidate schema](/rest/api/Invalidate) allows us to invalidate _any_ endpoint that includes that relies on that [entity](/rest/api/Entity) in their
response. If the endpoint uses the entity in an [Array](/rest/api/Array), it will simply be removed from that [Array](/rest/api/Array).

<HooksPlayground fixtures={[
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
}),
response({ id }) {
return ({
id,
updatedAt: new Date().toISOString(),
});
},
delay: () => 200,
},
{
endpoint: new RestEndpoint({
path: '/api/currentTime/:id',
method: 'DELETE',
}),
response({ id }) {
return {id}
},
delay: () => 150,
}
]}

>

```ts title="api/lastUpdated" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class TimedEntity extends Entity {
  id = '';
  updatedAt = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    updatedAt: Temporal.Instant.from,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="TimePage" collapsed
import { lastUpdated } from './api/lastUpdated';

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(lastUpdated, { id });
  return (
    <div>
      API time for {id}:{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="ShowTime"
import { Invalidate } from '@data-client/rest';
import { useLoading } from '@data-client/react';
import { TimedEntity } from './api/lastUpdated';
import TimePage from './TimePage';

const InvalidateTimedEntity = new Invalidate(TimedEntity);
export const deleteLastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  method: 'DELETE',
  schema: InvalidateTimedEntity,
});

function ShowTime() {
  const ctrl = useController();
  const [handleDelete, loadingDelete] = useLoading(
    () => ctrl.fetch(deleteLastUpdated, { id: '1' }),
    [],
  );
  return (
    <div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id="1" />
      </AsyncBoundary>
      <div>
        Current Time: <CurrentTime />
      </div>
      <button onClick={handleDelete}>
        {loadingDelete ? 'loading...' : 'Invalidate'}
      </button>
      <button
        onClick={() =>
          ctrl.setResponse(
            deleteLastUpdated,
            { id: '1' },
            { id: '1' },
          )
        }
      >
        Invalidate (without fetching DELETE)
      </button>
      <button
        onClick={() =>
          ctrl.set(
            InvalidateTimedEntity,
            { id: '1' },
            { id: '1' },
          )
        }
      >
        Invalidate Entity with ctrl.set
      </button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

[Controller.fetch()](../api/Controller.md#fetch) lets us update the server and store.
We can use [Controller.setResponse()](../api/Controller.md#setResponse) or [Controller.set()](../api/Controller.md#set)
when we want to change the local store directly.

#### Conditional Invalidation based on data

If `invalidation` should happen only sometimes, based on the response data, we can 
return `undefined` from [Entity.process](/rest/api/Entity#process).

```ts
class PriceLevel extends Entity {
  price = 0;
  amount = 0;

  pk() {
    return this.price;
  }

  static process(
    input: [number, number],
    parent: any,
    key: string | undefined,
  ): any {
    const [price, amount] = input;
    // highlight-next-line
    if (amount === 0) return undefined;
    return { price, amount };
  }
}
```