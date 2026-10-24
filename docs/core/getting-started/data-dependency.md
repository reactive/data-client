---
title: Rendering Asynchronous Data in React
vue_title: Rendering Asynchronous Data in Vue
sidebar_label: Render Data
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import DataColocation from '@site/src/components/DataColocation';
import { boundaryFixtures } from '@site/src/fixtures/post-comments';
import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

export const boundaryDemo = [
  { delay: 1000, click: 'a[href="/posts/1"]' },
  // past the comments' 2s delay, so the page shows in full
  { wait: 3000 },
];

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
    <center>
      <button onClick={nextPage}>{isPending ? '...' : 'Load more'}</button>
    </center>
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
  <div v-if="canLoadMore" style="text-align: center">
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

## Loading and Error {#async-fallbacks}

You might have noticed the return type shows the value is always there. [useSuspense()](../api/useSuspense.md) operates very much
:react[like]:vue[with] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). This enables
us to make error/loading disjoint from data usage.

### Async Boundaries {#boundaries}

Instead we place :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[Vue's built-in [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) along with [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] to handling loading and error conditions at or above navigational boundaries like **pages,
routes, or [modals](https://www.appcues.com/blog/modal-dialog-windows)**.

<FrameworkPlayground fixtures={boundaryFixtures} demo autoRun={boundaryDemo}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';
  author = '';
  avatar = '';
  static key = 'Post';
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});

export class Comment extends Entity {
  id = 0;
  postId = 0;
  author = '';
  avatar = '';
  text = '';
  static key = 'Comment';
}
export const CommentResource = resource({
  path: '/comments/:id',
  searchParams: {} as { postId: string },
  schema: Comment,
});
```

:::react

```tsx title="Layout" layout collapsed docs-only
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Field Notes</h1>
      </header>
      {children}
    </>
  );
}
```

```tsx title="PostList" route="/" collapsed docs-only
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostList() {
  const posts = useSuspense(PostResource.getList);
  return (
    <div className="card">
      {posts.map(post => (
        <div key={post.pk()} className="listItem">
          <Avatar src={post.avatar} />
          <div>
            <h3>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h3>
            <small>{post.author}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="PostPage" route="/posts/:id" {7,10}
import { AsyncBoundary } from '@data-client/react';
import CommentList from './CommentList';
import PostDetail from './PostDetail';

export default function PostPage({ id }: { id: string }) {
  return (
    <AsyncBoundary fallback={<Loading />}>
      <PostDetail id={id} />
      <CommentList postId={id} />
    </AsyncBoundary>
  );
}
```

```tsx title="PostDetail" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ id }: { id: string }) {
  const post = useSuspense(PostResource.get, { id });
  return (
    <article>
      <h2>{post.title}</h2>
      <p className="byline">
        <Avatar src={post.avatar} size={20} />
        {post.author}
      </p>
      <p>{post.body}</p>
    </article>
  );
}
```

```tsx title="CommentList" collapsed
import { useSuspense } from '@data-client/react';
import { CommentResource } from './Resources';

export default function CommentList({ postId }: { postId: string }) {
  const comments = useSuspense(CommentResource.getList, { postId });
  return (
    <section>
      <h3>Comments</h3>
      <div className="card">
        {comments.map(comment => (
          <div key={comment.pk()} className="listItem">
            <Avatar src={comment.avatar} size={28} />
            <div>
              <b>{comment.author}</b>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

:::

:::vue

```html title="Layout.vue" layout collapsed
<template>
  <header class="appHeader">
    <h1 class="appTitle">Field Notes</h1>
  </header>
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
      <template #fallback><Loading /></template>
    </Suspense>
  </RouterView>
</template>
```

```html title="PostList.vue" route="/" collapsed docs-only
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div class="card">
    <div v-for="post in posts" :key="post.pk()" class="listItem">
      <Avatar :src="post.avatar" />
      <div>
        <h3>
          <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
        </h3>
        <small>{{ post.author }}</small>
      </div>
    </div>
  </div>
</template>
```

```html title="PostPage.vue" route="/posts/:id" {9,15}
<script setup lang="ts">
  import CommentList from './CommentList.vue';
  import PostDetail from './PostDetail.vue';

  defineProps<{ id: string }>();
</script>

<template>
  <Suspense>
    <div>
      <PostDetail :id="id" />
      <CommentList :post-id="id" />
    </div>
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

```html title="PostDetail.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
</script>

<template>
  <article>
    <h2>{{ post.title }}</h2>
    <p class="byline">
      <Avatar :src="post.avatar" :size="20" />
      {{ post.author }}
    </p>
    <p>{{ post.body }}</p>
  </article>
</template>
```

```html title="CommentList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { CommentResource } from './Resources';

  const props = defineProps<{ postId: string }>();
  const comments = await useSuspense(CommentResource.getList, () => ({
    postId: props.postId,
  }));
</script>

<template>
  <section>
    <h3>Comments</h3>
    <div class="card">
      <div v-for="comment in comments" :key="comment.pk()" class="listItem">
        <Avatar :src="comment.avatar" :size="28" />
        <div>
          <b>{{ comment.author }}</b>
          <p>{{ comment.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
```

:::

</FrameworkPlayground>

:react[Show the code and move the `<AsyncBoundary>` to wrap just `<CommentList />`: the post shows before its comments do.]

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
