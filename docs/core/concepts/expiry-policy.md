---
title: Expiry Policy
sidebar_label: Expiry Policy
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

By default, Rest Hooks cache policy can be described as [stale-while-revalidate](https://web.dev/stale-while-revalidate/).
This means that when data is available it can avoid blocking the application by using the stale data. However, in the background
it will still refresh the data if old enough.

To explain these concepts we'll be faking an endpoint that gives us the current time so it is easy to tell how stale it is.

```tsx title="lastUpdated"
class TimedEntity extends Entity {
  id = '';
  updatedAt = new Date(0);

  pk() {
    return this.id;
  }
  static schema = {
    updatedAt: Date,
  };
}
const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

## Expiry status

### Fresh

Data in this state is considered new enough that it doesn't need to fetch.

### Stale

Data is still allowed to be shown, however Rest Hooks might attempt to revalidate by fetching again.

[useSuspense()](../api/useSuspense.md) considers fetching on mount as well as when its parameters change.
In these cases it will fetch if the data is considered stale.

### Invalid

Data should not be shown. Any components needing this data will trigger fetch and suspense. If
no components care about this data no action will be taken.

## Expiry Time

### Endpoint.dataExpiryLength

[Endpoint.dataExpiryLength](/rest/api/Endpoint#dataexpirylength) sets how long (in miliseconds) it takes for data
to transition from 'fresh' to 'stale' status. Try setting it to a very low number like '50'
to make it becomes stale almost instantly; or a very large number to stay around for a long time.

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
  updatedAt = new Date(0);

  pk() {
    return this.id;
  }
  static schema = {
    updatedAt: Date,
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

function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API Time:{' '}
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>
    </div>
  );
}

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
      <TimePage id={id} />
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<Navigator />);
```

</HooksPlayground>

<details><summary><b>@rest-hooks/rest</b></summary>

## Examples

To apply to all of a [Resource's endpoints](/rest/api/createResource), use [getEndpointExtra](/rest/api/RestEndpoint#getEndpointExtra)

### Long cache lifetime

```typescript title="LongLivingResource.ts"
import { RestEndpoint, RestGenerics, createResource } from '@rest-hooks/rest';

// We can now use LongLivingEndpoint to create endpoints that will be cached for one hour
class LongLivingEndpoint<O extends RestGenerics> extends RestEndpoint<O> {
  dataExpiryLength = 60 * 60 * 1000; // one hour
}

const LongLivingResource = createResource({
  path: '/:id',
  Endpoint: LongLivingEndpoint,
});
```

### Never retry on error

```typescript title="NoRetryResource.ts"
import { RestEndpoint, RestGenerics, createResource } from '@rest-hooks/rest';

// We can now use NoRetryEndpoint to create endpoints that will be cached for one hour
class NoRetryEndpoint<O extends RestGenerics> extends RestEndpoint<O> {
  errorExpiryLength = Infinity;
}

const NoRetryResource = createResource({
  path: '/:id',
  Endpoint: NoRetryEndpoint,
});
```

</details>

### Endpoint.invalidIfStale

[Endpoint.invalidIfStale](/rest/api/Endpoint#invalidifstale) eliminates the `stale` status, making data
that expires immediately be considered 'invalid'.

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
  updatedAt = new Date(0);
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
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

function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  return (
    <div>
      API Time:{' '}
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>
    </div>
  );
}

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
      <TimePage id={id} />
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
  updatedAt = new Date(0);
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
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
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
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

## Invalidate (re-suspend) {#invalidate}

Both endpoints and entities can be targetted to be invalidated.

### A specific endpoint

In this example we can see invalidating the endpoint shows the loading fallback since the data is not allowed to be displayed.

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
  updatedAt = new Date(0);
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
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
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
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
import { AsyncBoundary } from '@rest-hooks/react';

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
      <button onClick={() => ctrl.invalidate(lastUpdated, { id: '1' })}>
        Invalidate First
      </button>
    </div>
  );
}
render(<Demo />);
```

</HooksPlayground>

### Any endpoint with an entity

Using [Delete](/rest/api/Delete) allows us to invalidate _any_ endpoint that includes that relies on that entity in their
response. If the endpoint uses the entity in an Array, it will simply be removed from that Array.

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
export class TimedEntity extends Entity {
  id = '';
  updatedAt = new Date(0);
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});

```

