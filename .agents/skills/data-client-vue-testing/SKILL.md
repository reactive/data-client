---
name: data-client-vue-testing
description: Test @data-client/vue composables and components - renderDataCompose, mountDataClient, fixtures, jest, nock HTTP mocking, polling/subscription tests with fake timers, useSuspense, useLive, useSubscription, Vue 3 reactive props. Use when writing or debugging tests for composables or components built on @data-client/vue.
license: Apache 2.0
---

# Vue Testing Patterns (@data-client/vue)

## Composable Testing with renderDataCompose()

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { reactive, computed } from 'vue';

it('useQuery() should return cached data', async () => {
  const { result } = await renderDataCompose(
    () => useQuery(Article, { id: 5 }),
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response: { id: 5, title: 'hi ho', content: 'whatever' },
        },
      ],
    },
  );
  expect(result.value).toEqual(Article.fromJS({ id: 5, title: 'hi ho', content: 'whatever' }));
});
```

**Options:**
- `initialFixtures` - Pre-populate store state (static fixtures)
- `resolverFixtures` - Intercept requests with dynamic responses
- `props` - Reactive props object (use `reactive()`)
- `managers`, `initialState`, `gcPolicy` - Custom configuration

**Return values** (`renderDataCompose()` is async; always `await` it):
- `result` - Whatever the composable returned: useQuery/useCache give a `ComputedRef` (`.value` is `undefined` when not in the store); useSuspense gives a Promise of one, so `await result` once, then read `.value`, which stays reactive
- `controller` - Controller instance for manual actions
- `wrapper` - Vue Test Utils wrapper
- `cleanup()` - Cleanup function (always call in afterEach/after test)
- `allSettled()` - Wait for all in-flight fetches (including ones a prop change just started) and the re-render
- `waitForNextUpdate()` - Deprecated: it gives up silently after 1 second, so a test can pass while still suspended, and can hang under fake timers. Use `await result` for a Promise result, and `await allSettled()` after changing props or calling the controller

## Component Testing with mountDataClient()

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { defineComponent, h, reactive } from 'vue';

it('should render article component', async () => {
  const ArticleComp = defineComponent({
    props: { id: Number },
    async setup(props) {
      const article = await useSuspense(ArticleResource.get, () => ({ id: props.id }));
      return () => h('div', [
        h('h3', article.value.title),
        h('p', article.value.content),
      ]);
    },
  });

  const props = reactive({ id: 5 });
  const { wrapper, cleanup } = mountDataClient(ArticleComp, {
    props,
    initialFixtures: [
      {
        endpoint: ArticleResource.get,
        args: [{ id: 5 }],
        response: { id: 5, title: 'hi ho', content: 'whatever' },
      },
    ],
  });

  await flushUntil(() => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');
  cleanup();
});
```

**Features:**
- Suspense is automatically integrated (shows fallback while loading)
- Use `data-testid="suspense-fallback"` to test loading state
- Synchronous; returns `wrapper`, `controller`, `app`, `cleanup()` and `allSettled()`

## Async Waiting Patterns

