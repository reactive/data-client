---
title: 在 React 中渲染异步数据
vue_title: 在 Vue 中渲染异步数据
sidebar_label: 渲染数据
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

# 渲染异步数据

只需一行 [useSuspense()](../api/useSuspense.md)，就能在**使用**数据的地方绑定数据，让你的组件可复用；
它能 :react[像]:vue[配合] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) 一样保证数据的存在。

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

```tsx title="PostDetail" {5} collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ setRoute, id }) {
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
      <a
        href="#"
        onClick={e => {
          e.preventDefault();
          setRoute('list');
        }}
      >
        « Back
      </a>
    </div>
  );
}
```

```tsx title="PostItem" collapsed
import { type Post } from './Resources';

export default function PostItem({ post, setRoute }: Props) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              setRoute(`detail/${post.id}`);
            }}
          >
            {post.title}
          </a>
        </h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}

interface Props {
  post: Post;
  setRoute: Function;
}
```

```tsx title="PostList" {6}
import { useSuspense } from '@data-client/react';
import PostItem from './PostItem';
import { PostResource } from './Resources';

export default function PostList({ setRoute }) {
  const posts = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} setRoute={setRoute} />
      ))}
    </div>
  );
}
```

```tsx title="Navigation" collapsed
import React from 'react';
import { useController, useLoading, useQuery } from '@data-client/react';
import { PostResource } from './Resources';
import PostList from './PostList';
import PostDetail from './PostDetail';

function Navigation() {
  const [route, setRoute] = React.useState('list');
  if (route.startsWith('detail'))
    return <PostDetail setRoute={setRoute} id={route.split('/')[1]} />;

  return (
    <>
      <PostList setRoute={setRoute} />
      <LoadMore />
    </>
  );
}

function LoadMore() {
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
render(<Navigation />);
```

:::

:::vue

```html title="PostDetail.vue" {7} collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const emit = defineEmits<{ setRoute: [route: string] }>();
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
    <a href="#" @click.prevent="emit('setRoute', 'list')">« Back</a>
  </div>
</template>
```

```html title="PostItem.vue" collapsed
<script setup lang="ts">
  import { type Post } from './Resources';

  defineProps<{ post: Post }>();
  const emit = defineEmits<{ setRoute: [route: string] }>();
</script>

<template>
  <div class="listItem spaced">
    <Avatar :src="post.author.profileImage" />
    <div>
      <h4>
        <a href="#" @click.prevent="emit('setRoute', `detail/${post.id}`)">
          {{ post.title }}
        </a>
      </h4>
      <small>by {{ post.author.name }}</small>
    </div>
  </div>
</template>
```

```html title="PostList.vue" {7}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import PostItem from './PostItem.vue';
  import { PostResource } from './Resources';

  const emit = defineEmits<{ setRoute: [route: string] }>();
  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div>
    <PostItem
      v-for="post in posts"
      :key="post.pk()"
      :post="post"
      @setRoute="emit('setRoute', $event)"
    />
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

```html title="Navigation.vue" collapsed
<script setup lang="ts">
  import { ref, computed } from 'vue';
  import PostList from './PostList.vue';
  import PostDetail from './PostDetail.vue';
  import LoadMore from './LoadMore.vue';

  const route = ref('list');
  const detailId = computed(() =>
    route.value.startsWith('detail')
      ? route.value.split('/')[1]
      : undefined,
  );
</script>

<template>
  <PostDetail v-if="detailId" :id="detailId" @setRoute="route = $event" />
  <template v-else>
    <PostList @setRoute="route = $event" />
    <LoadMore />
  </template>
