---
name: rdc-react-testing
description: Test @data-client/react with renderDataHook - jest unit tests, fixtures, interceptors, mock responses, nock HTTP mocking, hook testing, component testing
license: Apache 2.0
---

# Testing Patterns (@data-client/test)

## Hook Testing with renderDataHook()

```typescript
import { renderDataHook } from '@data-client/test';

it('useSuspense() should render the response', async () => {
  const { result, waitFor } = renderDataHook(
    () => useSuspense(ArticleResource.get, { id: 5 }),
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
  expect(result.current.title).toBe('hi ho');
});
```

**Options:**
- `initialFixtures` - Set up initial state of the store
- `resolverFixtures` - Add interceptors for subsequent requests
- `getInitialInterceptorData` - Simulate changing server state

**Return values:**
- Inherits all `renderHook()` return values from `@testing-library/react`
- `controller` - Controller instance for manual actions
- `cleanup()` - Cleanup function
- `allSettled()` - Wait for all async operations to complete

## Fixtures and Interceptors

**Success Fixture:**
```typescript
interface SuccessFixture {
  endpoint;
  args;
  response;
  error?;
  delay?;
}
```

**Response Interceptor:**
```typescript
interface ResponseInterceptor {
  endpoint;
  response(...args);
  delay?;
  delayCollapse?;
}
```

## Testing Mutations

**Create operations:**
```typescript
it('should create a new todo', async () => {
  const { result } = renderDataHook(
    () => useController(),
    {
      initialFixtures: [
        {
          endpoint: TodoResource.getList,
          args: [],
          response: [],
        },
      ],
      resolverFixtures: [
        {
          endpoint: TodoResource.getList.push,
          response: (newTodo) => ({ ...newTodo, id: 1 }),
        },
      ],
    },
  );

  const newTodo = { title: 'Test Todo', completed: false };
  const createdTodo = await result.current.fetch(TodoResource.getList.push, newTodo);
  
  expect(createdTodo.id).toBe(1);
});
```

## Testing Error States

```typescript
it('should handle fetch errors', async () => {
  const { result, waitFor } = renderDataHook(
    () => useSuspense(TodoResource.get, { id: 1 }),
    {
      initialFixtures: [
        {
          endpoint: TodoResource.get,
          args: [{ id: 1 }],
          response: null,
          error: new Error('Not found'),
        },
      ],
    },
  );

  await waitFor(() => {
    expect(result.current).toBeUndefined();
  });
});
```

## Testing Components

```typescript
import { render } from '@testing-library/react';
import { DataProvider } from '@data-client/react';

const renderWithProvider = (component, options = {}) => {
  return render(
    <DataProvider {...options}>
      {component}
    </DataProvider>
  );
};

it('should render todo list', async () => {
  const { getByText } = renderWithProvider(
    <TodoList />,
    {
      initialFixtures: [
        {
          endpoint: TodoResource.getList,
          args: [],
          response: [{ id: 1, title: 'Test Todo', completed: false }],
        },
      ],
    },
  );

  expect(getByText('Test Todo')).toBeInTheDocument();
});
```

## Testing with nock (HTTP Endpoint Testing)

```typescript
import nock from 'nock';

it('should fetch data from API', async () => {
  const scope = nock('https://jsonplaceholder.typicode.com')
    .get('/todos/1')
    .reply(200, { id: 1, title: 'Test', completed: false });

  const result = await TodoResource.get({ id: 1 });
  
  expect(result.title).toBe('Test');
  scope.done();
});
```

## Testing Managers

```typescript
it('should handle manager middleware', async () => {
  const mockManager = {
    middleware: (controller) => (next) => async (action) => {
      if (action.type === 'FETCH') {
        console.log('Fetch action:', action);
      }
      return next(action);
    },
    cleanup: jest.fn(),
  };

  const { controller } = renderDataHook(
    () => useController(),
    { managers: [mockManager] },
  );

  await controller.fetch(TodoResource.get, { id: 1 });
  expect(mockManager.cleanup).not.toHaveBeenCalled();
});
```

## Test File Organization

**Keep tests under `packages/*/src/**/__tests__`:**
```
packages/react/src/hooks/__tests__/useSuspense.test.ts
packages/react/src/components/__tests__/DataProvider.test.tsx
```

**Test naming:**
- Node-only: `*.node.test.ts[x]`
- React Native: `*.native.test.ts[x]`
- Regular: `*.test.ts[x]`

## Best Practices

- Use `renderDataHook()` for testing hooks that use @data-client/react hooks
- Use fixtures or interceptors when testing hooks or components
- Use `nock` when testing networking definitions
- Test both success and error scenarios
- Test mutations and their side effects
- Don't mock @data-client internals directly
- Don't use raw fetch in tests when fixtures are available

## References

For detailed API documentation, see the [references](references/) directory:

- [renderDataHook](references/renderDataHook.md) - Hook testing utility
- [makeRenderDataHook](references/makeRenderDataHook.md) - Custom hook renderer
- [Fixtures](references/Fixtures.md) - Fixture format reference
- [MockResolver](references/MockResolver.md) - Component testing wrapper
- [mockInitialState](references/mockInitialState.md) - Create initial state
- [unit-testing-hooks](references/unit-testing-hooks.md) - Hook testing guide
- [unit-testing-components](references/unit-testing-components.md) - Component testing guide
