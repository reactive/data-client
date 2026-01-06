# ![Data Client Testing](https://raw.githubusercontent.com/reactive/data-client/master/packages/core/data_client_logo_and_text.svg?sanitize=true)

[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)

<div align="center">

**[🏁Guides](https://dataclient.io/docs/guides/storybook)** &nbsp;|&nbsp; [🏁API Reference](https://dataclient.io/docs/api/Fixtures)

</div>

## Features

- [x] [Mocking for Storybook](https://dataclient.io/docs/guides/storybook)
- [x] [Fixtures for component tests](https://dataclient.io/docs/guides/unit-testing-components)
- [x] [Hook unit testing utility](https://dataclient.io/docs/guides/unit-testing-hooks)

## Usage

<details>
<summary><b>Resource</b></summary>

```typescript
import { resource, Entity } from '@data-client/rest';

export default class Article extends Entity {
  id = '';
  content = '';
  author: number | null = null;
  contributors: number[] = [];
}
export const ArticleResource = resource({
  urlRoot: 'http://test.com',
  path: '/article/:id',
  schema: Article,
})
```

</details>

<details>
<summary><b>Fixtures</b></summary>

```typescript
export default {
  full: [
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
  ],
  empty: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }],
      response: [],
    },
  ],
  error: [
    {
      endpoint: ArticleResource.getList,
      args: [{ maxResults: 10 }],
      response: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
  loading: [],
};
```

</details>

<details open><summary><b>Storybook</b></summary>

```typescript
import { MockResolver } from '@data-client/test';
import type { Fixture } from '@data-client/test';
import { Story } from '@storybook/react/types-6-0';

import ArticleList from 'ArticleList';
import options from './fixtures';

export default {
  title: 'Pages/ArticleList',
  component: ArticleList,
};

export const FullArticleList = ({ result }) => (
  <MockResolver fixtures={options[result]}>
    <ArticleList maxResults={10} />
  </MockResolver>
);
```

</details>

<details open><summary><b>Hook Unit Test</b></summary>

```typescript
import { DataProvider } from '@data-client/react';
import { renderDataHook } from '@data-client/test';
import options from './fixtures';

it('should resolve list', async () => {
  const { result } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.getList, {
        maxResults: 10,
      });
    },
    { initialFixtures: options.full },
  );
  expect(result.current).toBeDefined();
  expect(result.current.length).toBe(2);
  expect(result.current[0]).toBeInstanceOf(ArticleResource);
});

it('should throw errors on bad network', async () => {
  const { result } = renderDataHook(
    () => {
      return useSuspense(ArticleResource.getList, {
        maxResults: 10,
      });
    },
    { initialFixtures: options.error },
  );
  expect(result.error).toBeDefined();
  expect((result.error as any).status).toBe(400);
});
```

</details>
