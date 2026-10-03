---
title: mockInitialState()
---

```typescript
function mockInitialState(results: Fixture[]): State;
```

`mockInitialState()` makes it easy to construct prefill the cache with [fixtures](./Fixtures.md). It's
used in :react[[&lt;MockResolver /\>](./MockResolver) to process the results prop]:vue[`MockPlugin` to process the fixtures option]. However, this
can also be useful to send into a normal provider when testing more complete flows
that need to handle `dispatches` (and thus fetch).

### Arguments

#### results

```typescript
export type Fixture = SuccessFixture | ErrorFixture;
```

This prop specifies the [fixtures](./Fixtures.md) to use data from. Each item represents a fetch defined by the
[Endpoint](/rest/api/Endpoint) and params. `Result` contains the JSON response expected from said fetch.


This can be used as the :react[initialState prop for [&lt;DataProvider /\>](./DataProvider)]:vue[`initialState` option for [DataClientPlugin](../getting-started/installation.md)]

## Example

:::react

```typescript
import { DataProvider } from '@data-client/react';
import { mockInitialState } from '@data-client/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
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

<DataProvider initialState={mockInitialState(results)}>
  <MyComponentToTest />
</DataProvider>;
```

:::

:::vue

```ts
import { createApp } from 'vue';
import { DataClientPlugin } from '@data-client/vue';
import { mockInitialState } from '@data-client/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest.vue';

const results = [
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

createApp(MyComponentToTest)
  .use(DataClientPlugin, { initialState: mockInitialState(results) })
  .mount('#app');
```

:::
