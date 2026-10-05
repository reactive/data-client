---
title: Rest Authentication
sidebar_label: Authentication
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

All network requests are run through the [getRequestInit](../api/RestEndpoint.md#getRequestInit) optionally
defined in your [RestEndpoint](../api/RestEndpoint.md).

## Cookie Auth (credentials)

Here's an example using simple [cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) auth by sending [fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included):

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'Cookie': 'session=abc;'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="AuthdEndpoint" {9}
import { RestEndpoint } from '@data-client/rest';

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

See [Django Integration](./django.md) for an example that also includes [CSRF protection](https://docs.djangoproject.com/en/5.0/howto/csrf/#using-csrf-protection-with-ajax).

## Access Tokens or JWT

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
import { RestEndpoint } from '@data-client/rest';
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

```tsx title="Auth" collapsed
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
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
import { RestEndpoint } from '@data-client/rest';
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

```tsx title="Auth" collapsed
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
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
import { RestEndpoint } from '@data-client/rest';
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

```tsx title="Auth" collapsed
import { handleLogin } from './AuthdEndpoint';

export default function Auth() {
  return <AuthForm onSubmit={handleLogin} />;
}
```

:::

:::vue

```html title="Auth.vue" collapsed
<script setup lang="ts">
  import { handleLogin } from './AuthdEndpoint';
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

## Auth Headers from :react[React Context]:vue[provide/inject] {#auth-headers-from-react-context}

:::warning

Using :react[React Context]:vue[provide/inject] for state that is not displayed (like auth tokens) is not recommended.
This will result in unnecessary re-renders and application complexity.

:::

<Tabs
defaultValue="resource"
values={[
{ label: 'Resource', value: 'resource' },
{ label: 'RestEndpoint', value: 'endpoint' },
]}>
<TabItem value="resource">

We can transform any [Resource](../api/resource.md) into one that uses :react[hooks]:vue[composables] to create endpoints
by using [hookifyResource](../api/hookifyResource.md)

:::react

```ts title="resources/Post.ts"
import { resource, hookifyResource } from '@data-client/rest';

// Post defined here

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

Then we can get the endpoints as hooks in our React Components

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

Then we can get the endpoints as composables in our Vue Components

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

Using this means all endpoint calls must only occur :react[during a function render]:vue[at the top level of `<script setup>`].

:::react

```tsx
function CreatePost() {
  const controller = useController();
  //highlight-next-line
  const createPost = PostResource.useCreate();

  return (
    <form
      onSubmit={e => controller.fetch(createPost, new FormData(e.target))}
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
  const controller = useController();
  //highlight-next-line
  const createPost = PostResource.useCreate();
</script>

<template>
  <form
    @submit="e => controller.fetch(createPost, new FormData(e.target))"
  >
    <!-- ... -->
  </form>
</template>
```

:::

::::

</TabItem>
<TabItem value="endpoint">

We will first provide an easy way of using the context to alter the fetch headers.

```ts title="api/AuthdEndpoint.ts"
import { RestEndpoint } from '@data-client/rest';

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

Next we will [extend](../api/RestEndpoint.md#extend) to generate a new endpoint with this context injected.

:::react

```tsx
function useEndpoint(endpoint: RestEndpoint) {
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

Using this means all endpoint calls must only occur :react[during a function render]:vue[at the top level of `<script setup>`].

:::react

```tsx
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
  const controller = useController();
  //highlight-next-line
  const createPost = useEndpoint(PostResource.create);
</script>

<template>
  <form
    @submit="e => controller.fetch(createPost, {}, new FormData(e.target))"
  >
    <!-- ... -->
  </form>
</template>
```

:::

::::

</TabItem>
</Tabs>

## Code organization

If much of your `Resources` share a similar auth mechanism, you might
try extending from a base class that defines such common customizations.

## 401 Logout Handling

In case a users authorization expires, the server will typically responsd to indicate
as such. The standard way of doing this is with a 401. [LogoutManager](/docs/api/LogoutManager)
can be used to easily trigger any de-authorization cleanup.
