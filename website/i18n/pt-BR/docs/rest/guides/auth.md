---
title: Autenticação no Rest
sidebar_label: Autenticação
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

Todas as requisições de rede passam pelo [getRequestInit](../api/RestEndpoint.md#getRequestInit) que pode ser
definido no seu [RestEndpoint](../api/RestEndpoint.md).

## Autenticação por cookie (credentials) {#cookie-auth-credentials}

Aqui está um exemplo de autenticação simples por [cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies), enviando [credenciais no fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included):

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

Veja [Integração com Django](./django.md) para um exemplo que também inclui [proteção CSRF](https://docs.djangoproject.com/en/5.0/howto/csrf/#using-csrf-protection-with-ajax).

## Access tokens ou JWT {#access-tokens-or-jwt}

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

## Headers de autenticação a partir de :react[React Context]:vue[provide/inject] {#auth-headers-from-react-context}

:::warning

Não é recomendado usar :react[React Context]:vue[provide/inject] para estado que não é exibido (como tokens de autenticação).
Isso resulta em re-renderizações desnecessárias e em mais complexidade na aplicação.

:::

<Tabs
defaultValue="resource"
values={[
{ label: 'Resource', value: 'resource' },
{ label: 'RestEndpoint', value: 'endpoint' },
]}>
<TabItem value="resource">

Podemos transformar qualquer [Resource](../api/resource.md) em um que usa :react[hooks]:vue[composables] para criar endpoints
usando [hookifyResource](../api/hookifyResource.md)

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

Então podemos obter os endpoints como hooks em nossos componentes React

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

Então podemos obter os endpoints como composables em nossos componentes Vue

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

Usar isso significa que todas as chamadas de endpoint só podem ocorrer :react[durante a renderização de uma função]:vue[no nível superior de `<script setup>`].

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

Primeiro, vamos oferecer uma forma simples de usar o contexto para alterar os headers do fetch.

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

Em seguida, vamos usar [extend](../api/RestEndpoint.md#extend) para gerar um novo endpoint com esse contexto injetado.

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

Usar isso significa que todas as chamadas de endpoint só podem ocorrer :react[durante a renderização de uma função]:vue[no nível superior de `<script setup>`].

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

## Organização do código {#code-organization}

Se boa parte dos seus `Resources` compartilha um mecanismo de autenticação semelhante, você pode
tentar estender uma classe base que defina essas personalizações comuns.

## Tratamento de logout em 401 {#401-logout-handling}

Caso a autorização de um usuário expire, o servidor normalmente responde indicando
isso. A forma padrão de fazer isso é com um 401. O [LogoutManager](/docs/api/LogoutManager)
pode ser usado para disparar facilmente qualquer limpeza de desautorização.
