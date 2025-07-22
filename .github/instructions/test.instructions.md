---
applyTo: '**/__tests__/*.ts*'
---

## Unit testing hooks

- Use [renderDataHook()](https://dataclient.io/docs/api/renderDataHook) to test hooks that use [@data-client/react](https://dataclient.io/docs) hooks.
  - `renderDataHook()` inherits the options, and return values of `renderHook()` from [@testing-library/react](https://testing-library.com/docs/react-testing-library/api#renderhook).
  - Additional options include, `initialFixtures`, `resolverFixtures`, `getInitialInterceptorData`
  - Additional return values include `controller`, `cleanup()`, `allSettled()`

```ts
import { renderDataHook } from '@data-client/test';

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

it('useSuspense() should render the response', async () => {
  const { result, waitFor } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, { id: 5 });
    },
    {
      initialFixtures: [
        {
          endpoint: ArticleResource.get,
          args: [{ id: 5 }],
          response,
        },
      ],
    },
  );
  expect(result.current instanceof ArticleResource).toBe(true);
  expect(result.current.title).toBe(payload.title);
});
```

- use [initialFixtures](https://dataclient.io/docs/api/renderDataHook#optionsinitialfixtures) to set up the initial state of the store
- use [resolverFixtures](https://dataclient.io/docs/api/renderDataHook#optionsresolverfixtures) to add interceptors to handle subsequent requests
  - use `getInitialInterceptorData` if `resolverFixtures` need to simulate changing server state

## [Fixtures and Interceptors](https://dataclient.io/docs/api/Fixtures)

```ts
interface SuccessFixture {
  endpoint;
  args;
  response;
  error?;
  delay?;
}
interface ErrorFixture {
  endpoint;
  args;
  response;
  error;
  delay?;
}
```

```ts
interface ResponseInterceptor {
  endpoint;
  response(...args);
  delay?;
  delayCollapse?;
}

interface FetchInterceptor {
  endpoint;
  fetchResponse(input, init);
  delay?;
  delayCollapse?;
}

type Interceptor = ResponseInterceptor | FetchInterceptor;
```

## Best Practices & Notes

- Use [fixtures or interceptors](https://dataclient.io/docs/api/Fixtures) when testing hooks or components.
- Use 'nock' when testing networking definitions.

# Official Documentation Links

- [Fixtures and Interceptors](https://dataclient.io/docs/api/Fixtures) or [Fixtures and Interceptors](docs/core/api/Fixtures.md)
- [renderDataHook()](https://dataclient.io/docs/api/renderDataHook) or [renderDataHook()](docs/core/api/renderDataHook.md)
- [MockResolver](docs/core/api/MockResolver.md)
- [makeRenderDataHook()](docs/core/api/makeRenderDataHook.md)

**ALWAYS follow these patterns and refer to the official docs for edge cases.**