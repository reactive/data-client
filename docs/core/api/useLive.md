---
title: useLive()
---

<head>
  <title>useLive() - Use the data that is always fresh</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@rest-hooks/rest';

<GenericsTabs>

```typescript
function useLive(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema>;
```

```typescript
function useLive<
  E extends EndpointInterface<FetchFunction, Schema | undefined, undefined>,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): E['schema'] extends Exclude<Schema, null>
  ? Denormalize<E['schema']>
  : ReturnType<E>;
```

</GenericsTabs>

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md).

Fetch and use data, while keeping it fresh to change remote changes.

<ConditionalDependencies />

## Example

<HooksPlayground>

```typescript title="api/ExchangeRates.ts" collapsed
import { Entity, RestEndpoint } from '@rest-hooks/rest';

export class ExchangeRates extends Entity {
  readonly currency: string = 'USD';
  readonly rates: Record<string, string> = {};

  pk(): string {
    return this.currency;
  }
}

export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates\\?currency=:currency',
  schema: { data: ExchangeRates },
  pollFrequency: 15000,
});
```

```tsx title="ProfileList.tsx"
import { useLive } from '@rest-hooks/react';
import { getExchangeRates } from './api/ExchangeRates';

function AssetPrice({ symbol }: Props) {
  const { data: price } = useLive(getExchangeRates, {
    currency: 'USD',
  });
  const displayPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(1 / Number.parseFloat(price.rates[symbol]));
  return (
    <span>
      {symbol} {displayPrice}
    </span>
  );
}
interface Props {
  symbol: string;
}
render(<AssetPrice symbol="BTC" />);
```

</HooksPlayground>
