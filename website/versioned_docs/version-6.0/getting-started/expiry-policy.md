---
title: Expiry Policy
sidebar_label: Expiry Policy
---

import HooksPlayground from '@site/src/components/HooksPlayground';

By default, Rest Hooks cache policy can be described as [stale-while-revalidate](https://web.dev/stale-while-revalidate/).
This means that when data is available it can avoid blocking the application by using the stale data. However, in the background
it will still refresh the data if old enough.

To explain these concepts we'll be faking an endpoint that gives us the current time so it is easy to tell how stale it is.

```tsx title="lastUpdated.ts"
const mockFetch = ({ id, delay = 150 }) =>
  new Promise(resolve =>
    setTimeout(
      () =>
        resolve({
          id,
          updatedAt: new Date().toISOString(),
        }),
      delay,
    ),
  );
class TimedEntity extends Entity {
  pk() {
    return this.id;
  }
  static schema = {
    updatedAt: Date,
  };
}

const lastUpdated = new Endpoint(mockFetch, { schema: TimedEntity });
```

## Expiry status

### Fresh

Data in this state is considered new enough that it doesn't need to fetch.

### Stale

Data is still allowed to be shown, however Rest Hooks might attempt to revalidate by fetching again.

[useResource()](../api/useResource.md) considers fetching on mount as well as when its parameters change.
In these cases it will fetch if the data is considered stale.

### Invalid

Data should not be shown. Any components needing this data will trigger fetch and suspense. If
no components care about this data no action will be taken.

## Expiry Time

[Endpoint.dataExpiryTime](../api/Endpoint#dataexpirylength) sets how long (in miliseconds) it takes for data
to transition from 'fresh' to 'stale' status. Try setting it to a very low number like '50'
to make it becomes stale almost instantly; or a very large number to stay around for a long time.

Toggling between 'first' and 'second' changes the parameters. If the data is still considered fresh
you will continue to see the old time without any refresh.

<HooksPlayground>

```tsx
const lastUpdated = lastUpdated.extend({ dataExpiryLength: 10000 });

function ShowTime() {
  const [id, setId] = React.useState('1');
  const { updatedAt } = useResource(lastUpdated, { id });
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
      <div>
        API Time:{' '}
        <time>
          {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(
            updatedAt,
          )}
        </time>
      </div>
      <div>
        Current Time: <CurrentTime />
      </div>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

## Force refresh

[Controller.fetch](../api/Controller#fetch) can be used to trigger a fetch while still showing
the previous data. This can be done even with 'fresh' data.

<HooksPlayground>

```tsx
function ShowTime() {
  const { updatedAt } = useResource(lastUpdated, { id: '1' });
  const refresh = useFetcher(lastUpdated);
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <button onClick={() => refresh({ id: '1' })}>Refresh</button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

## Invalidate (re-suspend)

Both endpoints and entities can be targetted to be invalidated.

### A specific endpoint

In this example we can see invalidating the endpoint shows the loading fallback since the data is not allowed to be displayed.

<HooksPlayground>

```tsx
function ShowTime() {
  const { updatedAt } = useResource(lastUpdated, { id: '1' });
  const invalidateLastUpdated = useInvalidator(lastUpdated);
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <button onClick={() => invalidateLastUpdated({ id: '1' })}>
        Invalidate
      </button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

### Any endpoint with an entity

Using [Delete](../api/Delete.md) allows us to invalidate _any_ endpoint that includes that relies on that entity in their
response. If the endpoint uses the entity in an Array, it will simply be removed from that Array.

<HooksPlayground>

```tsx
const mockDelete = ({ id }) => Promise.resolve({ id });
const deleteLastUpdated = new Endpoint(mockDelete, {
  schema: new schema.Delete(TimedEntity),
});

function ShowTime() {
  const { updatedAt } = useResource(lastUpdated, { id: '1' });
  const fetchDelete = useFetcher(deleteLastUpdated);
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <button onClick={() => fetchDelete({ id: '1' })}>Delete</button>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

## Error policy

[Endpoint.errorPolicy](../api/Endpoint#errorpolicy) controls cache behavior upon a fetch rejection.
It uses the rejection error to determine whether it should be treated as 'soft' or 'hard' error.

### Soft

Soft errors will not invalidate a response if it is already available. However, if there is currently
no data available, it will mark that endpoint as rejected, causing [useResource()](../api/useResource.md) to throw an
error. This can be caught with [NetworkErrorBoundary](../api/NetworkErrorBoundary.md)

### Hard

Hard errors always invalidate a response with the rejection - even when data has previously made available.

<HooksPlayground>

```tsx
const lastUpdated = lastUpdated.extend({
  errorPolicy: error =>
    error.status >= 500 ? ('hard' as const) : ('soft' as const),
  // we need this to ignore 'status' sent in arguments
  key({ id }) {
    return `lastUpdated ${id}`;
  },
});
const mockError = ({ status }) => {
  const error = new Error('fake error');
  error.status = status;
  return Promise.reject(error);
};
const alwaysError = lastUpdated.extend({ fetch: mockError });

function ShowTime() {
  const { updatedAt } = useResource(lastUpdated, { id: '1' });
  const fetchError = useFetcher(alwaysError);
  return (
    <div>
      <time>
        {Intl.DateTimeFormat('en-US', { timeStyle: 'long' }).format(updatedAt)}
      </time>{' '}
      <div>
        <button onClick={() => fetchError({ id: '1', status: 400 })}>
          Soft Error
        </button>
        <button onClick={() => fetchError({ id: '1', status: 500 })}>
          Hard Error
        </button>
      </div>
    </div>
  );
}
render(<ShowTime />);
```

</HooksPlayground>

### Policy for Resources

Since `500`s indicate a failure of the server, we want to use stale data
if it exists. On the other hand, something like a `400` indicates 'user error', which
means the error indicates something about application flow - like if a record is deleted, resulting
in `400`. Keeping the record around would be inaccurate.

Since this is the typical behavior for REST APIs, this is the default policy in [@rest-hooks/rest](https://www.npmjs.com/package/@rest-hooks/rest)

```ts
  /** Get the request options for this SimpleResource */
  static getEndpointExtra(): EndpointExtraOptions | undefined {
    return {
      errorPolicy: error =>
        error.status >= 500 ? ('soft' as const) : undefined,
    };
  }
```