</template>
```

:::

</FrameworkPlayground>

<a href="https://react.dev/learn/passing-data-deeply-with-context" target="_blank">
<ThemedImage
alt="在许多上下文中使用的 Endpoint"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

不要进行 [prop 逐层传递](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props)。而是在渲染数据的组件中直接调用 [useSuspense()](../api/useSuspense.md)。这被
称为 _数据就近放置_（data co-location）。

不要把数据绑定 hook 藏在自定义 hook 中。而应把紧密耦合的数据转换放在
[Query](/rest/api/Query) 中——数据逻辑应当与数据模型放在一起，这样它保持可见、可复用，
并且可以独立于视图自由修改。

Reactive Data Client 会在[数据变化](./mutations.md)时立即自动更新绑定的组件，无需编写复杂的更新函数或级联失效逻辑。
这被称为 _响应式编程_。

## 加载与错误 {#async-fallbacks}

你可能已经注意到，返回类型表明这个值总是存在的。[useSuspense()](../api/useSuspense.md) 的工作方式非常
:react[像]:vue[配合] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。这让我们
可以把错误和加载的处理与数据的使用分离开来。

### 异步边界 {#boundaries}

我们会在**页面、路由或[模态框](https://www.appcues.com/blog/modal-dialog-windows)**等导航边界处或其上层放置 :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[Vue 内置的 [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) 以及 [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]，
用来处理加载和错误状态。

<AsyncBoundaryExamples />

:::react

借助 React 18 的 [useTransition](https://react.dev/reference/react/useTransition) 和基于[服务端渲染](../guides/ssr.md)
的路由或导航，你将再也看不到加载 fallback。在 React 16 和 17 中，可以集中管理 fallback，
在保持组件可复用的同时消除冗余的加载指示器。

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) 还能让[服务端渲染](../guides/ssr.md)以增量方式流式传输 HTML，
大幅降低 [TTFB](https://web.dev/ttfb/)。[Reactive Data Client SSR](../guides/ssr.md) 的自动 store 注水
意味着首次加载时用户可以立即交互，且客户端获取次数为**零**。

AsyncBoundary 的[错误 fallback](../api/AsyncBoundary.md#errorcomponent) 和[加载 fallback](../api/AsyncBoundary.md#fallback) 都
可以定制。

:::

:::vue

以这种方式集中管理 fallback，可以在保持组件可复用的同时消除冗余的加载指示器。
加载 fallback 通过 [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html#loading-state) 的 `#fallback` 插槽定制，
错误 fallback 则通过渲染你在 [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) 中选择的内容来定制。

:::

### 有状态的方式 {#stateful}

在某些情况下，你可能会发现使用有状态的方式处理 :react[fallback 仍然有用（在使用 React 16 和 17 时）。]:vue[fallback 仍然有用。]
对于这些情况，或者为了兼容某些组件库，我们提供了 [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror。

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

```tsx title="ProfileList"
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

```html title="ProfileList.vue" {5}
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

由于 [useDLE](../api/useDLE.md) 不使用 [useSuspense](../api/useSuspense.md)，你将无法轻松地集中
编排加载和错误处理的 :vue[代码。]:react[代码。此外，React 18 的特性，例如 [useTransition](https://react.dev/reference/react/useTransition)
和[增量流式 SSR](../guides/ssr.md)，在使用它的组件中将无法工作。]

## 条件获取 {#conditional}

<ConditionalDependencies />

## 订阅 {#subscriptions}

当数据可能因外部因素而发生变化时，[useSubscription()](../api/useSubscription.md)
可以确保组件挂载期间持续更新。[useLive()](../api/useLive.md) 会同时调用
[useSubscription()](../api/useSubscription.md) 和 [useSuspense()](../api/useSuspense.md)，让你能够
非常轻松地使用最新数据。

<UseLive />

订阅由 [Managers](../api/Manager.md) 编排。开箱即用地，
只需在 Endpoint 或 Resource 上添加 [pollFrequency](/rest/api/Endpoint#pollfrequency)，就可以使用基于轮询的订阅。
对于 SSE 和 websockets 这类基于推送的网络协议，请参阅[数据流 manager 示例](../concepts/managers.md#data-stream)。

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
