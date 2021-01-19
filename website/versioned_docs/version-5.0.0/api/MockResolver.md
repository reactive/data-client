---
title: <MockResolver />
id: version-5.0.0-MockResolver
original_id: MockResolver
---

```typescript
function MockResolver({
  children,
  results,
}: {
  children: React.ReactNode;
  results: Fixture[];
}): JSX.Element;
```

\<MockResolver /> enables easy loading of fixtures to see what different network responses might look like.
This is useful for [storybook](../guides/storybook.md) as well as component testing.


## Arguments

### fixtures

```typescript
export interface SuccessFixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: object | string | number;
  error?: false;
}

export interface ErrorFixture {
  request: ReadShape<Schema, object>;
  params: object;
  result: Error;
  error: true;
}

export type Fixture = SuccessFixture | ErrorFixture;
```

This prop specifies the fixtures to use data from. Each item represents a fetch defined by the
[Endpoint](api/Endpoint.md) and params. `Result` contains the JSON response expected from said fetch.

## Returns

```typescript
JSX.Element
```

Renders the children prop.

## Example

```tsx
import { MockResolver } from '@rest-hooks/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  {
    request: ArticleResource.list(),
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

const Template: Story = () => (
  <MockResolver fixtures={results}><MyComponentToTest /></MockResolver>
);

export const MyStory = Template.bind({});
```
