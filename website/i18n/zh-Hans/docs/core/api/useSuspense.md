---
title: useSuspense() - 为 React 简化数据获取
vue_title: useSuspense() - 为 Vue 简化数据获取
sidebar_label: useSuspense()
description: 高性能的异步数据渲染，不会过度获取。useSuspense() 就像是 React 组件的 await。
vue_description: 高性能的异步数据渲染，不会过度获取。useSuspense() 就像是 Vue 组件的 await。
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import PaginationDemo from '../shared/\_pagination.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { RestEndpoint } from '@data-client/rest';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import VueArgs from '../shared/\_vueArgs.mdx';

# useSuspense()

<p className="tagline">
  {
    'High performance async data rendering without overfetching.'
  }
</p>

:::react

`useSuspense()` 就像是 React 组件的 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。这意味着组件的其余部分只会在数据加载完成后才运行，从而免去了处理加载和错误状态的复杂性。fallback 处理则通过单个 [AsyncBoundary](../api/AsyncBoundary.md)
[集中管理](../getting-started/data-dependency.md#boundaries)。

:::

:::vue

在 Vue 组件中 [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) `useSuspense()`。这意味着组件的其余部分只会在数据加载完成后才运行，从而免去了处理加载和错误状态的复杂性。fallback 处理则通过 Vue 内置的 [Suspense](https://vuejs.org/guide/built-ins/suspense.html)
[集中管理](../getting-started/data-dependency.md#boundaries)。

:::

`useSuspense()` 会响应数据[变更](../getting-started/mutations.md)，并且只在必要时重新渲染。

## 用法 {#usage}

<Tabs
defaultValue="rest"
groupId="protocol"
values={[
{ label: 'Rest', value: 'rest' },
{ label: 'Promise', value: 'other' },
]}>
<TabItem value="rest">

<FrameworkPlayground fixtures={detailFixtures} row>

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

```tsx title="ProfileDetail"
import { useSuspense } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileDetail() {
  const profile = useSuspense(ProfileResource.get, { id: 1 });
  return (
    <div className="listItem">
      <Avatar src={profile.avatar} />
      <div>
        <h4>{profile.fullName}</h4>
        <p>{profile.bio}</p>
      </div>
    </div>
  );
}
render(<ProfileDetail />);
```

:::

:::vue

```html title="ProfileDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const profile = await useSuspense(ProfileResource.get, { id: 1 });
</script>

<template>
  <div class="listItem">
    <Avatar :src="profile.avatar" />
    <div>
      <h4>{{ profile.fullName }}</h4>
      <p>{{ profile.bio }}</p>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

</TabItem>
<TabItem value="other">

<FrameworkPlayground row>

```typescript title="Profile" collapsed
import { Endpoint } from '@data-client/endpoint';

export const getProfile = new Endpoint(
  (id: number) =>
    Promise.resolve({
      id,
      fullName: 'Jing Chen',
      bio: 'Creator of Flux Architecture',
      avatar: 'https://avatars.githubusercontent.com/u/5050204?v=4',
    }),
  {
    key(id) {
      return `getProfile${id}`;
    },
  },
);
```

:::react

```tsx title="ProfileDetail"
import { useSuspense } from '@data-client/react';
import { getProfile } from './Profile';

function ProfileDetail() {
  const profile = useSuspense(getProfile, 1);
  return (
    <div className="listItem">
      <Avatar src={profile.avatar} />
      <div>
        <h4>{profile.fullName}</h4>
        <p>{profile.bio}</p>
      </div>
    </div>
  );
}
render(<ProfileDetail />);
```

:::

:::vue

```html title="ProfileDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getProfile } from './Profile';

  const profile = await useSuspense(getProfile, 1);
</script>

<template>
  <div class="listItem">
    <Avatar :src="profile.avatar" />
    <div>
      <h4>{{ profile.fullName }}</h4>
      <p>{{ profile.bio }}</p>
    </div>
  </div>
</template>
```

:::

</FrameworkPlayground>

</TabItem>
</Tabs>

## 行为 {#behavior}

缓存策略默认为 [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861)，但也[可以配置](../concepts/expiry-policy.md)。

| 过期状态 | 获取           | 挂起 | 错误             | 条件                                                                                                                                                                   |
| ------------- | --------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 无效       | 是<sup>1</sup> | 是     | 否                | 不在 store 中、[删除](/rest/api/resource#delete)、[失效](./Controller.md#invalidate)、 [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| 过时         | 是<sup>1</sup> | 否      | 否                | （首次渲染、参数变化）且 [expiry &lt; now](../concepts/expiry-policy.md)                                                                                                 |
| 有效         | 否              | 否      | 可能<sup>2</sup> | 获取完成                                                                                                                                                             |
|               | 否              | 否      | 否                | 第二个参数传入 `null`                                                                                                                                               |

:::note

1. 相同的获取请求会自动去重
2. [硬错误](../concepts/error-policy.md#hard)会被 :react[[Error Boundary](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] [捕获](../getting-started/data-dependency#async-fallbacks)

:::

::::react

:::info[React Native]

使用 React Navigation 时，如果数据被视为过时，useSuspense() 会在获得焦点时触发获取。

:::

::::

<ConditionalDependencies />

## 类型 {#types}

:::react

<GenericsTabs>

```typescript
function useSuspense(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema>;
```

```typescript
function useSuspense<
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

:::

:::vue

```typescript
function useSuspense(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): Promise<DeepReadonly<ComputedRef<Denormalize<typeof endpoint.schema>>>>;
```

<VueArgs />

参数变化时，结果会随之更新。
在新参数对应的数据加载期间，结果会保留之前的数据，而不会变成 `undefined`。
如果这次获取失败，读取结果时会抛出该错误（取决于其[错误策略](../concepts/error-policy.md)），从而让错误到达
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)。

:::

## 示例 {#examples}

### 列表 {#list}

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

```tsx title="ProfileList"  {5}
import { useSuspense } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileList() {
  const profiles = useSuspense(ProfileResource.getList);
  return (
    <div>
      {profiles.map(profile => (
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

```html title="ProfileList.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const profiles = await useSuspense(ProfileResource.getList);
</script>

<template>
  <div>
    <div class="listItem" v-for="profile in profiles" :key="profile.pk()">
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

### 分页 {#pagination}

响应式[分页](/rest/guides/pagination)通过[可变 schema](/rest/api/Collection) 实现

<PaginationDemo defaultTab="PostList" />

### 顺序请求 {#sequential}

当获取参数依赖于另一个资源的数据时。

:::react

```tsx
import { useSuspense } from '@data-client/react';
import { PostResource, UserResource } from './resources';

function PostWithAuthor({ id }: { id: string }) {
  const post = useSuspense(PostResource.get, { id });
  const author = useSuspense(UserResource.get, {
    // highlight-next-line
    id: post.userId,
  });
}
```

:::

:::vue

```html
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { PostResource, UserResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
  const author = await useSuspense(UserResource.get, () => ({
  // highlight-next-line
    id: post.value.userId,
  }));
</script>
```

:::

### 条件请求 {#conditional}

传入 `null` 可以避免绑定和获取数据

<TypeScriptEditor row={false}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  userId = 0;
  title = '';
  body = '';

  static key = 'Post';
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});

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
```

:::react

```tsx title="PostWithAuthor" {8-12}
import { useSuspense } from '@data-client/react';
import { PostResource, UserResource } from './Resources';

export default function PostWithAuthor({ id }: { id: string }) {
  const post = useSuspense(PostResource.get, { id });
  const author = useSuspense(
    UserResource.get,
    post.userId
      ? {
          id: post.userId,
        }
      : null,
  );
  // author as User | undefined
  if (!author) return;
}
```

:::

:::vue

```html title="PostWithAuthor.vue" {10-16}
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { PostResource, UserResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
  const author = await useSuspense(
    UserResource.get,
    computed(() =>
      post.value.userId
        ? {
            id: post.value.userId,
          }
        : null,
    ),
  );
  // author as ComputedRef<User | undefined>
</script>

<template>
  <div v-if="author">
    <!-- render author -->
  </div>
</template>
```

:::

</TypeScriptEditor>

### 嵌入数据 {#embedded-data}

当 entity 存储在[嵌套结构](/rest/guides/relational-data#nesting)中时，该结构会被保留。

<TypeScriptEditor row={false}>

```typescript title="api/Post" {14-18}
import { Entity, RestEndpoint, Collection } from '@data-client/rest';

export class PaginatedPost extends Entity {
  id = '';
  title = '';
  content = '';

  static key = 'PaginatedPost';
}

export const getPosts = new RestEndpoint({
  path: '/post',
  searchParams: { page: '' },
  schema: {
    posts: new Collection([PaginatedPost]),
    nextPage: '',
    lastPage: '',
  },
});
```

:::react

```tsx title="ArticleList" {6-8}
import { useSuspense } from '@data-client/react';
import { getPosts } from './api/Post';

export default function ArticleList({ page }: { page: string }) {
  const {
    posts,
    nextPage,
    lastPage,
  } = useSuspense(getPosts, { page });
  return (
    <div>
      {posts.map(post => (
        <div key={post.pk()}>{post.title}</div>
      ))}
    </div>
  );
}
```

:::

:::vue

```html title="ArticleList.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { getPosts } from './api/Post';

  const props = defineProps<{ page: string }>();
  const data = await useSuspense(getPosts, () => ({ page: props.page }));
</script>

<template>
  <div>
    <div v-for="post in data.posts" :key="post.pk()">{{ post.title }}</div>
  </div>
</template>
```

:::

</TypeScriptEditor>

:::react

### 服务端渲染 {#server-side-rendering}

[服务端渲染](../guides/ssr.md)可以增量地流式传输 HTML，
大幅降低 [TTFB](https://web.dev/ttfb/)。[Reactive Data Client SSR](../guides/ssr.md) 会自动完成 store 注水，
这意味着用户可以立即交互，且首次加载时客户端获取请求为**零**。

<StackBlitz app="nextjs" file="resources/TodoResource.ts,components/todo/TodoList.tsx" />

组件中的用法完全相同，这意味着你可以轻松地在 SSR 和非 SSR 应用之间共享组件，
也可以迁移到 <abbr title="服务端渲染">SSR</abbr> 而无需修改 data-client 相关代码。

### 并发模式 {#concurrent-mode}

在 React 18 中，使用 [startTransition](https://react.dev/reference/react/useTransition#starttransition) 进行导航，可以让 [AsyncBoundary](./AsyncBoundary.md)
在新数据加载期间继续显示之前的画面。结合
[流式服务端渲染](../guides/ssr.md)，就不再需要闪现恼人的加载指示器，
从而改善用户体验。

点击其中一个名字，即可导航到该用户的待办事项。这里较长的加载状态由干扰更少的
_加载条_ 来提示，就像 [YouTube](https://youtube.com) 和 [Robinhood](https://robinhood.com) 所做的那样。

<StackBlitz app="todo-app" file="src/pages/Home/TodoList.tsx,src/pages/Home/index.tsx,src/useNavigationState.ts" height={600} />

如果你需要在自己的自定义路由中加入这一功能，请查看 [React 官方指南](https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router)

:::
