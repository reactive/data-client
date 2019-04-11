# Mocking unfinished endpoints

You have agreed to an API schema with a backend engineer who will implement it;
but they are starting to code the same time as you. It would be nice to easily
mock the endpoint and use it in a way such that when the endpoint is done
you won't need to make major changes to your code.

`resource/RatingResource.ts`

```typescript
import {
  Resource,
  ReadShape,
  SchemaArray,
  AbstractInstanceType,
  RequestOptions,
} from 'rest-hooks';

export default class RatingResource extends Resource {
  readonly id: string = '';
  readonly rating: number = 4.6;
  readonly author: string = '';
  readonly date: string = '1990-01-01T00:00:00Z';

  pk() {
    return this.id;
  }

  static urlRoot = '/ratings';

  static getRequestOptions(): RequestOptions {
    return {
      dataExpiryLength: 10 * 60 * 1000, // 10 minutes
    };
  }

  static listRequest<T extends typeof Resource>(
    this: T,
  ): ReadShape<SchemaArray<AbstractInstanceType<T>>> {
    return {
      ...super.listRequest(),
      fetch(url: string, body?: Readonly<object>) {
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

By mocking the [fetch](../api/RequestShape.md#fetchurl-string-body-payload-promiseany) part of
[RequestShape](../api/RequestShape.md) we can easily fake the data the server will return. Doing
this allows free use of the strongly typed RatingResource as normal throughout the codebase.

Once the API is implemented you can simply remove the custom fetch (and the entire listRequest()
override if that's all it's doing).

In this example we also set the dataExpiryLength to a longer time so the random values generated
persist longer. This makes for a more realistic demo.
