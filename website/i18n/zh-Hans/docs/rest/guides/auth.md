---
title: Rest 身份验证
sidebar_label: 身份验证
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

所有网络请求都会经过你在 [RestEndpoint](../api/RestEndpoint.md) 中
可选定义的 [getRequestInit](../api/RestEndpoint.md#getRequestInit)。

## Cookie 认证（credentials） {#cookie-auth-credentials}

下面是一个通过发送 [fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included) 实现简单 [cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) 认证的示例：

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'Cookie': 'session=abc;'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="AuthdEndpoint" {9}
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
}
```

```ts title="MyResource" collapsed
import { resource, Entity } from '@data-client/rest';
import AuthdEndpoint from './AuthdEndpoint';

class MyEntity extends Entity {
  id = '';
  title = '';
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

```ts title="Usage" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>

同时包含 [CSRF 防护](https://docs.djangoproject.com/en/5.0/howto/csrf/#using-csrf-protection-with-ajax)的示例请参阅 [Django 集成](./django.md)。

## Access Token 或 JWT {#access-tokens-or-jwt}

<Tabs
defaultValue="static"
values={[
{ label: 'static member', value: 'static' },
{ label: 'function singleton', value: 'function' },
{ label: 'async function', value: 'async' },
]}>
<TabItem value="static">

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'Access-Token': 'mytoken'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="login" collapsed
export const login = async (data: FormData) =>
  (
    await fetch('/login', { method: 'POST', body: data })
  ).json() as Promise<{
    accessToken: string;
  }>;
```

```ts title="AuthdEndpoint" {7,15,22}
import { RestEndpoint, type RestGenerics } from '@data-client/rest';
import { login } from './login';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  declare static accessToken?: string;

  getHeaders(headers: HeadersInit) {
    // TypeScript doesn't infer properly
    const EP = this.constructor as typeof AuthdEndpoint;
    if (!EP.accessToken) return headers;
    return {
      ...headers,
      'Access-Token': EP.accessToken,
    };
  }
}

export const handleLogin = async e => {
  const { accessToken } = await login(new FormData(e.target));
  AuthdEndpoint.accessToken = accessToken;
};
```

:::react

```tsx title="Auth" collapsed nocheck
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed nocheck
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
  import AuthForm from './AuthForm.vue';
</script>

<template>
  <AuthForm @submit="handleLogin" />
</template>
```

:::

```ts title="MyResource" collapsed
import { resource, Entity } from '@data-client/rest';
import AuthdEndpoint from './AuthdEndpoint';

class MyEntity extends Entity {
  id = '';
  title = '';
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

```ts title="Usage" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>

</TabItem>
<TabItem value="async">

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'Access-Token': 'mytoken'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="login" collapsed
export const login = async (data: FormData) =>
  (
    await fetch('/login', { method: 'POST', body: data })
  ).json() as Promise<{
    accessToken: string;
  }>;

let token = '';
// imagine this used an async API like indexedDB
export const getAuthToken = async () => token;
export const setAuthToken = (accessToken: string) => {
  token = accessToken;
};
```

```ts title="AuthdEndpoint" {10,17}
import { RestEndpoint, type RestGenerics } from '@data-client/rest';
import { getAuthToken, setAuthToken, login } from './login';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'Access-Token': await getAuthToken(),
    };
  }
}

export const handleLogin = async e => {
  const { accessToken } = await login(new FormData(e.target));
  setAuthToken(accessToken);
};
```

:::react

```tsx title="Auth" collapsed nocheck
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed nocheck
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
  import AuthForm from './AuthForm.vue';
</script>

<template>
  <AuthForm @submit="handleLogin" />
</template>
```

:::

```ts title="MyResource" collapsed
import { resource, Entity } from '@data-client/rest';
import AuthdEndpoint from './AuthdEndpoint';

class MyEntity extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

```ts title="Usage" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>

</TabItem>
<TabItem value="function">

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'Access-Token': 'mytoken'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="login" collapsed
export const login = async (data: FormData) =>
  (
    await fetch('/login', { method: 'POST', body: data })
  ).json() as Promise<{
    accessToken: string;
  }>;

let token = '';
export const getAuthToken = () => token;
export const setAuthToken = (accessToken: string) => {
  token = accessToken;
};
```

```ts title="AuthdEndpoint" {10,17}
import { RestEndpoint, type RestGenerics } from '@data-client/rest';
import { getAuthToken, setAuthToken, login } from './login';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  getHeaders(headers: HeadersInit) {
    return {
      ...headers,
      'Access-Token': getAuthToken(),
    };
  }
}

export const handleLogin = async e => {
  const { accessToken } = await login(new FormData(e.target));
  setAuthToken(accessToken);
};
```

:::react

```tsx title="Auth" collapsed nocheck
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed nocheck
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
  import AuthForm from './AuthForm.vue';
</script>

<template>
  <AuthForm @submit="handleLogin" />
</template>
```

:::

```ts title="MyResource" collapsed
import { resource, Entity } from '@data-client/rest';
import AuthdEndpoint from './AuthdEndpoint';

class MyEntity extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: AuthdEndpoint,
});
```

