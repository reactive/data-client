---
title: useDLE() - Estado de React con [D]ata [L]oading [E]rror
vue_title: useDLE() - Estado de Vue con [D]ata [L]oading [E]rror
sidebar_label: useDLE()
description: Renderizado de datos asíncronos de alto rendimiento sin sobrecargar las solicitudes. Con metadatos del fetch.
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

# useDLE() - Estado con [D]ata [L]oading [E]rror

Renderizado de datos asíncronos de alto rendimiento sin sobrecargar las solicitudes. Con metadatos del fetch.

Si no puedes usar [suspense](../getting-started/data-dependency.md#async-fallbacks), useDLE() es igual que [useSuspense()](./useSuspense.md), pero devuelve los valores [D]ata [L]oading [E]rror.

`useDLE()` reacciona a las [mutaciones](../getting-started/mutations.md) de datos; vuelve a renderizar solo cuando es necesario.

## Uso {#usage}

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

## Comportamiento {#behavior}

:::vue

`data`, `loading` y `error` son cada uno un [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed).
Desestructúralos en el nivel superior de `<script setup>` para que se desenvuelvan en la plantilla. La tabla
de abajo describe su `.value`.

:::

| Caducidad     | Fetch           | Data         | Loading | Error             | Condiciones                                                                                                                                                             |
| ------------- | --------------- | ------------ | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inválido      | sí<sup>1</sup>  | `undefined`  | true    | false             | no está en el store, [eliminación](/rest/api/resource#delete), [invalidación](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Obsoleto      | sí<sup>1</sup>  | desnormalizado | false   | false             | (primer render, cambio de args) & [caducidad &lt; ahora](../concepts/expiry-policy.md)                                                                                           |
| Válido        | no              | desnormalizado | false   | quizás<sup>2</sup> | fetch completado                                                                                                                                                       |
|               | no              | `undefined`  | false   | false             | `null` usado como segundo argumento                                                                                                                                         |

:::note

1. Los fetches idénticos se deduplican automáticamente
2. [Errores graves](../concepts/error-policy.md#hard) que deben ser [capturados](../getting-started/data-dependency#async-fallbacks) por :react[[Error Boundaries](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]

:::

::::react

:::info[React Native]

Al usar React Navigation, useDLE() activará fetches al enfocar la pantalla si los datos se consideran
obsoletos.

:::

::::

<ConditionalDependencies hook="useDLE" />

## Tipos {#types}

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

Los resultados se actualizan cuando cambian los argumentos.

:::

## Ejemplos {#examples}

### Detalle {#detail}

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

### Condicional {#conditional}

`null` evitará enlazar y obtener datos

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

### Datos incrustados {#embedded-data}

Cuando las entities se almacenan en [estructuras anidadas](/rest/guides/relational-data#nesting), esa estructura se conservará.

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

### Reacciones de Github {#github-reactions}

`useDLE()` nos permite obtener de forma declarativa las reacciones de cualquier página de issue en el momento en que navegamos a ella. Esto nos permite
no bloquear la visualización de la página del issue si las reacciones aún no terminaron de cargarse.

Normalmente es mejor envolver casos como este en nuevos [Suspense Boundaries](../getting-started/data-dependency.md#boundaries).
Sin embargo, nuestra biblioteca de componentes `ant design` no lo permite.

<StackBlitz app="github-app" file="src/resources/Reaction.tsx,src/pages/IssueDetail/index.tsx" view="editor" initialpath="/reactive/data-client/issue/1113" height={750} />

:::
