---
title: mockInitialState()
---

```typescript
function mockInitialState(results: Fixture[]): State;
```

`mockInitialState()` facilita preencher previamente o cache com [fixtures](./Fixtures.md). Ele é
usado em :react[[&lt;MockResolver /\>](./MockResolver) para processar a prop results]:vue[`MockPlugin` para processar a opção fixtures]. No entanto, também
pode ser útil passá-lo a um provider normal ao testar fluxos mais completos
que precisam lidar com `dispatches` (e, portanto, com fetch).

### Argumentos {#arguments}

#### results {#results}

```typescript
export type Fixture = SuccessFixture | ErrorFixture;
```

Esta prop especifica as [fixtures](./Fixtures.md) de onde os dados serão usados. Cada item representa um fetch definido pelo
[Endpoint](/rest/api/Endpoint) e seus params. `Result` contém a resposta JSON esperada desse fetch.

Isso pode ser usado como :react[a prop initialState do [&lt;DataProvider /\>](./DataProvider)]:vue[a [opção initialState](./DataClientPlugin.md#initialState) do [DataClientPlugin](./DataClientPlugin.md)]

## Exemplo {#example}

```ts title="fixtures.ts"
import ArticleResource from 'resources/ArticleResource';

export const results = [
  {
    endpoint: ArticleResource.getList,
    args: [{ maxResults: 10 }],
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
];
```

:::react

```tsx
import { DataProvider } from '@data-client/react';
import { mockInitialState } from '@data-client/test';

import MyComponentToTest from 'components/MyComponentToTest';
import { results } from './fixtures';

<DataProvider initialState={mockInitialState(results)}>
  <MyComponentToTest />
</DataProvider>;
```

:::

:::vue

```ts
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { mockInitialState } from '@data-client/vue/test';

import MyComponentToTest from 'components/MyComponentToTest.vue';
import { results } from './fixtures';

const app = createApp(MyComponentToTest);
app.use(DataClientPlugin, { initialState: mockInitialState(results) });
app.mount('#app');
```

:::
