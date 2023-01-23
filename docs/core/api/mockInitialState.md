---
title: mockInitialState()
---

```typescript
function mockInitialState(results: Fixture[]): State;
```

`mockInitialState()` makes it easy to construct prefill the cache with fixtures. It's
used in [<MockResolver /\>](./MockResolver) to process the results prop. However, this
can also be useful to send into a normal provider when testing more complete flows
that need to handle `dispatches` (and thus fetch).

### Arguments

#### results

```typescript
export interface SuccessFixture<
  E extends EndpointInterface = EndpointInterface,
> {
  readonly endpoint: E;
  readonly args: Parameters<E>;
  readonly response:
    | ResolveType<E>
    | ((...args: Parameters<E>) => ResolveType<E>);
  readonly error?: false;
  /** Number of miliseconds to wait before resolving */
  readonly delay?: number;
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

export interface ErrorFixture<E extends EndpointInterface = EndpointInterface> {
  readonly endpoint: E;
  readonly args: Parameters<E>;
  readonly response: any;
  readonly error: true;
  /** Number of miliseconds to wait before resolving */
  readonly delay?: number;
  /** Waits to run `response()` after `delay` time */
  readonly delayCollapse?: boolean;
}

export type Fixture = SuccessFixture | ErrorFixture;
```

This prop specifies the fixtures to use data from. Each item represents a fetch defined by the
[Endpoint](/rest/api/Endpoint) and params. `Result` contains the JSON response expected from said fetch.


This can be used as the initialState prop for [<CacheProvider /\>](./CacheProvider)

## Example

```typescript
import { CacheProvider } from '@rest-hooks/react';
import { mockInitialState } from '@rest-hooks/test';

import ArticleResource from 'resources/ArticleResource';
import MyComponentToTest from 'components/MyComponentToTest';

const results = [
  {
    request: ArticleResource.getList,
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

<CacheProvider initialState={mockInitialState(results)}>
  <MyComponentToTest />
</CacheProvider>;
```
