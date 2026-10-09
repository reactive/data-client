---
frameworks: [react]
framework_equivalent: guides/unit-testing-composables
title: makeRenderDataHook()
---

```typescript
function makeRenderDataHook(
  Provider: React.ComponentType<ProviderProps>,
): RenderDataClientFunction;
```

`makeRenderDataHook()` é útil para testar hooks que dependem do `Reactive Data Client`. Ele cria uma função renderDataClient()
que espelha o [renderHook()](https://react-hooks-testing-library.com/reference/api#renderhook-options) do [@testing-library/react-hooks](https://github.com/testing-library/react-hooks-testing-library), mas o faz com um limite `<Suspense/>`
e também dentro de um contexto `<Provider />`.

## Argumentos {#arguments}

### Provider {#provider}

```typescript
interface ProviderProps {
  children: React.ReactNode;
  managers: Manager[];
  initialState: State<unknown>;
  Controller: new (props: { gcPolicy: GCInterface }) => Controller;
}
```

O [&lt;DataProvider /&gt;](./DataProvider.md) do Reactive Data Client

- `import { DataProvider } from @data-client/react;`
- `import { DataProvider } from @data-client/react/redux;`

## Exemplo {#example}

```typescript
import { DataProvider } from '@data-client/react/redux';
import { useSuspense } from '@data-client/react';
import { makeRenderDataHook } from '@data-client/test';
import { Article, ArticleResource } from './resources/Article';

let renderDataHook: ReturnType<typeof makeRenderDataHook>;

const response = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

beforeEach(() => {
  renderDataHook = makeRenderDataHook(DataProvider);
});

it('should resolve useSuspense()', async () => {
  const { result, waitFor, controller } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.get, response);
    },
    {
      resolverFixtures: [
        {
          endpoint: ArticleResource.get,
          response: ({ id }) => ({ ...response, id }),
        },
        {
          endpoint: ArticleResource.partialUpdate,
          response: ({ id }, body) => ({ ...body, id }),
        },
      ],
    },
  );
  // this indicates suspense
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBeDefined());
  expect(result.current instanceof Article).toBe(true);
  expect(result.current.title).toBe(response.title);
  await controller.fetch(
    ArticleResource.partialUpdate,
    { id: response.id },
    { title: 'updated title' },
  );
  expect(result.current.title).toBe('updated title');
});
```