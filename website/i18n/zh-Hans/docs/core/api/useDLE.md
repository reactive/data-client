---
title: useDLE() - [D]ata [L]oading [E]rror React 状态
vue_title: useDLE() - [D]ata [L]oading [E]rror Vue 状态
sidebar_label: useDLE()
description: 高性能的异步数据渲染，不会过度获取，并附带获取的元数据。
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {RestEndpoint} from '@data-client/rest';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import PkgTabs from '@site/src/components/PkgTabs';
import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';

# useDLE() - [D]ata [L]oading [E]rror

高性能的异步数据渲染，不会过度获取，并附带获取的元数据。

如果你无法使用 [suspense](../getting-started/data-dependency.md#async-fallbacks)，useDLE() 与 [useSuspense()](./useSuspense.md) 完全一样，只是它会返回 [D]ata [L]oading [E]rror（数据、加载、错误）这几个值。

`useDLE()` 会响应数据[变更](../getting-started/mutations.md)，只在必要时重新渲染。

## 用法 {#usage}

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

```html title="ProfileList.vue"
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

## 行为 {#behavior}

:::vue

`data`、`loading` 和 `error` 各自都是一个 [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed)。
请在 `<script setup>` 的顶层解构它们，这样它们在模板中会被自动解包。下表
描述的是它们的 `.value`。

:::

| 过期状态      | 获取            | Data         | Loading | Error             | 条件                                                                                                                                                                   |
| ------------- | --------------- | ------------ | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | 是<sup>1</sup>  | `undefined`  | true    | false             | 不在 store 中、[删除](/rest/api/resource#delete)、[失效](./Controller.md#invalidate)、[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Stale         | 是<sup>1</sup>  | 反规范化后的值 | false   | false             | （首次渲染、参数变化）且 [expiry &lt; now](../concepts/expiry-policy.md)                                                                                           |
| Valid         | 否              | 反规范化后的值 | false   | 可能<sup>2</sup>  | 获取完成                                                                                                                                                               |
|               | 否              | `undefined`  | false   | false             | 第二个参数传入 `null`                                                                                                                                                  |

:::note

1. 相同的获取会被自动去重
2. [硬错误](../concepts/error-policy.md#hard)会被 :react[[Error Boundaries](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] [捕获](../getting-started/data-dependency#async-fallbacks)

:::

::::react

:::info[React Native]

使用 React Navigation 时，如果数据被视为过时，useDLE() 会在获得焦点时
触发获取。

:::

::::

<ConditionalDependencies hook="useDLE" />

## 类型 {#types}

:::react

<GenericsTabs>

```typescript
function useDLE(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): {
  data: Denormalize<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

```typescript
function useDLE<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(
  endpoint: E,
  ...args: Args
): {
  data: DenormalizeNullable<typeof endpoint.schema>;
  loading: boolean;
  error: Error | undefined;
};
```

</GenericsTabs>

:::

:::vue

```typescript
function useDLE(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): {
  data: ComputedRef<DenormalizeNullable<typeof endpoint.schema>>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<ErrorTypes | undefined>;
};
```

<VueArgs />

参数变化时，结果会随之更新。

:::

## 示例 {#examples}

### 详情 {#detail}

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
import React from 'react';
import { useDLE } from '@data-client/react';
import { ProfileResource } from './ProfileResource';

function ProfileDetail(): React.JSX.Element {
  const {
    data: profile,
    loading,
    error,
  } = useDLE(ProfileResource.get, { id: 1 });
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !profile) return <Loading />;
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
  import { useDLE } from '@data-client/vue';
  import { ProfileResource } from './ProfileResource';

  const {
    data: profile,
    loading,
    error,
  } = useDLE(ProfileResource.get, { id: 1 });
</script>

<template>
  <div v-if="error">Error {{ error.status }}</div>
  <Loading v-else-if="loading || !profile" />
  <div v-else class="listItem">
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

### 条件获取 {#conditional}

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

```tsx title="PostWithAuthor"
import { useDLE } from '@data-client/react';
import { PostResource, UserResource } from './Resources';

export default function PostWithAuthor({ id }: { id: string }) {
  const postDLE = useDLE(PostResource.get, { id });
  if (postDLE.error) return <div>Error {`${postDLE.error.status}`}</div>;
  if (postDLE.loading || !postDLE.data) return <Loading />;
  const authorDLE = useDLE(
    UserResource.get,
    postDLE.data.userId
      ? {
          id: postDLE.data.userId,
        }
      : null,
  );
  if (authorDLE.error)
    return <div>Error {`${authorDLE.error.status}`}</div>;
  if (authorDLE.loading || !authorDLE.data) return <Loading />;

  return <div>{authorDLE.data.username}</div>;
}
```

:::

:::vue

```html title="PostWithAuthor.vue" {15-21}
<script setup lang="ts">
  import { computed } from 'vue';
  import { useDLE } from '@data-client/vue';
  import { PostResource, UserResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const {
    data: post,
    loading: postLoading,
    error: postError,
  } = useDLE(PostResource.get, () => ({ id: props.id }));
  const {
    data: author,
    loading: authorLoading,
    error: authorError,
  } = useDLE(
    UserResource.get,
    computed(() =>
      post.value?.userId
        ? {
            id: post.value.userId,
          }
        : null,
    ),
  );
</script>

<template>
  <div v-if="postError">Error {{ postError.status }}</div>
  <Loading v-else-if="postLoading || !post" />
  <div v-else-if="authorError">Error {{ authorError.status }}</div>
  <Loading v-else-if="authorLoading || !author" />
  <div v-else>{{ author.username }}</div>
</template>
```

:::

</TypeScriptEditor>

### 嵌入数据 {#embedded-data}

当 Entity 存储在[嵌套结构](/rest/guides/relational-data#nesting)中时，该结构会被保留。

<TypeScriptEditor row={false}>

```typescript title="api/Post"
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
    results: new Collection([PaginatedPost]),
    nextPage: '',
    lastPage: '',
  },
});
```

:::react

```tsx title="ArticleList" {12}
import { useDLE } from '@data-client/react';
import { getPosts } from './api/Post';

export default function ArticleList({ page }: { page: string }) {
  const { data, loading, error } = useDLE(getPosts, { page });
  if (error) return <div>Error {`${error.status}`}</div>;
  if (loading || !data) return <Loading />;
  const { results: posts, nextPage, lastPage } = data;
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

```html title="ArticleList.vue" {14}
<script setup lang="ts">
  import { useDLE } from '@data-client/vue';
  import { getPosts } from './api/Post';

  const props = defineProps<{ page: string }>();
  const { data, loading, error } = useDLE(getPosts, () => ({ page: props.page }));
</script>

<template>
  <div v-if="error">Error {{ error.status }}</div>
  <Loading v-else-if="loading || !data" />
  <div v-else>
    <div v-for="post in data.results" :key="post.pk()">
      {{ post.title }}
    </div>
  </div>
</template>
```

:::

</TypeScriptEditor>

:::react

### Github 表情回应 {#github-reactions}

`useDLE()` 让我们可以在导航到任意 issue 页面的那一刻，声明式地获取其表情回应。这样
即使表情回应尚未加载完成，也不会阻塞 issue 页面的显示。

通常更好的做法是把这类情况包裹在新的 [Suspense 边界](../getting-started/data-dependency.md#boundaries)中。
然而，我们使用的组件库 `ant design` 不允许这样做。

<StackBlitz app="github-app" file="src/resources/Reaction.tsx,src/pages/IssueDetail/index.tsx" view="editor" initialpath="/reactive/data-client/issue/1113" height={750} />

:::
