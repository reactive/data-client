---
title: Mocking unfinished endpoints
id: mocking-unfinished
original_id: mocking-unfinished
---

You have agreed to an API schema with a backend engineer who will implement it;
but they are starting to code the same time as you. It would be nice to easily
mock the endpoint and use it in a way such that when the endpoint is done
you won't need to make major changes to your code.

`resource/RatingResource.ts`

```typescript
import { Resource, FetchOptions } from 'rest-hooks';

export default class RatingResource extends Resource {
  readonly id: string = '';
  readonly rating: number = 4.6;
  readonly author: string = '';
  readonly date: string = '1990-01-01T00:00:00Z';

  pk() {
    return this.id;
  }

  static urlRoot = '/ratings';

  static getFetchOptions(): FetchOptions {
    return {
      dataExpiryLength: 10 * 60 * 1000, // 10 minutes
    };
  }

  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      fetch(params: Readonly<object>, body?: Readonly<object | string>) {
        return Promise.resolve(
          ['Morningstar', 'Seekingalpha', 'Morningstar', 'CNBC'].map(
            author => ({
              id: `${Math.random()}`,
              rating: randomFloatInRange(2, 5).toFixed(1),
              author,
              date: '1990-01-01T00:00:00Z',
            }),
          ),
        );
      },
    };
  }
}
```

By mocking the [fetch](../api/FetchShape.md#fetchurl-string-body-payload-promiseany) part of
[FetchShape](../api/FetchShape.md) we can easily fake the data the server will return. Doing
this allows free use of the strongly typed RatingResource as normal throughout the codebase.

Once the API is implemented you can simply remove the custom fetch (and the entire listShape()
override if that's all it's doing).

In this example we also set the dataExpiryLength to a longer time so the random values generated
persist longer. This makes for a more realistic demo.
