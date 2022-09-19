---
title: "<MockResolver />"
---

```typescript
function MockResolver({
  children,
  fixtures,
}: {
  children: React.ReactNode;
  fixtures: Fixture[];
}): JSX.Element;
```

&lt;MockResolver /\> enables easy loading of fixtures to see what different network responses might look like.
This is useful for [storybook](../guides/storybook.md) as well as component testing.


## Arguments

### fixtures

```typescript
export interface SuccessFixtureEndpoint<
  E extends EndpointInterface = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: ResolveType<E>;
  error?: false;
}

/** @deprecated */
export interface SuccessFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: object | string | number;
  error?: false;
}

export interface ErrorFixtureEndpoint<
  E extends EndpointInterface = EndpointInterface,
> {
  endpoint: E;
  args: Parameters<E>;
  response: any;
  error: true;
}

/** @deprecated */
export interface ErrorFixture {
  request: FetchShape<Schema, any>;
  params?: any;
  body?: any;
  result: Error;
  error: true;
}

export type FixtureEndpoint = SuccessFixtureEndpoint | ErrorFixtureEndpoint;
export type Fixture = SuccessFixture | ErrorFixture | FixtureEndpoint;
```

This prop specifies the fixtures to use data from. Each item represents a fetch defined by the
[Endpoint](/rest/api/Endpoint) and params. `Result` contains the JSON response expected from said fetch.

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
    endpoint: ArticleResource.list(),
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
];

const Template: Story = () => (
  <MockResolver fixtures={results}><MyComponentToTest /></MockResolver>
);

export const MyStory = Template.bind({});
```
