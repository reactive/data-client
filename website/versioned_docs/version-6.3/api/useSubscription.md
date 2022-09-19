---
title: useSubscription()
---

<head>
  <title>useSubscription() - Fresh data for Rest Hooks</title>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/_conditional_dependencies.mdx';

<GenericsTabs>

```typescript
function useSubscription(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): void;
```

```typescript
function useSubscription<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): void;
```

</GenericsTabs>

Great for keeping resources up-to-date with frequent changes.

When using the default [polling subscriptions](./PollingSubscription), frequency must be set in
[Endpoint](/rest/api/Endpoint), otherwise will have no effect.

> Send `null` to params to unsubscribe.

## Example

`PriceResource.ts`

```typescript
import { Resource } from '@rest-hooks/rest';
import { EndpointExtraOptions } from '@rest-hooks/endpoint';

export default class PriceResource extends Resource {
  readonly symbol: string | undefined = undefined;
  readonly price: string = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
  static urlRoot = 'http://test.com/price/';

  /** Used as default options for every Endpoint */
  static getEndpointExtra(): EndpointExtraOptions {
    return {
      pollFrequency: 5000, // every 5 seconds
    };
  }
}
```

`MasterPrice.tsx`

```tsx
import { useSuspense, useSubscription } from 'rest-hooks';
import PriceResource from 'resources/PriceResource';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(PriceResource.detail(), { symbol });
  useSubscription(PriceResource.detail(), { symbol });
  // ...
}
```

## Only subscribe while element is visible

```tsx title="MasterPrice.tsx"
import { useRef } from 'react';
import { useSuspense, useSubscription } from 'rest-hooks';
import PriceResource from 'resources/PriceResource';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(PriceResource.detail(), { symbol });
  const ref = useRef();
  const onScreen = useOnScreen(ref);
  // null params means don't subscribe
  useSubscription(PriceResource.detail(), onScreen ? null : { symbol });

  return (
    <div ref={ref}>{price.value.toLocaleString('en', { currency: 'USD' })}</div>
  );
}
```

Using the last argument `active` we control whether the subscription is active or not
based on whether the element rendered is [visible on screen](https://usehooks.com/useOnScreen/).

[useOnScreen()](https://usehooks.com/useOnScreen/) uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant.

## Useful `Endpoint`s to send

[Resource](/rest/api/resource#provided-and-overridable-methods) provides these built-in:

- detail()
- list()

Be sure to extend these [Endpoint](/rest/api/Endpoint)s with a pollFrequency to set
the polling-rate.
