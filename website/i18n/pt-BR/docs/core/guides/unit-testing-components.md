---
frameworks: [react]
title: Testes unitários de componentes
---

:::warning

Tenha cuidado ao usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) em módulos como o Reactive Data Client. Eliminar exports esperados
pode causar erros difíceis de rastrear,
como `TypeError: Class extends value undefined is not a function or null`.

Em vez disso, faça um [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials)
ou, melhor ainda, use [mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) nos seus
endpoints.

:::

Se você precisa adicionar testes unitários aos seus componentes para verificar algum comportamento, talvez queira
evitar lidar com o ciclo de fetch de rede, já que ele provavelmente é ortogonal ao que você está
tentando testar. Usar [&lt;DataProvider /\>](../api/DataProvider.md) com [mockInitialState](../api/mockInitialState.md) e [Fixtures](../api/Fixtures.md) nos nossos testes permite
preencher o cache previamente com as fixtures fornecidas, de modo que os componentes renderizem imediatamente
com esses resultados.

Testar interações do usuário que disparam mutações pode ser facilitado com o uso de [&lt;MockResolver /\>](../api/MockResolver.md)
e [Interceptors](../api/Fixtures.md#interceptor)

```typescript title="__tests__/fixtures.ts"
import { ArticleResource } from '../resources/Article';

export default {
  full: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: [
        {
          id: 5,
          content: 'have a merry christmas',
          author: 2,
          contributors: [],
        },
        {
          id: 532,
          content: 'never again',
          author: 23,
          contributors: [5],
        },
      ],
    },
    {
      endpoint: ArticleResource.update,
      args: [{ id: 532 }] as const,
      response({ id }, body) {
        return {
          id,
          ...body,
        };
      },
    },
  ],
  empty: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: [],
    },
  ],
  error: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }] as const,
      response: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
  loading: [],
};
```

```tsx title="__tests__/ArticleList.tsx"
import { DataProvider, AsyncBoundary } from '@data-client/react';
import { render, waitFor } from '@testing-library/react';
import { MockResolver, mockInitialState } from '@data-client/test';

import ArticleList from 'components/ArticleList';
import results from './fixtures';

describe('<ArticleList />', () => {
  it('renders', () => {
    const tree = (
      <DataProvider initialState={mockInitialState(results.full)}>
        <ArticleList maxResults={10} />
      </DataProvider>
    );
    const { findByText } = render(tree);
    const content = findByText(results.full[0].response[0].content);
    expect(content).toBeDefined();
  });

  it('suspends then resolves', async () => {
    const tree = (
      <DataProvider>
        <MockResolver fixtures={results.full}>
          <AsyncBoundary fallback="loading">
            <ArticleList maxResults={10} />
          </AsyncBoundary>
        </MockResolver>
      </DataProvider>
    );
    const { findByText } = render(tree);
    expect(findByText('loading')).toBeDefined();

    await waitFor(() =>
      expect(findByText(results.full[0].response[0].content)).toBeDefined(),
    );
  })
});
```
