---
applyTo: '**/__tests__/*.ts*'
---

## Unit testing hooks

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

- use `initialFixtures` to set up the initial state of the store
- use `resolverFixtures` to add interceptors to handle subsequent requests
  - use `getInitialInterceptorData` if `resolverFixtures` need to simulate changing server state

## Fixtures and Interceptors

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

- Use fixtures or interceptors when testing hooks or components.
- Use 'nock' when testing networking definitions.

# Official Documentation Links

- [Fixtures and Interceptors](https://dataclient.io/docs/api/Fixtures)
- [renderDataHook()](https://dataclient.io/docs/api/renderDataHook)

**ALWAYS follow these patterns and refer to the official docs for edge cases. Prioritize code generation that is idiomatic, type-safe, and leverages automatic normalization/caching via schema definitions.**