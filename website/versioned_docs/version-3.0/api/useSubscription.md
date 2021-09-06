---
title: useSubscription()
id: useSubscription
original_id: useSubscription
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useSubscription(
  fetchShape: ReadShape,
  params: object | null,
): void;
```

<!--With Generics-->

```typescript
function useSubscription<
  Params extends Readonly<object>,
  S extends Schema
>(
  fetchShape: ReadShape<S, Params>,
  params: Params | null,
): void;
```

<!--END_DOCUSAURUS_CODE_TABS-->

Great for keeping resources up-to-date with frequent changes.

When using the default [polling subscriptions](./PollingSubscription), frequency must be set in
[FetchShape](./FetchShape.md), otherwise will have no effect.

> Send `null` to params to unsubscribe.

## Example

`PriceResource.ts`

```typescript
import { Resource, FetchOptions } from 'rest-hooks';

export default class PriceResource extends Resource {
  readonly symbol: string | undefined = undefined;
  readonly price: string = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
  static urlRoot = 'http://test.com/price/';

  /** Used as default options for every FetchShape */
  static getFetchOptions(): FetchOptions {
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
  const price = useResource(PriceResource.detailShape(), { symbol });
  useSubscription(PriceResource.detailShape(), { symbol });
  // ...
}
```

## Only subscribe while element is visible

`MasterPrice.tsx`

```tsx
import { useRef } from 'react';
import { useResource, useSubscription } from 'rest-hooks';
import PriceResource from 'resources/PriceResource';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useResource(PriceResource.detailShape(), { symbol });
  const ref = useRef();
  const onScreen = useOnScreen(ref);
  // null params means don't subscribe
  useSubscription(PriceResource.detailShape(), onScreen ? null : { symbol });

  return (
    <div ref={ref}>{price.value.toLocaleString('en', { currency: 'USD' })}</div>
  );
}
```

Using the last argument `active` we control whether the subscription is active or not
based on whether the element rendered is [visible on screen](https://usehooks.com/useOnScreen/).

[useOnScreen()](https://usehooks.com/useOnScreen/) uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant.

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Be sure to extend these [FetchShape](./FetchShape.md)s with a pollFrequency to set
the polling-rate.
