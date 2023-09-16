---
title: Endpoint Error Policy
sidebar_label: Error Policy
---

<head>
  <title>Distinguishing recoverable fetch errors in React</title>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';

[Endpoint.errorPolicy](/rest/api/Endpoint#errorpolicy) controls cache behavior upon a fetch rejection.
It uses the rejection error to determine whether it should be treated as 'soft' or 'hard' error.

### Soft

Soft errors will continue showing valid data if it exists. However, if no previous data is in the store,
it will reject with `error`. In this case [useSuspense()](../api/useSuspense.md) throws the
error to be caught by the nearest [NetworkErrorBoundary](../api/NetworkErrorBoundary.md) or [AsyncBoundary](../api/AsyncBoundary.md)

### Hard

Hard errors always reject with `error` - even when data has previously made available.

'hard' | `undefined` can both be used to indicate this state.

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
  updatedAt = Temporal.Instant.fromEpochSeconds(0);
  pk() {
    return this.id;
  }

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

export const getUpdated = lastUpdated.extend({
  fetch(this: any, arg) {
    return this.FAKE_ERROR !== undefined
      ? Promise.reject(this.FAKE_ERROR)
      : lastUpdated(arg);
  },
  errorPolicy: error =>
    error.status >= 500 ? ('soft' as const) : ('hard' as const),
  FAKE_ERROR: undefined as Error | undefined,
});

export default function TimePage({ id }) {
  const { updatedAt } = useSuspense(getUpdated, { id });
  React.useEffect(
    () => () => {
      getUpdated.FAKE_ERROR = undefined;
    },
    [updatedAt],
  );
  return (
    <div>
      API time:{' '}
      <time>
        {DateTimeFormat('en-US', { timeStyle: 'long' }).format(
          updatedAt,
        )}
      </time>
    </div>
  );
}
```

```tsx title="ShowTime" collapsed
import TimePage, { getUpdated } from './TimePage';

function createError(status) {
  const error: Error & { status: any } = new Error(
    'fake error',
  ) as any;
  error.status = status;
  return error;
}

function ShowTime() {
  const ctrl = useController();
  return (
    <div>
      <AsyncBoundary fallback={<div>loading...</div>}>
        <TimePage id="1" />
      </AsyncBoundary>
      <div>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(500);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Soft
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(400);
            ctrl.fetch(getUpdated, { id: '1' });
          }}
        >
          Fetch Hard
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(500);
            ctrl.invalidate(getUpdated, { id: '1' });
          }}
        >
          Invalidate Soft
        </button>
        <button
          onClick={() => {
            getUpdated.FAKE_ERROR = createError(400);
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
if it exists. On the other hand, something like a `4xx` indicates 'user error', which
means the error indicates something about application flow - like if a record is deleted, resulting
in `404`. Keeping the record around would be inaccurate.

Since this is the typical behavior for REST APIs, this is the default policy in [@data-client/rest](https://www.npmjs.com/package/@data-client/rest)

```ts
errorPolicy(error) {
  return error.status >= 500 ? 'soft' : undefined;
}
```

`undefined` is another way of specifying a [hard error](#hard)
