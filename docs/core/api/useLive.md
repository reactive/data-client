---
title: useLive()
---

<head>
  <title>useLive() - Data fetching and updating for React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';

Async rendering of frequently changing remote data.

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) in one hook.

## Usage

<HooksPlayground row>

```typescript title="ExchangeRates" collapsed
import { Entity, RestEndpoint } from '@data-client/rest';

export class ExchangeRates extends Entity {
  currency = 'USD';
  rates: Record<string, number> = {};

  pk(): string {
    return this.currency;
  }

  static schema = {
    rates: new schema.Values(FloatSerializer),
  };
}

export const getExchangeRates = new RestEndpoint({
  urlPrefix: 'https://www.coinbase.com/api/v2',
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  pollFrequency: 15000,
});
```

```tsx title="AssetPrice"
import { useLive } from '@data-client/react';
import { getExchangeRates } from './ExchangeRates';

function AssetPrice({ symbol }: Props) {
  const currency = 'USD';
  const { data: price } = useLive(getExchangeRates, { currency });
  return (
    <center>
      {symbol}{' '}
      <Formatted value={1 / price.rates[symbol]} formatter="currency" />
    </center>
  );
}
interface Props {
  symbol: string;
}
render(<AssetPrice symbol="BTC" />);
```

</HooksPlayground>

## Behavior

<ConditionalDependencies hook="useLive" />

:::info React Native

When using React Navigation, useLive() will trigger fetches on focus if the data is considered
stale. useLive() will also sub/unsub with focus/unfocus respectively.

:::

## Types

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

## Examples

### Bitcoin Price

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/nextjs?embed=1&file=pages%2Fapi%2FExchangeRates.ts,pages%2FAssetPrice.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

Explore more [Reactive Data Client demos](/demos)
