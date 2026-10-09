---
title: useCache() - 在 React 中访问规范化数据 store
vue_title: useCache() - 在 Vue 中访问规范化数据 store
sidebar_label: useCache()
description: 无需 fetch 即可渲染数据。访问任意 Endpoint 的响应。
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import VueArgs from '../shared/\_vueArgs.mdx';
import { RestEndpoint } from '@data-client/rest';

# useCache()

无需 fetch 即可渲染数据。

访问任意 [Endpoint](/rest/api/Endpoint) 的响应。如果响应不存在，则返回
`undefined`。这可以用来检查某个 `Endpoint's` 的响应是否存在，例如用于身份验证。

`useCache()` 会响应数据[变更](../getting-started/mutations.md)，仅在必要时重新渲染。

## 用法 {#usage}

<FrameworkPlayground fixtures={[
{
endpoint: new RestEndpoint({path: '/user'}),
args: [],
response: { id: '777', name: 'Albatras', isAdmin: true },
delay: 500,
},
]} row>

```ts title="UserResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = '';
  name = '';
  isAdmin = false;

  static key = 'User';
}
export const UserResource = resource({
  path: '/users/:id',
  schema: User,
}).extend('current', {
  path: '/user',
  schema: User,
});
```

:::react

```tsx title="Unauthed" collapsed
import { useController, useLoading } from '@data-client/react';
import { UserResource } from './UserResource';

export default function Unauthed() {
  const ctrl = useController();
  const [handleLogin, loading] = useLoading(
    (e: any) => ctrl.fetch(UserResource.current),
    [],
  );
  return (
    <div>
      <p>Not authorized</p>
      {loading ? (
        'logging in...'
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

```tsx title="Authorized" collapsed
import { useController } from '@data-client/react';
import { User, UserResource } from './UserResource';

export default function Authorized({ user }: { user: User }) {
  const ctrl = useController();
  const handleLogout = (e: any) => ctrl.invalidate(UserResource.current);

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

```tsx title="Entry"
import { useCache } from '@data-client/react';
import { UserResource } from './UserResource';
import Unauthed from './Unauthed';
import Authorized from './Authorized';

function AuthorizedPage() {
  // currentUser as User | undefined
  const currentUser = useCache(UserResource.current);
  // user is not logged in
  if (!currentUser) return <Unauthed />;
  // currentUser as User (typeguarded)
  return <Authorized user={currentUser} />;
}
render(<AuthorizedPage />);
```

:::

:::vue

```html title="Unauthed.vue" collapsed
<script setup lang="ts">
  import { useController, useLoading } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();
  const [handleLogin, loading] = useLoading(() =>
    ctrl.fetch(UserResource.current),
  );
</script>

<template>
  <div>
    <p>Not authorized</p>
    <template v-if="loading">logging in...</template>
    <button v-else @click="handleLogin">Login</button>
  </div>
</template>
```

```html title="Authorized.vue" collapsed
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource, type User } from './UserResource';

  defineProps<{ user: User }>();
  const ctrl = useController();
  const handleLogout = () => ctrl.invalidate(UserResource.current);
</script>

<template>
  <div>
    <p>Welcome, {{ user.name }}!</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>
```

```html title="AuthorizedPage.vue"
<script setup lang="ts">
  import { useCache } from '@data-client/vue';
  import { UserResource } from './UserResource';
  import Unauthed from './Unauthed.vue';
  import Authorized from './Authorized.vue';

  // currentUser as ComputedRef<User | undefined>
  const currentUser = useCache(UserResource.current);
</script>

<template>
  <!-- currentUser is unwrapped in the template -->
  <Authorized v-if="currentUser" :user="currentUser" />
  <!-- user is not logged in -->
  <Unauthed v-else />
</template>
```

:::

</FrameworkPlayground>

有关类型处理的更多信息，请参阅
[真值收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing)

## 行为 {#behavior}

:::vue

`useCache()` 返回一个 [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed)。下表
描述的是它的 `.value`。

:::

| 过期状态 | 返回值      | 条件                                                                                                                                                             |
| ------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 无效       | `undefined`  | 不在 store 中、[删除](/rest/api/resource#delete)、[失效](./Controller.md#invalidate)、[invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| 过时         | 反规范化数据 | （首次渲染、参数变化）& [过期时间 &lt; 当前时间](../concepts/expiry-policy.md)                                                                                           |
| 有效         | 反规范化数据 | fetch 完成                                                                                                                                                       |
|               | `undefined`  | 第二个参数传入 `null`                                                                                                                                         |

<ConditionalDependencies hook="useCache" />

## 类型 {#types}

:::react

<GenericsTabs>

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): Denormalize<typeof endpoint.schema> | null;
```

```typescript
function useCache<
  E extends Pick<
    EndpointInterface<FetchFunction, Schema | undefined, undefined>,
    'key' | 'schema' | 'invalidIfStale'
  >,
  Args extends readonly [...Parameters<E['key']>] | readonly [null],
>(endpoint: E, ...args: Args): DenormalizeNullable<E['schema']>;
```

</GenericsTabs>

:::

:::vue

```typescript
function useCache(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint.key>> | [null]
): ComputedRef<DenormalizeNullable<typeof endpoint.schema>>;
```

<VueArgs />

当参数变化时，结果会随之更新。

:::

:::react

## 示例 {#examples}

### Github 导航栏登录/登出 {#github-navbar-loginlogout}

当前用户只有在通过身份验证后才存在。因此我们可以使用 `useCache(UserResource.current)`
来决定显示登录还是登出导航按钮。

<StackBlitz app="github-app" file="src/resources/User.ts,src/navigation/NavBar.tsx" view="editor" />

### Github 评论授权 {#github-comment-authorization}

这里我们仅在用户通过身份验证后才显示评论表单。

<StackBlitz app="github-app" file="src/resources/User.ts,src/pages/IssueDetail/CreateComment.tsx" view="editor" />

:::
