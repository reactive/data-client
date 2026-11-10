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
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

# Rendering Asynchronous Data

Make your components reusable by binding the data where you **use** it with the one-line [useSuspense()](../api/useSuspense.md),
which guarantees data :react[like]:vue[with] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

<FrameworkPlayground defaultOpen="n" row fixtures={postFixtures}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = 0;
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static key = 'User';
}
export const UserResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/users/:id',
  schema: User,
});

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
  paginationField: 'page',
});
```

:::react

```tsx title="PostDetail" route="/posts/:id" {5} collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ id }) {
  const post = useSuspense(PostResource.get, { id });
  return (
    <div>
      <header>
        <div className="listItem spaced">
          <div className="author">
            <Avatar src={post.author.profileImage} />
            <small>{post.author.name}</small>
          </div>
          <h4>{post.title}</h4>
        </div>
      </header>
      <p>{post.body}</p>
    </div>
  );
}
```

```tsx title="PostItem" collapsed
import { type Post } from './Resources';

export default function PostItem({ post }: { post: Post }) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}
```

```tsx title="PostList" route="/" {7}
import { useSuspense } from '@data-client/react';
import LoadMore from './LoadMore';
import PostItem from './PostItem';
import { PostResource } from './Resources';

export default function PostList() {
  const posts = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <LoadMore />
    </div>
  );
}
```

```tsx title="LoadMore" collapsed
import { useController, useLoading, useQuery } from '@data-client/react';
import { PostResource } from './Resources';

export default function LoadMore() {
  const ctrl = useController();
  const posts = useQuery(PostResource.getList.schema);
  const [nextPage, isPending] = useLoading(() =>
    ctrl.fetch(PostResource.getList.getPage, { page: 2 }),
  );
  if (!posts || posts.length % 3 !== 0) return null;
  return (
    <div className="loadMore">
      <button onClick={nextPage}>{isPending ? '...' : 'Load more'}</button>
    </div>
  );
}
```

:::

:::vue

```html title="PostDetail.vue" route="/posts/:id" {6} collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
</script>

<template>
  <div>
    <header>
      <div class="listItem spaced">
        <div class="author">
          <Avatar :src="post.author.profileImage" />
          <small>{{ post.author.name }}</small>
        </div>
        <h4>{{ post.title }}</h4>
      </div>
    </header>
    <p>{{ post.body }}</p>
  </div>
</template>
```

```html title="PostItem.vue" collapsed
<script setup lang="ts">
  import { type Post } from './Resources';

  defineProps<{ post: Post }>();
</script>

<template>
  <div class="listItem spaced">
    <Avatar :src="post.author.profileImage" />
    <div>
      <h4>
        <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
      </h4>
      <small>by {{ post.author.name }}</small>
    </div>
  </div>
</template>
```

```html title="PostList.vue" route="/" {7}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import LoadMore from './LoadMore.vue';
  import PostItem from './PostItem.vue';
  import { PostResource } from './Resources';

  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div>
    <PostItem v-for="post in posts" :key="post.pk()" :post="post" />
    <LoadMore />
  </div>
</template>
```

```html title="LoadMore.vue" collapsed
<script setup lang="ts">
  import { computed } from 'vue';
  import { useController, useLoading, useQuery } from '@data-client/vue';
  import { PostResource } from './Resources';

  const ctrl = useController();
  const posts = useQuery(PostResource.getList.schema);
  const [nextPage, isPending] = useLoading(() =>
    ctrl.fetch(PostResource.getList.getPage, { page: 2 }),
  );
  const canLoadMore = computed(
    () => !!posts.value && posts.value.length % 3 === 0,
  );
</script>

<template>
  <div v-if="canLoadMore" class="loadMore">
    <button @click="nextPage">
      {{ isPending ? '...' : 'Load more' }}
    </button>
  </div>
</template>
```

:::

</FrameworkPlayground>

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

Open a post from `PostList` above, and `PostDetail` renders it without a fetch. `PostResource.get`'s schema is the
`Post` [Entity](/rest/api/Entity), so until that endpoint has a response of its own, `useSuspense()` looks for the post
in the store by its args ([Entity.queryKey](/rest/api/Entity#queryKey)). The list response already put each post it
returned there. The lookup runs the Entity's `pk()` on the args, so `{ id }` produces the same key the list stored the
post under ([how it works](/rest/api/Entity#pk-args)); args `pk()` doesn't read, like `expand` in
`{ id, expand: 'comments' }`, don't change the lookup.

`useSuspense()` fetches only when the post is missing. When the stored post is [stale](../concepts/expiry-policy.md),
it renders it and refetches in the background (an
[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) endpoint suspends instead). Its expiry comes from
the response that stored it, here the list's.

The Entity can also sit in an object schema, such as an envelope like `{ data: Post }`. Every other member of that
object is looked up with the same args: plain values are fine, an Array or Values member makes the endpoint always fetch,
a [Collection](/rest/api/Collection) member is found only when the store already holds it for those args, and a second
Entity is found by the same `id`, so keep one Entity per detail schema. The lookup
works for every way of reading an endpoint: [useDLE()](../api/useDLE.md), [useCache()](../api/useCache.md) and
[Controller.fetchIfStale()](../api/Controller.md#fetchIfStale) in router loaders (`Controller.fetch()` always requests).

:::react

In the [React benchmarks](../concepts/performance.md), with a simulated 40 ms network delay, switching between a list
and its items is 21× faster than TanStack Query, which keys the detail query separately and fetches it.

:::

When list items lack fields the detail page shows, the detail page renders those fields' defaults and does not fetch
while the list data is fresh. To make it fetch, give the list a summary Entity with the same `key` and fewer fields,
and make the detail Entity require the rest with [Entity.validate()](/rest/api/Entity#validate)
([Partial entities](/rest/guides/partial-entities)): opened from the list, the detail page then suspends and fetches
the full item once.

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
