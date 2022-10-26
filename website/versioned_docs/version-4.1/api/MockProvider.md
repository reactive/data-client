---
title: "<MockProvider />"
id: MockProvider
original_id: MockProvider
---

```typescript
function MockProvider({
  children,
  results,
}: {
  children: React.ReactChild;
  results: Fixture[];
}): JSX.Element;
```

\<MockProvider /\> is a simple substitute provider to prefill the cache with fixtures so the 'happy path'
can be tested. This is useful for [storybook](../guides/storybook.md) as well as component testing.

## Arguments

### results

```typescript
interface Fixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: object | string | number;
}
```

This prop specifies the fixtures to use data from. Each item represents a fetch defined by the
[FetchShape](./FetchShape.md) and params. `Result` contains the JSON response expected from said fetch.

## Returns

```typescript
JSX.Element
```

Renders the children prop.

## Example

```typescript
import { MockProvider } from '@rest-hooks/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  {
    request: ArticleResource.listShape(),
    params: { maxResults: 10 },
    result: [
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

<MockProvider results={results}>
  <MyComponentToTest />
</MockProvider>
```
