---
title: useLive()
---

<head>
  <title>useLive() - Rendering dynamic data in React</title>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import {RestEndpoint} from '@data-client/rest';
import StackBlitz from '@site/src/components/StackBlitz';
import UseLive from '../shared/\_useLive.mdx';

Async rendering of remotely triggered data mutations.

[useSuspense()](./useSuspense.md) + [useSubscription()](./useSubscription.md) in one hook.

`useLive()` is reactive to data [mutations](../getting-started/mutations.md); rerendering only when necessary.

## Usage

<UseLive />

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
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
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

### Bitcoin Price (polling)

When our component with `useLive` is rendered, `getTicker` will fetch at [pollFrequency](/rest/api/RestEndpoint#pollfrequency)
miliseconds.

<StackBlitz app="nextjs" file="resources/Ticker.ts,components/AssetPrice.tsx" initialpath="/crypto" view="both" />