```tsx title="ShowTime"
import { lastUpdated, TimedEntity } from './api/lastUpdated';

export const deleteLastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  method: 'DELETE',
  schema: new schema.Delete(TimedEntity),
});

function ShowTime() {
  const { updatedAt } = useSuspense(lastUpdated, { id: '1' });
  const ctrl = useController();
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <button onClick={() => ctrl.fetch(deleteLastUpdated, { id: '1' })}>
        Delete
      </button>
      <button onClick={() => ctrl.setResponse(deleteLastUpdated, { id: '1' }, { id: '1' })}>
        Delete (with no fetch)
      </button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

[Controller.fetch()](../api/Controller.md#fetch) lets us update the server and store.
We can use [Controller.setResponse()](../api/Controller.md#setResponse) for cases where we
simply want to change the local store without updating the server.

## Error policy

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) controls cache behavior upon a fetch rejection.
It uses the rejection error to determine whether it should be treated as 'soft' or 'hard' error.

### Soft

Soft errors will not invalidate a response if it is already available. However, if there is currently
no data available, it will mark that endpoint as rejected, causing [useSuspense()](../api/useSuspense.md) to throw an
error. This can be caught with [NetworkErrorBoundary](../api/NetworkErrorBoundary.md)

### Hard

Hard errors always invalidate a response with the rejection - even when data has previously made available.

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
  updatedAt = new Date(0);
  pk() {
    return this.id;
  }

  static schema = {
    updatedAt: Date,
  };
}

export const lastUpdated = new RestEndpoint({
  path: '/api/currentTime/:id',
  schema: TimedEntity,
});
```

```tsx title="ShowTime"
import { lastUpdated } from './api/lastUpdated';

let FAKE_ERROR: Error | undefined = undefined;
const superFetch = lastUpdated;
const mockErrorFetch = arg =>
  FAKE_ERROR !== undefined ? Promise.reject(FAKE_ERROR) : superFetch(arg);

const getUpdated = lastUpdated.extend({
  fetch: mockErrorFetch,
  errorPolicy: error =>
    error.status >= 500 ? ('soft' as const) : ('hard' as const),
});
function createError(status) {
  const error: Error & { status: any } = new Error('fake error') as any;
  error.status = status;
  return error;
}

function ShowTime() {
  const { updatedAt } = useSuspense(getUpdated, { id: '1' });
  const ctrl = useController();
  React.useEffect(
    () => () => {
      FAKE_ERROR = undefined;
    },
    [updatedAt],
  );
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <div>
        <button
          onClick={() => {
            FAKE_ERROR = createError(500);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Soft
        </button>
        <button
          onClick={() => {
            FAKE_ERROR = createError(400);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Hard
        </button>
        <button
          onClick={() => {
            FAKE_ERROR = createError(500);
            ctrl.invalidate(getUpdated, { id: '1' });
          }}
        >
          Invalidate Soft
        </button>
        <button
          onClick={() => {
            FAKE_ERROR = createError(400);
            ctrl.invalidate(getUpdated, { id: '1' });
          }}
        >
          Invalidate Hard
        </button>
      </div>
    </div>
  );
}

render(
  <ResetableErrorBoundary>
    <ShowTime />
  </ResetableErrorBoundary>,
);
```

</HooksPlayground>

### Policy for RestEndpoint

Since `500`s indicate a failure of the server, we want to use stale data
if it exists. On the other hand, something like a `400` indicates 'user error', which
means the error indicates something about application flow - like if a record is deleted, resulting
in `400`. Keeping the record around would be inaccurate.

Since this is the typical behavior for REST APIs, this is the default policy in [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```
