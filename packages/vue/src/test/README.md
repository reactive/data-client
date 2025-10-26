# Vue Data Client Testing Utilities

This package provides testing utilities for Vue applications using `@data-client/vue`, similar to `@data-client/test` for React.

## Installation

```bash
npm install @data-client/vue
```

## Usage

### Basic Component Testing

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { defineComponent, h } from 'vue';
import { MyResource } from './resources';

const TestComponent = defineComponent({
  setup() {
    return () => h('div', 'Hello World');
  },
});

const { wrapper, controller, cleanup } = mountDataClient(TestComponent, {
  initialFixtures: [
    {
      endpoint: MyResource.get,
      args: [{ id: 1 }],
      response: { id: 1, name: 'Test' },
    },
  ],
});

// Your tests here
expect(wrapper.text()).toBe('Hello World');

// Clean up after test
cleanup();
```

### Testing with Suspense (Automatic)

Suspense is automatically integrated into `mountDataClient`. Your components will automatically suspend and show a fallback while data is loading:

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { defineComponent, h } from 'vue';
import { MyResource } from './resources';

const AsyncComponent = defineComponent({
  async setup() {
    const data = await useSuspense(MyResource.get, { id: 1 });
    return () => h('div', data.value.name);
  },
});

const { wrapper, controller, cleanup } = mountDataClient(AsyncComponent);

// Initially shows suspense fallback
expect(wrapper.find('[data-testid="suspense-fallback"]').exists()).toBe(true);

// Wait for data to load
await flushUntil(wrapper, () => wrapper.find('div').exists());

// Now shows the actual content
expect(wrapper.text()).toBe('Test');

cleanup();
```

### Composable Testing

```typescript
import { renderDataCompose } from '@data-client/vue/test';
import { reactive } from 'vue';

const useMyComposable = (props: { id: number }) => {
  const data = useSuspense(MyResource.get, { id: props.id });
  return { data, isLoading: false };
};

const props = reactive({ id: 1 });
const { result, controller, cleanup, waitForNextUpdate } = renderDataCompose(useMyComposable, {
  props,
  initialFixtures: [
    {
      endpoint: MyResource.get,
      args: [{ id: 1 }],
      response: { id: 1, name: 'Test' },
    },
  ],
});

// Initially suspended
expect(result.current).toBeUndefined();

// Wait for the composable to resolve
await waitForNextUpdate();

// Now should have the actual data (useSuspense returns a Promise that resolves to ComputedRef)
expect(result.current).toBeDefined();
expect(result.current).toBeInstanceOf(Promise);

// Access the actual data
const dataRef = await result.current;
expect(dataRef.value).toBeDefined();

// Update props reactively
props.id = 2;

cleanup();
```

### Testing with Reactive Props

Components can receive reactive props that can be updated during tests:

```typescript
import { mountDataClient } from '@data-client/vue/test';
import { defineComponent, h, reactive } from 'vue';
import { MyResource } from './resources';

const ArticleComponent = defineComponent({
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  async setup(props) {
    const article = await useSuspense(MyResource.get, { id: props.id });
    return () => h('div', article.value.title);
  },
});

// Create a reactive props ref
const props = reactive({ id: 1 });

const { wrapper, cleanup } = mountDataClient(ArticleComponent, {
  props,
  resolverFixtures: [
    {
      endpoint: MyResource.get,
      response: (request) => ({
        id: request.args[0].id,
        title: `Article ${request.args[0].id}`,
      }),
    },
  ],
});

// Wait for initial render
await flushUntil(wrapper, () => wrapper.find('div').exists());
expect(wrapper.text()).toBe('Article 1');

// Update props reactively - component will re-render with new data
props.id = 2;
await nextTick();

// Wait for new data to load
await flushUntil(wrapper, () => wrapper.text() === 'Article 2');
expect(wrapper.text()).toBe('Article 2');

cleanup();
```

### Using Resolver Fixtures

