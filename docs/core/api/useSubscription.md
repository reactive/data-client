---
title: useSubscription() - Updating frequent data changes in React
sidebar_label: useSubscription()
description: Keeps data fresh, but only when component is active. Supports polling, websockets, and SSE.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import StackBlitz from '@site/src/components/StackBlitz';

# useSubscription()

Great for keeping resources up-to-date with frequent changes.

When using the default [polling subscriptions](./PollingSubscription), frequency must be set in
[Endpoint](/rest/api/Endpoint), otherwise will have no effect.

:::tip

[useLive()](./useLive.md) is a terser way to use in combination with [useSuspense()](./useSuspense.md),

:::

## Usage

```typescript title="api/Price"
import { Resource, Entity } from '@data-client/rest';

export class Price extends Entity {
  readonly symbol: string | undefined = undefined;
  readonly price: string = '0.0';
  // ...

  pk() {
    return this.symbol;
  }
}

export const getPrice = new RestEndpont({
  urlPrefix: 'http://test.com',
  path: '/price/:symbol',
  schema: Price,
  pollFrequency: 5000,
});
```

```tsx title="MasterPrice"
import { useSuspense, useSubscription } from '@data-client/react';
import { getPrice } from 'api/Price';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(getPrice, { symbol });
  useSubscription(getPrice, { symbol });
  // ...
}
```


## Behavior

<ConditionalDependencies hook="useSubscription" />

:::info React Native

When using React Navigation, useSubscription() will sub/unsub with focus/unfocus respectively.

:::

## Types

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

## Examples

### Only subscribe while element is visible

```tsx title="MasterPrice.tsx"
import { useRef } from 'react';
import { useSuspense, useSubscription } from '@data-client/react';
import { getPrice } from 'api/Price';

function MasterPrice({ symbol }: { symbol: string }) {
  const price = useSuspense(getPrice, { symbol });
  const ref = useRef();
  const onScreen = useOnScreen(ref);
  // null params means don't subscribe
  useSubscription(getPrice, onScreen ? null : { symbol });

  return (
    <div ref={ref}>{price.value.toLocaleString('en', { currency: 'USD' })}</div>
  );
}
```

Using the last argument `active` we control whether the subscription is active or not
based on whether the element rendered is [visible on screen](https://usehooks.com/useOnScreen/).

[useOnScreen()](https://usehooks.com/useOnScreen/) uses [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), which is very performant. [useRef](https://react.dev/reference/react/useRef) allows
us to access the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

### Crypto prices (websockets)

We implemented our own `StreamManager` to handle our custom websocket protocol. Here we listen to the subcribe/unsubcribe
actions sent by `useSubscription` to ensure we only listen to updates for components that are rendered.

<StackBlitz app="coin-app" file="src/resources/StreamManager.ts,src/resources/Ticker.ts,src/pages/Home/AssetPrice.tsx" height="600" />
