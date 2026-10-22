---
frameworks: [react]
title: Pruebas unitarias de componentes
---

:::warning

Ten cuidado al usar [jest.mock](https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options) en módulos como Reactive Data Client. Eliminar exports esperados
puede provocar errores difíciles de rastrear,
como `TypeError: Class extends value undefined is not a function or null`.

En su lugar, haz un [mock parcial](https://jestjs.io/docs/mock-functions#mocking-partials)
o, mejor aún, usa [mockResolvedValue](https://jestjs.io/docs/mock-functions#mocking-modules) en tus
endpoints.

:::

Si necesitas añadir pruebas unitarias a tus componentes para comprobar algún comportamiento, quizá quieras
evitar el ciclo de fetch de red, ya que probablemente es ortogonal a lo que estás
intentando probar. Usar [&lt;DataProvider /\>](../api/DataProvider.md) con [mockInitialState](../api/mockInitialState.md) y [Fixtures](../api/Fixtures.md) en nuestras pruebas nos permite
cargar la caché con los fixtures proporcionados, de modo que los componentes se rendericen de inmediato
con esos resultados.

Para probar las interacciones del usuario que desencadenan mutaciones puedes apoyarte en [&lt;MockResolver /\>](../api/MockResolver.md)
y en los [Interceptors](../api/Fixtures.md#interceptor)

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
