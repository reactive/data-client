---
title: v7 - React Native, Web and SSR upgrades and more
authors: [ntucker]
tags:
  [
    releases,
    rest-hooks,
    packages,
    rest,
    resource,
    endpoint,
  ]
---
import PkgTabs from '@site/src/components/PkgTabs';

###  Rest Hooks 7

For most people, [upgrading to Rest Hooks 7](https://resthooks.io/docs/upgrade/upgrading-to-7) is as easy as upgrading the packages as long as you aren’t using previously (2 years ago) deprecated exports.

<PkgTabs pkgs="rest-hooks@7 @rest-hooks/react@6 @rest-hooks/redux@6 @rest-hooks/test@9 @rest-hooks/img@0.7" upgrade />

The big difference here is all react-specific code has been moved into
[@rest-hooks/react](https://www.npmjs.com/package/@rest-hooks/react), which is now a peer dependency of the other
packages. The [rest-hooks](https://www.npmjs.com/package/rest-hooks) package re-exports everything from @rest-hooks/react.

[Upgrade to Rest Hooks 7 guide](/docs/upgrade/upgrading-to-7)

### @rest-hooks/react@7

Once the `rest-hooks` package is upgraded, you can optionally upgrade @rest-hooks/react to 7.

<PkgTabs pkgs="@rest-hooks/react@7" upgrade />

#### React Native

Because the React Native and Web interfaces are the same, we ship them in the same package
and delivery appropriate specializations where appropriate.

The only breaking change is that [useSuspense](/docs/api/useSuspense), useSubscription,
useLive, useFetch are all react-native aware. This is unlikely to cause any issue, as
screen focus will trigger fetches on stale data.

### @rest-hooks/react&#64;7.1

New additions in 7.1

- [LogoutManager](/docs/api/LogoutManager) listens for 401 to trigger logout
- [useLive()](/docs/api/useLive) combines useSuspense() with useSubscription()
- [&lt;AsyncBoundary/>](/docs/api/AsyncBoundary) combines Suspense with NetworkErrorBoundary
- [Middleware API gets full controller](/docs/api/Manager)
- Block dispatches after unmount ([#2307](https://github.com/data-client/rest-hooks/issues/2307))

### @rest-hooks/ssr&#64;0.7

Newly [added guide](/docs/guides/ssr) and utilities specific for making [NextJS integration easier](/docs/guides/ssr#nextjs).

<!--truncate-->

import HooksPlayground from '@site/src/components/HooksPlayground';
import { RestEndpoint } from '@rest-hooks/rest';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<PkgTabs pkgs="@rest-hooks/ssr @rest-hooks/redux redux" />

```tsx title="pages/_document.tsx"
import { RestHooksDocument } from '@rest-hooks/ssr/nextjs';

export default RestHooksDocument;
```

```tsx  title="pages/_app.tsx"
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

#### Demo

<iframe
  loading="lazy"
  src="https://stackblitz.com/github/data-client/rest-hooks/tree/master/examples/nextjs?embed=1&file=pages%2FAssetPrice.tsx&hidedevtools=1&view=both&terminalHeight=0&hideNavigation=1"
  width="100%"
  height="500"
></iframe>

See [full SSR guide for NextJS](/docs/guides/ssr#nextjs)

### LogoutManager

Secure authentication expires at some point. Typically this results in APIs responding with
a 401 status. To provide a batteries-included solution for this case, [LogoutManager](/docs/api/LogoutManager)
was introduced. It's fully configurable so be sure to [check out the docs](/docs/api/LogoutManager) for more details.


<Tabs
defaultValue="18-web"
groupId="platform"
values={[
{ label: 'React Web 16+', value: 'web' },
{ label: 'React Web 18+', value: '18-web' },
{ label: 'React Native', value: 'native' },
{ label: 'NextJS', value: 'nextjs' },
]}>
<TabItem value="web">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

ReactDOM.render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
  document.body,
);
```

</TabItem>

<TabItem value="18-web">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import ReactDOM from 'react-dom';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

ReactDOM.createRoot(document.body).render(
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>,
);
```

</TabItem>

<TabItem value="native">

```tsx title="/index.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import { AppRegistry } from 'react-native';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

const Root = () => (
  <CacheProvider managers={managers}>
    <App />
  </CacheProvider>
);
AppRegistry.registerComponent('MyApp', () => Root);
```

</TabItem>

<TabItem value="nextjs">

```tsx title="pages/_app.tsx"
import { CacheProvider, LogoutManager } from '@rest-hooks/react';
import { AppCacheProvider } from '@rest-hooks/ssr/nextjs';
import type { AppProps } from 'next/app';

// highlight-next-line
const managers = [new LogoutManager(), ...CacheProvider.defaultProps.managers];

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppCacheProvider managers={managers}>
      <Component {...pageProps} />
    </AppCacheProvider>
  );
}
```

</TabItem>
</Tabs>

[PR #2293](https://github.com/data-client/rest-hooks/pull/2293)

### useLive

Often [useSubscription()](/docs/api/useSubscription) is used in the same components that [useSuspense()](/docs/api/useSuspense) is. To reduce verbosity
we have introduced [useLive()](/docs/api/useLive) which simply calls both useSubscription() and useSuspense().

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
  path: '/exchange-rates',
  searchParams: {} as { currency: string },
  schema: { data: ExchangeRates },
  pollFrequency: 15000,
});
```

```tsx title="ProfileList.tsx" collapsed
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

[PR #2287](https://github.com/data-client/rest-hooks/issues/2287)

### AsyncBoundary

Suspense and [NetworkErrorBoundary](/docs/api/NetworkErrorBoundary) are often co-located. To simplify this common
case we introduced [AsyncBoundary](/docs/api/AsyncBoundary)

```tsx {5,8}
import { AsyncBoundary } from '@rest-hooks/react';

function App() {
  return (
    <AsyncBoundary>
      <AnotherRoute />
      <TodoDetail id={5} />
    </AsyncBoundary>
  );
}
```

[PR #2270](https://github.com/data-client/rest-hooks/pull/2270)

### Manager.getMiddleware() API changes

Manager middleware has been designed to be compatible with redux. This means the original
API had `{ dispatch, getState }` as its arguments to the middleware.

[Controller](/docs/api/Controller) is a superset of this functionality, and its methods provide a more type-safe
way of interacting with the flux lifecycle. Because of this we have moved to pass the
[whole controller](/docs/api/Controller#fetch), instead of just dispatch, and getState.

```ts
class Controller {
  /*************** Action Dispatchers ***************/
  fetch(endpoint, ...args) => ReturnType<E>;
  invalidate(endpoint, ...args) => Promise<void>;
  resetEntireStore: () => Promise<void>;
  receive(endpoint, ...args, response) => Promise<void>;
  receiveError(endpoint, ...args, error) => Promise<void>;
  resolve(endpoint, { args, response, fetchedAt, error }) => Promise<void>;
  subscribe(endpoint, ...args) => Promise<void>;
  unsubscribe(endpoint, ...args) => Promise<void>;
  /*************** Data Access ***************/
  getResponse(endpoint, ...args, state)​ => { data, expiryStatus, expiresAt };
  getError(endpoint, ...args, state)​ => ErrorTypes | undefined;
  snapshot(state: State<unknown>, fetchedAt?: number): SnapshotInterface;
  getState(): State<unknown>;
}
```

Of course existing Managers just using dispatch and/or getState will continue to work.

[PR #2290](https://github.com/data-client/rest-hooks/issues/2290)
