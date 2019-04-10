# useSubscription()

```typescript
function useSubscription<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  selectShape: ReadShape<S, Params, Body>,
  params: Params | null,
  body?: Body,
): void;
```

Great for keeping resources up-to-date with frequent changes.

Frequency must be set in [RequestShape](./RequestShape.md), otherwise will have no affect.

## Example

`PriceResource.ts`

```typescript
import { Resource, RequestOptions } from 'rest-hooks';

export default class PriceResource extends Resource {
  readonly symbol: string | null = null;
  readonly price: string = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
  static urlRoot = 'http://test.com/price/';

  /** Used as default options for every RequestShape */
  static getRequestOptions(): RequestOptions {
    return {
      pollFrequency: 5000, // every 5 seconds
    };
  }
}
```

`MasterPrice.tsx`

```tsx
import { useResource, useSubscription } from 'rest-hooks';
import PriceResource from 'resources/PriceResource';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useResource(PriceResource.singleRequest(), { symbol });
  useSubscription(PriceResource.singleRequest(), { symbol });
  // ...
}
```

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- singleRequest()
- listRequest()

Be sure to extend these [RequestShape](./RequestShape.md)s with a pollFrequency to set
the polling-rate.
