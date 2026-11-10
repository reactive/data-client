---
title: Rendering Asynchronous Data in React
vue_title: Rendering Asynchronous Data in Vue
sidebar_label: Render Data
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import DataColocation from '@site/src/components/DataColocation';
import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import ListDetailDemo from '../shared/\_ListDetailDemo.mdx';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

# Rendering Asynchronous Data

Make your components reusable by binding the data where you **use** it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data :react[like]:vue[with] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<ListDetailDemo />

<DataColocation />

Do not [prop drill](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). Instead, [useSuspense()](../api/useSuspense.md) in the components that render the data from it. This is
known as _data co-location_. Pass ids or args as props, not fetched data a component only hands down
(a list passing each item to the row that renders it is fine). Components asking for the same
endpoint and args share one fetch and one copy in the store.

Do not hide data binding hooks inside custom hooks. Instead, put tightly coupled data transformations
in [Query](/rest/api/Query) — data logic belongs with the data model, where it stays visible, reusable,
and free to change independently of the view.

Instead of writing complex update functions or invalidations cascades, Reactive Data Client automatically updates
bound components immediately upon [data change](./mutations.md). This is known as _reactive programming_.

## Lists to details {#list-detail}

Open a post from `PostList` above, and `PostDetail` renders it without a fetch. The list response stored each `Post`,
and `PostResource.get`'s schema is `Post`, an [Entity](/rest/api/Entity). Entities are
[Queryable](/docs/concepts/queryable): until an endpoint has a response of its own, it queries the store with its
args, the way [`useQuery(Post, { id })`](../api/useQuery.md) does. By default, args like `{ id }` that match the fields
`pk()` reads find the Entity ([other arg shapes](/rest/api/Entity#pk-args)).

The post found this way keeps the expiry the list gave it. While it is fresh there is no request. Once
[stale](../concepts/expiry-policy.md), it still renders, and refetches in the background. `useSuspense()` suspends when the
post is missing, or when the endpoint is [invalidated](../api/Controller.md#invalidate) or
[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) and stale.

The same holds for any Queryable schema, such as an envelope like `{ data: Post }` or a
[Collection](/rest/api/Collection) another endpoint loaded, and for every way of reading an endpoint
([how endpoints query the store](/docs/concepts/queryable#endpoints)).

:::react

In the [React benchmarks](../concepts/performance.md), with a simulated 40 ms network delay, switching between a list
and its items is 21× faster than TanStack Query, which keys the detail query separately and fetches it.

:::

Finding the Entity doesn't check which fields it has. When list items lack fields the detail page shows, the detail
renders those fields' defaults and doesn't fetch while the list data is fresh. To make it fetch, give the list a
summary Entity with the same `key` and fewer fields, and make the detail Entity require the rest with
[Entity.validate()](/rest/api/Entity#validate) ([Partial entities](/rest/guides/partial-entities)): opened from the
list, the detail page then suspends and fetches the full item once.

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much
:react[like]:vue[with] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[Vue's built-in [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) along with [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] to handling loading and error conditions at or above navigational boundaries like **pages,
routes, or [modals](https://www.appcues.com/blog/modal-dialog-windows)**.

<AsyncBoundaryExamples />

:::react

React 18's [useTransition](https://react.dev/reference/react/useTransition) and [Server Side Rendering](../guides/ssr.md)
powered routers or navigation means never seeing a loading fallback again. In React 16 and 17 fallbacks can be centralized
to eliminate redundant loading indicators while keeping components reusable.

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) also allows [Server Side Rendering](../guides/ssr.md) to incrementally stream HTML,
greatly reducing [TTFB](https://web.dev/ttfb/). [Reactive Data Client SSR's](../guides/ssr.md) automatic store hydration
means immediate user interactivity with **zero** client-side fetches on first load.

AsyncBoundary's [error fallback](../api/AsyncBoundary.md#errorcomponent) and [loading fallback](../api/AsyncBoundary.md#fallback) can both
be customized.

:::

:::vue

Centralizing fallbacks this way eliminates redundant loading indicators while keeping components reusable.
The loading fallback is customized with the `#fallback` slot of [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html#loading-state),
and the error fallback by rendering what you choose from [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

### Stateful

You may find cases where it's still useful to use a stateful approach to :react[fallbacks when using React 16 and 17.]:vue[fallbacks.]
For these cases, or compatibility with some component libraries, [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror - is provided.

<FrameworkPlayground fixtures={listFixtures} row>

```typescript title="ProfileResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  avatar = '';
  fullName = '';
  bio = '';

  static key = 'Profile';
}

export const ProfileResource = resource({
  path: '/profiles/:id',
  schema: Profile,
});
```

:::react

```tsx title="ProfileList" {6-8}
import React from 'react';
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList(): React.JSX.Element {
  const { data, loading, error } = useDLE(ProfileResource.getList);
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <Loading />;
  return (
    <div>
      {data.map(profile => (
        <div className="listItem" key={profile.pk()}>
          <Avatar src={profile.avatar} />
          <div>
            <h4>{profile.fullName}</h4>
            <p>{profile.bio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
render(<ProfileList />);
```

:::

:::vue

```html title="ProfileList.vue" {5,9-10}
<script setup lang="ts">
  import { useDLE } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const { data, loading, error } = useDLE(ProfileResource.getList);
</script>

<template>
  <div v-if="error">Error {{ error.status }}</div>
  <Loading v-else-if="loading || !data" />
  <div v-else>
    <div class="listItem" v-for="profile in data" :key="profile.pk()">
      <Avatar :src="profile.avatar" />
      <div>
        <h4>{{ profile.fullName }}</h4>
        <p>{{ profile.bio }}</p>
      </div>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

Since [useDLE](../api/useDLE.md) does not [useSuspense](../api/useSuspense.md), you won't be able to easily centrally
orchestrate loading and error :vue[code.]:react[code. Additionally, React 18 features like [useTransition](https://react.dev/reference/react/useTransition),
and [incrementally streaming SSR](../guides/ssr.md) won't work with components that use it.]

## Conditional

<ConditionalDependencies />

## Subscriptions

When data is likely to change due to external factor; [useSubscription()](../api/useSubscription.md)
ensures continual updates while a component is mounted. [useLive()](../api/useLive.md) calls both
[useSubscription()](../api/useSubscription.md) and [useSuspense()](../api/useSuspense.md), making it quite
easy to use fresh data.

<UseLive />

Subscriptions are orchestrated by [Managers](../api/Manager.md). Out of the box,
polling based subscriptions can be used by adding [pollFrequency](/rest/api/Endpoint#pollfrequency) to an Endpoint or Resource.
For pushed based networking protocols like SSE and websockets, see the [example stream manager](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
