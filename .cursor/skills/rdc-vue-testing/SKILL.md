---
name: rdc-vue-testing
description: Test @data-client/vue composables and components - renderDataCompose, mountDataClient, fixtures, jest, nock, Vue 3 reactive props, useSuspense testing
license: Apache 2.0
---

# Vue Testing Patterns (@data-client/vue)

## Composable Testing with renderDataCompose()

```typescript
import { renderDataCompose } from '../test';
import { reactive, computed } from 'vue';

it('useQuery() should return cached data', () => {
  const { result } = renderDataCompose(
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
  expect(result.current?.value).toEqual(Article.fromJS({ id: 5, title: 'hi ho', content: 'whatever' }));
});
```

**Options:**
- `initialFixtures` - Pre-populate store state (static fixtures)
- `resolverFixtures` - Intercept requests with dynamic responses
- `props` - Reactive props object (use `reactive()`)
- `managers`, `initialState`, `gcPolicy` - Custom configuration

**Return values:**
- `result.current` - Composable return value (undefined when suspended, Promise when resolved for useSuspense)
- `controller` - Controller instance for manual actions
- `wrapper` - Vue Test Utils wrapper
- `cleanup()` - Cleanup function (always call in afterEach/after test)
- `allSettled()` - Wait for all pending promises
- `waitForNextUpdate()` - Wait for composable to resolve from suspended state

## Component Testing with mountDataClient()

```typescript
import { mountDataClient } from '../test';
import { defineComponent, h, reactive } from 'vue';

it('should render article component', async () => {
  const ArticleComp = defineComponent({
    props: { id: Number },
    async setup(props) {
      const article = await useSuspense(ArticleResource.get, { id: props.id });
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

  await flushUntil(wrapper, () => wrapper.find('h3').exists());
  expect(wrapper.find('h3').text()).toBe('hi ho');
  cleanup();
});
```

**Features:**
- Suspense is automatically integrated (shows fallback while loading)
- Use `data-testid="suspense-fallback"` to test loading state
- Returns same utilities as `renderDataCompose()` plus `wrapper`

## Async Waiting Patterns

**flushUntil helper (for component tests):**
```typescript
async function flushUntil(wrapper: any, predicate: () => boolean, tries = 100) {
  for (let i = 0; i < tries; i++) {
    if (predicate()) return;
    await Promise.resolve();
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Usage:
await flushUntil(wrapper, () => wrapper.find('h3').exists());
await flushUntil(wrapper, () => wrapper.find('h3').text() === 'Expected Title');
```

**waitForNextUpdate (for composable tests):**
```typescript
const { result, waitForNextUpdate } = renderDataCompose(() => useSuspense(...));

// Initially suspended
expect(result.current).toBeUndefined();

// Wait for resolution
await waitForNextUpdate();
expect(result.current).toBeInstanceOf(Promise);

// Await the promise to get the reactive ComputedRef
const dataRef = await result.current;
expect(dataRef.value.title).toBe('hi ho');
```

## Reactive Props Testing

**Pattern 1: Testing prop changes:**
```typescript
const props = reactive({ id: 1 });
const { result } = renderDataCompose(
  () => useQuery(Article, computed(() => ({ id: props.id }))),
  {
    initialFixtures: [
      { endpoint: ArticleResource.get, args: [{ id: 1 }], response: { id: 1, title: 'First' } },
      { endpoint: ArticleResource.get, args: [{ id: 2 }], response: { id: 2, title: 'Second' } },
    ],
  },
);

expect(result.current?.value?.title).toBe('First');

// Change props - result automatically updates
props.id = 2;
expect(result.current?.value?.title).toBe('Second');
```

**Pattern 2: Conditional arguments (null handling):**
```typescript
const props = reactive({ id: 1 as number | null });
const { result } = renderDataCompose(
  (props: { id: number | null }) => 
    useSuspense(ArticleResource.get, computed(() => props.id !== null ? { id: props.id } : null)),
  { props },
);

await waitForNextUpdate();
const articleRef = await result.current;
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
  const { result, controller, waitForNextUpdate } = renderDataCompose(
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

  expect(result.current?.value?.length).toBe(1);

  await controller.fetch(ArticleResource.getList.push, {
    id: 2,
    title: 'Second',
    content: 'new',
  });
  await waitForNextUpdate();

  expect(result.current?.value?.length).toBe(2);
});
```

## Testing with Controller

**setResponse() for instant updates:**
```typescript
const { controller } = renderDataCompose(...);
await waitForNextUpdate();
const dataRef = await result.current;

expect(dataRef.value.title).toBe('Original');

controller.setResponse(
  ArticleResource.get,
  { id: 5 },
  { id: 5, title: 'Updated', content: 'new content' }
);

await nextTick();
expect(dataRef.value.title).toBe('Updated'); // Reactive!
```

