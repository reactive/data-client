---
title: '<MockResolver />'
---

<head>
  <title>MockResolver - Data Mocking for React</title>
</head>

```typescript
function MockResolver<T>(props: {
  children: React.ReactNode;
  fixtures: (Fixture | Interceptor<T>)[];
  getInitialInterceptorData: () => T;
}): JSX.Element;
```

&lt;MockResolver /\> enables easy loading of fixtures to see what different network responses might look like.
This is useful for [storybook](../guides/storybook.md) as well as component testing.

## Arguments

### fixtures

```ts
(Fixture | Interceptor<T>)[]
```

This prop specifies the [fixtures or interceptors](./Fixtures.md) to use data from. Each item represents a fetch defined by the
[Endpoint](/rest/api/Endpoint) and params. `Result` contains the JSON response expected from said fetch.

### getInitialInterceptorData

Function that initializes the `this` attribute for all interceptors.

```ts
<MockResolver
  fixtures={[
    {
      endpoint: new RestEndpoint({
        path: '/api/count/increment',
        method: 'POST',
        body: undefined,
      }),
      response() {
        return {
          // highlight-next-line
          count: (this.count = this.count + 1),
        };
      },
      delay: () => 500 + Math.random() * 4500,
    },
  ]}
  // highlight-next-line
  getInitialInterceptorData={() => ({ count: 0 })}
>
  {children}
</MockResolver>
```

## Example

```tsx
import { MockResolver } from '@data-client/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  // fixture
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
  // interceptor
  {
    endpoint: ArticleResource.partialUpdate,
    response: ({ id }, body) => ({
      ...body,
      id,
    }),
  },
];

const Template: Story = () => (
  <MockResolver fixtures={results}>
    <MyComponentToTest />
  </MockResolver>
);

export const MyStory = Template.bind({});
```