```ts title="Usage" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>

</TabItem>
</Tabs>

## 从 :react[React Context]:vue[provide/inject] 获取认证头 {#auth-headers-from-react-context}

:::warning

不建议将 :react[React Context]:vue[provide/inject] 用于不需要显示的状态（例如认证 token）。
这会导致不必要的重新渲染，并增加应用的复杂度。

:::

<Tabs
defaultValue="resource"
values={[
{ label: 'Resource', value: 'resource' },
{ label: 'RestEndpoint', value: 'endpoint' },
]}>
<TabItem value="resource">

借助 [hookifyResource](../api/hookifyResource.md)，我们可以把任意 [Resource](../api/resource.md) 转换为
使用 :react[hook]:vue[composable] 来创建 endpoint 的版本

:::react

```ts title="resources/Post.ts"
import { Entity, resource, hookifyResource } from '@data-client/rest';
import { useAuthContext } from '../AuthContext';

class Post extends Entity {
  id = '';
  title = '';
}

export const PostResource = hookifyResource(
  resource({ path: '/posts/:id', schema: Post }),
  function useInit(): RequestInit {
    const accessToken = useAuthContext();
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

然后就可以在 React 组件中以 hook 的形式获取这些 endpoint

```tsx
import { useSuspense } from '@data-client/react';
import { PostResource } from 'resources/Post';

function PostDetail({ id }) {
  const post = useSuspense(PostResource.useGet(), { id });
  return <div>{post.title}</div>;
}
```

:::

:::vue

```ts title="resources/Post.ts"
import { inject } from 'vue';
import { resource, hookifyResource } from '@data-client/rest';

// Post defined here

export const AuthKey = Symbol('accessToken');

export const PostResource = hookifyResource(
  resource({ path: '/posts/:id', schema: Post }),
  function useInit(): RequestInit {
    const accessToken = inject(AuthKey, '');
    return {
      headers: {
        'Access-Token': accessToken,
      },
    };
  },
);
```

然后就可以在 Vue 组件中以 composable 的形式获取这些 endpoint

```html title="PostDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from 'resources/Post';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.useGet(), () => ({
    id: props.id,
  }));
</script>

<template>
  <div>{{ post.title }}</div>
</template>
```

:::

::::warning

使用这种方式意味着所有 endpoint 调用都只能发生在:react[函数渲染期间]:vue[`<script setup>` 的顶层]。

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './resources/Post';

function CreatePost() {
  const controller = useController();
  //highlight-next-line
  const createPost = PostResource.useCreate();

  return (
    <form
      onSubmit={e =>
        controller.fetch(createPost, new FormData(e.currentTarget))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from 'resources/Post';

  const controller = useController();
  //highlight-next-line
  const createPost = PostResource.useCreate();
  const onSubmit = (e: Event) =>
    controller.fetch(createPost, new FormData(e.target as HTMLFormElement));
</script>

<template>
  <form @submit="onSubmit">
    <!-- ... -->
  </form>
</template>
```

:::

::::

</TabItem>
<TabItem value="endpoint">

首先，我们提供一种利用上下文修改请求头的简单方式。

```ts title="api/AuthdEndpoint.ts"
import { RestEndpoint, type RestGenerics } from '@data-client/rest';

export default class AuthdEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  // highlight-next-line
  declare accessToken?: string;

  getHeaders(headers: HeadersInit): HeadersInit {
    return {
      ...headers,
      // highlight-next-line
      'Access-Token': this.accessToken,
    };
  }
}
```

接下来，我们使用 [extend](../api/RestEndpoint.md#extend) 生成一个注入了该上下文的新 endpoint。

:::react

```tsx
import { useMemo } from 'react';
import type { IRestEndpoint } from '@data-client/rest';
import { useAuthContext } from './AuthContext';

function useEndpoint(endpoint: IRestEndpoint) {
  const accessToken = useAuthContext();
  return useMemo(
    () => endpoint.extend({ accessToken }),
    [endpoint, accessToken],
  );
}
```

:::

:::vue

```ts
import { inject } from 'vue';

function useEndpoint(endpoint: RestEndpoint) {
  const accessToken = inject(AuthKey, '');
  return endpoint.extend({ accessToken });
}
```

:::

::::warning

使用这种方式意味着所有 endpoint 调用都只能发生在:react[函数渲染期间]:vue[`<script setup>` 的顶层]。

:::react

```tsx
import { useController } from '@data-client/react';
import { PostResource } from './api/Post';
import { useEndpoint } from './useEndpoint';

function CreatePost() {
  const controller = useController();
  //highlight-next-line
  const createPost = useEndpoint(PostResource.create);

  return (
    <form
      onSubmit={e =>
        controller.fetch(createPost, {}, new FormData(e.target))
      }
    >
      {/* ... */}
    </form>
  );
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { PostResource } from 'resources/Post';
  import { useEndpoint } from './useEndpoint';

  const controller = useController();
  //highlight-next-line
  const createPost = useEndpoint(PostResource.create);
  const onSubmit = (e: Event) =>
    controller.fetch(createPost, {}, new FormData(e.target as HTMLFormElement));
</script>

<template>
  <form @submit="onSubmit">
    <!-- ... -->
  </form>
</template>
```

:::

::::

</TabItem>
</Tabs>

## 代码组织 {#code-organization}

如果你的大部分 `Resources` 都使用类似的认证机制，
可以尝试从一个定义了这些通用定制的基类进行扩展。

## 401 登出处理 {#401-logout-handling}

当用户的授权过期时，服务器通常会在响应中
予以表明，标准做法是返回 401。[LogoutManager](/docs/api/LogoutManager)
可以轻松触发所有取消授权的清理工作。