**fetch() for mutations:**
```typescript
await controller.fetch(
  ArticleResource.update,
  { id: 5 },
  { title: 'Mutated', content: 'mutated content' }
);
await nextTick();
```

## Testing with nock (HTTP Mocking)

```typescript
import nock from 'nock';

beforeAll(() => {
  nock(/.*/)
    .persist()
    .defaultReplyHeaders({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    })
    .options(/.*/)
    .reply(200)
    .get('/article/5')
    .reply(200, { id: 5, title: 'hi ho' });
});

afterAll(() => {
  nock.cleanAll();
});
```

**Dynamic responses with nock:**
```typescript
const fetchMock = jest.fn(() => payload);
nock(/.*/)
  .get(`/article/${payload.id}`)
  .reply(200, fetchMock);

// Later verify:
expect(fetchMock).toHaveBeenCalledTimes(1);
```

## Testing Polling/Subscriptions

```typescript
it('should poll and update', async () => {
  jest.useFakeTimers();
  let serverData = { id: 5, title: 'Original' };

  nock(/.*/)
    .persist()
    .get('/article/5')
    .reply(200, () => serverData);

  const { wrapper } = mountDataClient(PollingComponent);
  
  // Wait for initial render
  for (let i = 0; i < 100 && !wrapper.find('h3').exists(); i++) {
    await jest.advanceTimersByTimeAsync(frequency / 10);
    await nextTick();
  }
  expect(wrapper.find('h3').text()).toBe('Original');

  // Simulate server update
  serverData = { id: 5, title: 'Updated' };

  // Advance timers to trigger poll
  for (let i = 0; i < 20 && wrapper.find('h3').text() !== 'Updated'; i++) {
    await jest.advanceTimersByTimeAsync(frequency / 10);
    await nextTick();
  }
  expect(wrapper.find('h3').text()).toBe('Updated');

  jest.useRealTimers();
});
```

## Vue Suspense Behavior

**useSuspense() returns Promise → ComputedRef:**
```typescript
const { result, waitForNextUpdate } = renderDataCompose(() =>
  useSuspense(ArticleResource.get, { id: 5 })
);

// Initially suspended (undefined)
expect(result.current).toBeUndefined();

// Wait for resolution
await waitForNextUpdate();

// Now it's a Promise
expect(result.current).toBeInstanceOf(Promise);

// Await once to get reactive ComputedRef
const articleRef = await result.current;

// The ref is reactive - updates automatically
expect(articleRef.value.title).toBe('hi ho');

// After controller.setResponse() or controller.fetch():
await nextTick();
expect(articleRef.value.title).toBe('Updated'); // Auto-updated!
```

**useQuery() returns ComputedRef directly:**
```typescript
const { result } = renderDataCompose(() => useQuery(Article, { id: 5 }));

// Synchronously available (or undefined if not in store)
expect(result.current?.value).toBeDefined();
expect(result.current?.value?.title).toBe('hi ho');

// Also reactive - updates automatically
```

## Best Practices

- **Always call cleanup()** - Prevents memory leaks and test pollution
- **Use renderDataCompose()** for composables (useQuery, useSuspense, useLive)
- **Use mountDataClient()** for components
- **Use reactive() for props** - Enables testing prop changes
- **Use computed() when passing reactive props to composables** - Ensures proper reactivity tracking
- **Use flushUntil() in component tests** - More reliable than fixed delays
- **Use waitForNextUpdate() in composable tests** - Wait for suspension to resolve
- **Remember nextTick()** - After mutations/setResponse to allow Vue reactivity to propagate
- **Use initialFixtures for initial state** - Pre-populate the store
- **Use resolverFixtures for dynamic responses** - Intercept requests with functions
- **useSuspense returns Promise → ComputedRef** - Await once, then access `.value`
- **Test both empty and populated states** - Verify undefined behavior
- **Test reactive prop changes** - Use `reactive()` and verify updates
- **Don't test with async setup + prop changes** - Async setup only runs once; use non-async patterns or useFetch + watchEffect instead

## Common Patterns

**Empty state test:**
```typescript
const { result } = renderDataCompose(() => useQuery(Article, { id: 5 }), {});
expect(result.current?.value).toBe(undefined);
```

**Changing to non-existent entity:**
```typescript
const props = reactive({ id: 1 });
// ... initial setup ...
expect(result.current?.value?.id).toBe(1);

props.id = 999; // Not in store
expect(result.current?.value).toBe(undefined);
```

**Testing nested collections:**
```typescript
const userTodos = new Collection(new schema.Array(Todo), {
  argsKey: ({ userId }) => ({ userId }),
});

const { result } = renderDataCompose(
  () => useQuery(userTodos, { userId: '1' }),
  { initialFixtures: [/* ... */] },
);

expect(result.current?.value?.length).toBe(2);
expect(result.current?.value?.[0]).toBeInstanceOf(Todo);
```
