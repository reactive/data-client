---
title: useSuspense() - Obtención de datos simplificada para React
vue_title: useSuspense() - Obtención de datos simplificada para Vue
sidebar_label: useSuspense()
description: Renderizado asíncrono de datos de alto rendimiento sin sobre-obtención. useSuspense() es como await para componentes de React.
vue_description: Renderizado asíncrono de datos de alto rendimiento sin sobre-obtención. useSuspense() es como await para componentes de Vue.
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

`useSuspense()` es como [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) para componentes de React. Esto significa que el resto del componente solo se ejecuta después de que los datos se hayan cargado, lo que evita la complejidad de gestionar las condiciones de carga y de error. En su lugar, el manejo de los fallbacks se
[centraliza](../getting-started/data-dependency.md#boundaries) en un único [AsyncBoundary](../api/AsyncBoundary.md).

:::

:::vue

Usa [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) con `useSuspense()` en los componentes de Vue. Esto significa que el resto del componente solo se ejecuta después de que los datos se hayan cargado, lo que evita la complejidad de gestionar las condiciones de carga y de error. En su lugar, el manejo de los fallbacks se
[centraliza](../getting-started/data-dependency.md#boundaries) con el [Suspense](https://vuejs.org/guide/built-ins/suspense.html) integrado de Vue.

:::

`useSuspense()` reacciona a las [mutaciones](../getting-started/mutations.md) de los datos y vuelve a renderizar solo cuando es necesario.

## Uso {#usage}

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

## Comportamiento {#behavior}

La política de caché es [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) de forma predeterminada, pero también es [configurable](../concepts/expiry-policy.md).

| Estado de caducidad | Fetch           | Suspende | Error             | Condiciones                                                                                                                                                                   |
| ------------- | --------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inválido      | sí<sup>1</sup>  | sí      | no                | no está en el store, [eliminación](/rest/api/resource#delete), [invalidación](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Obsoleto      | sí<sup>1</sup>  | no      | no                | (primer render, cambio de argumentos) & [caducidad &lt; ahora](../concepts/expiry-policy.md)                                                                                                 |
| Válido        | no              | no      | quizá<sup>2</sup> | finalización del fetch                                                                                                                                                             |
|               | no              | no      | no                | `null` usado como segundo argumento                                                                                                                                               |

:::note

1. Los fetches idénticos se deduplican automáticamente
2. Los [errores duros](../concepts/error-policy.md#hard) deben ser [capturados](../getting-started/data-dependency#async-fallbacks) por :react[[Error Boundaries](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]

:::

::::react

:::info[React Native]

Al usar React Navigation, useSuspense() lanzará fetches al recibir el foco si los datos se consideran
obsoletos.

:::

::::

<ConditionalDependencies />

## Tipos {#types}

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

El resultado se actualiza cuando cambian los argumentos.
Mientras se cargan los datos de los nuevos argumentos, el resultado conserva los datos anteriores en lugar de volverse `undefined`.
Si ese fetch falla, al leer el resultado se lanza el error (según su [política de errores](../concepts/error-policy.md)), de modo que llega a
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Ejemplos {#examples}

### Lista {#list}

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

### Paginación {#pagination}

La [paginación](/rest/guides/pagination) reactiva se logra con [schemas mutables](/rest/api/Collection)

<PaginationDemo defaultTab="PostList" />

### Secuencial {#sequential}

Cuando los parámetros del fetch dependen de datos de otro recurso.

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

### Condicional {#conditional}

`null` evitará enlazar y obtener los datos

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

### Datos incrustados {#embedded-data}

Cuando las entidades se almacenan en [estructuras anidadas](/rest/guides/relational-data#nesting), esa estructura se conserva.

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

### Renderizado del lado del servidor {#server-side-rendering}

El [renderizado del lado del servidor](../guides/ssr.md) permite enviar el HTML en streaming de forma incremental,
lo que reduce enormemente el [TTFB](https://web.dev/ttfb/). La hidratación automática del store del [SSR de Reactive Data Client](../guides/ssr.md)
significa interactividad inmediata para el usuario con **cero** fetches del lado del cliente en la primera carga.

<StackBlitz app="nextjs" file="resources/TodoResource.ts,components/todo/TodoList.tsx" />

El uso en los componentes es idéntico, lo que significa que puedes compartir fácilmente componentes entre aplicaciones con y sin SSR,
así como migrar a <abbr title="Server Side Render">SSR</abbr> sin necesidad de cambiar el código de data-client.

### Modo concurrente {#concurrent-mode}

En React 18, navegar con [startTransition](https://react.dev/reference/react/useTransition#starttransition) permite que los [AsyncBoundaries](./AsyncBoundary.md)
sigan mostrando la pantalla anterior mientras se cargan los nuevos datos. Combinado con el
[renderizado del lado del servidor con streaming](../guides/ssr.md), elimina la necesidad de mostrar indicadores de
carga molestos y mejora la experiencia de usuario.

Haz clic en uno de los nombres para navegar a sus tareas. Aquí los estados de carga largos se indican con una
_barra de carga_ menos intrusiva, como la que usan [YouTube](https://youtube.com) y [Robinhood](https://robinhood.com).

<StackBlitz app="todo-app" file="src/pages/Home/TodoList.tsx,src/pages/Home/index.tsx,src/useNavigationState.ts" height={600} />

Si necesitas ayuda para añadir esto a tu propio router personalizado, consulta la [guía oficial de React](https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router)

:::