```typescript
const { wrapper, controller, cleanup } = mountDataClient(TestComponent, {
  resolverFixtures: [
    {
      endpoint: MyResource.get,
      response: (request) => {
        return {
          id: request.args[0].id,
          name: `Dynamic ${request.args[0].id}`,
        };
      },
    },
  ],
});

// Test dynamic responses
const result = await controller.fetch(MyResource.get, { id: 123 });
expect(result.name).toBe('Dynamic 123');
```

## API Reference

### `mountDataClient(component, options)`

Renders a Vue component with DataClient provider for testing.

**Parameters:**
- `component`: Vue component to render
- `options`: Configuration options

**Returns:**
- `wrapper`: Vue Test Utils wrapper
- `controller`: DataClient controller instance
- `app`: Vue app instance
- `cleanup`: Function to clean up resources
- `allSettled`: Function to wait for all pending promises

### `renderDataCompose(composable, options)`

Renders a Vue composable with DataClient provider for testing.

**Parameters:**
- `composable`: Vue composable function
- `options`: Configuration options

**Returns:**
- `result`: Object with `current` property containing the composable's return value (`undefined` when suspended, Promise when resolved)
- `wrapper`: Vue Test Utils wrapper
- `controller`: DataClient controller instance
- `cleanup`: Function to clean up resources
- `allSettled`: Function to wait for all pending promises
- `waitForNextUpdate`: Function to wait for the composable to resolve from suspended state

### Options

```typescript
interface RenderDataClientOptions<P = any> {
  props?: Reactive<P>;                        // Reactive props ref to pass to component
  initialFixtures?: readonly Fixture[];  // Initial data fixtures
  resolverFixtures?: readonly (Fixture | Interceptor)[]; // Dynamic response fixtures
  getInitialInterceptorData?: () => any; // Initial data for interceptors
  managers?: Manager[];                  // Custom managers
  initialState?: State<unknown>;         // Custom initial state
  gcPolicy?: GCInterface;                // Custom garbage collection policy
  wrapper?: any;                         // Custom wrapper component
}
```

### Fixture Types

```typescript
interface Fixture {
  endpoint: FixtureEndpoint;
  args: any[];
  response: any;
  error?: boolean;
}

interface Interceptor {
  endpoint: FixtureEndpoint;
  response: (request: {
    body?: any;
    headers?: Record<string, string>;
    url: string;
    method: string;
    args: any[];
  }) => any | Promise<any>;
  error?: boolean;
}
```

## Best Practices

1. **Always call cleanup()** after your tests to prevent memory leaks
2. **Use fixtures** instead of mocking network requests when possible
3. **Test both success and error cases** using the `error` property in fixtures
4. **Use resolver fixtures** for dynamic responses based on request parameters
5. **Leverage the controller** for testing mutations and state updates
6. **Suspense is automatic** - no need to manually wrap components in Suspense
7. **Use reactive props** - Pass a `reactive` in the `props` option and set its members to change component props
8. **Vue Suspense behavior** - Vue's `useSuspense` returns a Promise that suspends when data is missing, then resolves to a ComputedRef
9. **Reactive props with async setup** - Components using async setup with `useSuspense` that depend on props should use `useFetch` + `watchEffect` for reactive behavior, or rely on non-async setup patterns. Async setup only runs once per component instance.

## Migration from Manual Setup

If you were previously setting up DataClient manually in tests:

```typescript
// Before
const wrapper = mount(MyComponent, {
  global: {
    plugins: [
      [
        DataClientPlugin,
        {
          managers: [new NetworkManager()],
          initialState: mockState,
        },
      ],
    ],
  },
});

// After
const { wrapper, controller, cleanup } = mountDataClient(MyComponent, {
  initialFixtures: [
    {
      endpoint: MyResource.get,
      args: [{ id: 1 }],
      response: { id: 1, name: 'Test' },
    },
  ],
});
```

This approach is more declarative, easier to maintain, and provides better test isolation.
