---
title: mockInitialState()
---

```typescript
function mockInitialState(results: Fixture[]): State;
```

`mockInitialState()` facilita construir y rellenar previamente la caché con [fixtures](./Fixtures.md). Se
usa en :react[[&lt;MockResolver /\>](./MockResolver) para procesar la prop results]:vue[`MockPlugin` para procesar la opción fixtures]. Sin embargo, también
puede ser útil para pasarlo a un provider normal al probar flujos más completos
que necesitan manejar `dispatches` (y por tanto fetch).

### Argumentos {#arguments}

#### results {#results}

```typescript
export type Fixture = SuccessFixture | ErrorFixture;
```

Esta prop especifica los [fixtures](./Fixtures.md) de los que se toman los datos. Cada elemento representa un fetch definido por el
[Endpoint](/rest/api/Endpoint) y los params. `Result` contiene la respuesta JSON esperada de dicho fetch.

Esto se puede usar como :react[la prop initialState de [&lt;DataProvider /\>](./DataProvider)]:vue[la [opción initialState](./DataClientPlugin.md#initialState) de [DataClientPlugin](./DataClientPlugin.md)]

## Ejemplo {#example}

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