**flushUntil(predicate) (for component tests):** copy the helper from
[waiting for renders](references/unit-testing-components.md#waiting-for-renders); it throws if the
condition never holds.
```typescript
await flushUntil(() => wrapper.find('h3').exists());
await flushUntil(() => wrapper.find('h3').text() === 'Expected Title');
```

## Reactive Props Testing

**Pattern 1: Testing prop changes:**
```typescript
const props = reactive({ id: 1 });
const { result } = await renderDataCompose(
  () => useQuery(Article, computed(() => ({ id: props.id }))),
  {
    initialFixtures: [
      { endpoint: ArticleResource.get, args: [{ id: 1 }], response: { id: 1, title: 'First' } },
      { endpoint: ArticleResource.get, args: [{ id: 2 }], response: { id: 2, title: 'Second' } },
    ],
  },
);

expect(result.value?.title).toBe('First');

// Change props - result updates after a tick
props.id = 2;
await nextTick();
expect(result.value?.title).toBe('Second');
```

**Pattern 2: Conditional arguments (null handling):**
```typescript
const props = reactive({ id: 1 as number | null });
const { result } = await renderDataCompose(
  (props: { id: number | null }) => 
    useSuspense(ArticleResource.get, computed(() => props.id !== null ? { id: props.id } : null)),
  { props },
);

const articleRef = await result;
expect(articleRef.value).toBeDefined();

// Set to null - becomes undefined
props.id = null;
await nextTick();
expect(articleRef.value).toBeUndefined();
```

## Fixtures and Interceptors

**Static Fixture:**
```typescript
{
  endpoint: ArticleResource.get,
  args: [{ id: 5 }],
  response: { id: 5, title: 'hi ho', content: 'whatever' },
}
```

**Dynamic Interceptor:**
```typescript
resolverFixtures: [
  {
    endpoint: ArticleResource.get,
    response: ({ id }) => ({ id, title: `Article ${id}`, content: 'dynamic' }),
  },
]
```

**Error Fixture:**
```typescript
{
  endpoint: ArticleResource.get,
  args: [{ id: 5 }],
  response: new Error('Not found'),
  error: true,
}
```

## Testing Mutations

```typescript
it('should update collection when pushed', async () => {
  const { result, controller } = await renderDataCompose(
    () => useQuery(ArticleResource.getList.schema, {}),
    {
      initialFixtures: [
        { endpoint: ArticleResource.getList, args: [], response: [{ id: 1, title: 'First' }] },
      ],
      resolverFixtures: [
        { endpoint: ArticleResource.getList.push, response: (body) => body },
      ],
    },
  );

  expect(result.value?.length).toBe(1);

  await controller.fetch(ArticleResource.getList.push, {
    id: 2,
    title: 'Second',
    content: 'new',
  });
  await nextTick();

  expect(result.value?.length).toBe(2);
});
```

## Testing with Controller

**setResponse() for instant updates:**
```typescript
const { result, controller } = await renderDataCompose(() => useSuspense(...));
const dataRef = await result;

expect(dataRef.value.title).toBe('Original');

controller.setResponse(
  ArticleResource.get,
  { id: 5 },
  { id: 5, title: 'Updated', content: 'new content' }
);

await nextTick();
expect(dataRef.value.title).toBe('Updated'); // Reactive!
```

## Testing with nock (HTTP Mocking)

Use nock when a test must exercise the real fetch path — verifying URL construction, headers, request bodies, retries, or anything in your `RestEndpoint`/`Resource` networking layer. For pure store/state behavior, prefer `initialFixtures`/`resolverFixtures` (lighter and faster).

Minimal shape:

```typescript
import nock from 'nock';

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({ 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' })
    .options(/.*/).reply(200)            // CORS preflight (required in JSDOM)
    .get('/article/5').reply(200, { id: 5, title: 'hi ho' });
});

afterAll(() => nock.cleanAll());
```

For dynamic server state, mutating-closure replies, request spying with `jest.fn()`, error responses, and mixing nock with fixtures, see [references/nock-http-mocking.md](references/nock-http-mocking.md).

## Testing Polling and Subscriptions

For composables with `pollFrequency`, `useLive`, or `useSubscription`, use fake timers so polls fire deterministically. Core flow:

1. `jest.useFakeTimers()` **before** mount/render (so the interval is created under fake timers).
2. Render, then `jest.advanceTimersByTime(frequency)` to drive the initial fetch.
3. Mutate the response (e.g. `responseMock.mockReturnValue(...)`), advance time again, `await allSettled()` and `await nextTick()`.
4. Restore real timers in `afterEach`: `jest.useRealTimers()`.

Quick example:

```typescript
jest.useFakeTimers();
const responseMock = jest.fn(() => payload);

const { result, allSettled, cleanup } = await renderDataCompose(
  () => useSuspense(PollingArticleResource.get, { id: payload.id }),
  { resolverFixtures: [{ endpoint: PollingArticleResource.get, response: responseMock }] },
);

jest.advanceTimersByTime(frequency);
await allSettled();
const articleRef = await result;

responseMock.mockReturnValue({ ...payload, title: 'updated' });
jest.advanceTimersByTime(frequency);
await allSettled();
await nextTick();

expect(articleRef!.value.title).toBe('updated');
jest.useRealTimers();
cleanup();
```

For unsubscribe patterns, component-level polling tests, fake-timer-safe `flushUntil`, polling via nock, and common pitfalls, see [references/polling-subscriptions.md](references/polling-subscriptions.md).

## Best Practices

- **Always call cleanup()** - Prevents memory leaks and test pollution
- **Use reactive() for props** - Enables testing prop changes
- **Use flushUntil() in component tests** - More reliable than fixed delays
- **Remember nextTick()** - After mutations/setResponse to allow Vue reactivity to propagate
- **Use initialFixtures for initial state** - Pre-populate the store
- **Use resolverFixtures for dynamic responses** - Intercept requests with functions
- **Test both empty and populated states** - Verify undefined behavior
- **Pass prop-derived args as getters or computed()** - Async setup runs once, so `useSuspense(Resource.get, () => ({ id: props.id }))` follows prop changes; a plain `{ id: props.id }` is read once

## References

For detailed API documentation, see the [references](references/) directory:

- [Fixtures](references/Fixtures.md) - Fixture format reference
- [mockInitialState](references/mockInitialState.md) - Create initial state for `DataClientPlugin`
- [unit-testing-components](references/unit-testing-components.md) - `mountDataClient()` guide, setup and options
- [unit-testing-composables](references/unit-testing-composables.md) - `renderDataCompose()` guide
- [nock-http-mocking](references/nock-http-mocking.md) - Full nock setup, dynamic server state, request spying, errors, pitfalls
- [polling-subscriptions](references/polling-subscriptions.md) - Fake-timer patterns for `useLive`/`useSubscription`/`pollFrequency`, unsubscribe verification, polling via nock

## Common Patterns

**Empty state test:**
```typescript
const { result } = await renderDataCompose(() => useQuery(Article, { id: 5 }));
expect(result.value).toBe(undefined);
```

**Testing nested collections:**
```typescript
const userTodos = new Collection(new schema.Array(Todo), {
  argsKey: ({ userId }) => ({ userId }),
});

const { result } = await renderDataCompose(
  () => useQuery(userTodos, { userId: '1' }),
  { initialFixtures: [/* ... */] },
);

expect(result.value?.length).toBe(2);
expect(result.value?.[0]).toBeInstanceOf(Todo);
```
