# Nock HTTP Mocking (Vue Testing)

Use `nock` instead of fixtures when you want a real fetch round-trip — for example, when verifying URL construction, headers, request bodies, retry logic, or anything that exercises the actual networking layer of your `RestEndpoint`/`Resource` definitions. For pure store/state behavior, prefer `initialFixtures`/`resolverFixtures` (lighter, faster, no global setup).

## Standard Setup

CORS preflight handling and a permissive default header set are required because the test environment runs in JSDOM and `fetch` performs OPTIONS preflights for non-simple requests.

```typescript
import nock from 'nock';

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Access-Token',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200)
    .get(`/article/${payload.id}`)
    .reply(200, payload)
    .put(`/article/${payload.id}`)
    .reply(200, (uri, requestBody: any) => ({
      ...payload,
      ...requestBody,
    }));
});

afterAll(() => {
  nock.cleanAll();
});
```

Key points:

- `nock(/.*/)` matches any host (matches your `urlPrefix` whether it's `/`, `https://example.com`, etc.).
- `.persist()` keeps the interceptors alive across multiple requests in the test file. Without it, each interceptor fires once and is consumed.
- `.options(/.*/).reply(200)` blanket-handles preflight — without it, mutations like PUT/POST/DELETE will hang or fail in JSDOM.

## Dynamic Server State

To simulate a server whose data changes during the test (mutations, polling, optimistic updates), reply with a function that returns a closure-bound variable. Reassign the variable to "update the server".

```typescript
let currentPayload = { ...payload };

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200)
    .get(`/article/${payload.id}`)
    .reply(200, () => currentPayload)
    .put(`/article/${payload.id}`)
    .reply(200, (uri, requestBody: any) => ({
      ...currentPayload,
      ...requestBody,
    }));
});

it('reflects updated server data on next fetch', async () => {
  // ... initial render ...

  // Mutate "server" state
  currentPayload = { ...currentPayload, title: 'updated' };

  // Trigger a refetch (e.g. via controller.fetch, polling, or invalidate)
  // ... assert new value ...
});
```

## Spying on Requests

Use `jest.fn()` as the reply handler to assert call counts and inspect request bodies.

```typescript
const fetchMock = jest.fn(() => payload);

nock(/.*/)
  .persist()
  .defaultReplyHeaders({ 'Access-Control-Allow-Origin': '*' })
  .options(/.*/)
  .reply(200)
  .get(`/article/${payload.id}`)
  .reply(200, fetchMock);

// ... run test interactions ...

expect(fetchMock).toHaveBeenCalledTimes(1);
```

For mutations, the second argument to the reply callback is the request body:

```typescript
const updateMock = jest.fn((uri, requestBody) => ({ ...payload, ...requestBody }));

nock(/.*/)
  .persist()
  .put(`/article/${payload.id}`)
  .reply(200, updateMock);
```

## Errors and Status Codes

```typescript
nock(/.*/)
  .get('/article/missing')
  .reply(404, { detail: 'not found' });

nock(/.*/)
  .get('/article/broken')
  .replyWithError('network down');
```

When testing error paths in components, also catch the error in your composable or wrap with `AsyncBoundary` so the test doesn't fail with an unhandled rejection.

## Combining nock With Fixtures

You can mix both within the same test file: use `initialFixtures` to pre-populate store state cheaply, and let nock handle any subsequent live requests (refetch, polling, mutation). The store will hydrate from fixtures first, then nock interceptors take over for actual fetches.

## Common Pitfalls

- **Hanging mutations** → missing `.options(/.*/).reply(200)` for CORS preflight.
- **Interceptor consumed after one call** → forgot `.persist()`.
- **Stale data after "server update"** → you reassigned the closure variable but never triggered a new fetch (no poll, no invalidate, no controller.fetch).
- **`Nock: No match for request`** → the URL or method differs from what your endpoint actually sends. Add `nock.recorder.rec()` temporarily, or check `urlPrefix` and `path` template substitution.
- **Cross-test pollution** → always `nock.cleanAll()` in `afterAll` (or `afterEach` for stricter isolation).
