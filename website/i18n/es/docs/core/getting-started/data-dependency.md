---
title: Renderizar datos asíncronos en React
vue_title: Renderizar datos asíncronos en Vue
sidebar_label: Renderizar datos
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

# Renderizar datos asíncronos

Haz que tus componentes sean reutilizables vinculando los datos donde los **usas**, con [useSuspense()](../api/useSuspense.md) en una sola línea,
que garantiza los datos :react[como]:vue[con] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

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
alt="Endpoints usados en muchos contextos"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

No hagas [prop drilling](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). En su lugar, usa [useSuspense()](../api/useSuspense.md) en los componentes que renderizan esos datos. Esto
se conoce como _colocalización de datos_.

No escondas los hooks que vinculan datos dentro de hooks personalizados. En su lugar, pon las transformaciones de datos muy acopladas
en [Query](/rest/api/Query): la lógica de datos pertenece al modelo de datos, donde sigue visible, reutilizable
y libre para cambiar con independencia de la vista.

En lugar de escribir funciones de actualización complejas o cascadas de invalidación, Reactive Data Client actualiza automáticamente
los componentes vinculados en cuanto [cambian los datos](./mutations.md). Esto se conoce como _programación reactiva_.

## Carga y error {#async-fallbacks}

Quizá hayas notado que el tipo de retorno muestra que el valor siempre está presente. [useSuspense()](../api/useSuspense.md) funciona de forma muy parecida
:react[a]:vue[a] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). Esto nos permite
separar el error y la carga del uso de los datos.

### Límites asíncronos {#boundaries}

En su lugar colocamos :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[el [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) integrado de Vue junto con [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] para manejar las condiciones de carga y error en los límites de navegación, o por encima, como **páginas,
rutas o [modales](https://www.appcues.com/blog/modal-dialog-windows)**.

<AsyncBoundaryExamples />

:::react

Los routers o la navegación impulsados por [useTransition](https://react.dev/reference/react/useTransition) de React 18 y el [renderizado en el servidor](../guides/ssr.md)
hacen que no vuelvas a ver un respaldo de carga. En React 16 y 17 los respaldos se pueden centralizar
para eliminar indicadores de carga redundantes y mantener los componentes reutilizables.

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) también permite que el [renderizado en el servidor](../guides/ssr.md) transmita HTML de forma incremental,
lo que reduce mucho el [TTFB](https://web.dev/ttfb/). La hidratación automática del store del [SSR de Reactive Data Client](../guides/ssr.md)
significa interactividad inmediata para el usuario, con **cero** obtenciones en el cliente en la primera carga.

El [respaldo de error](../api/AsyncBoundary.md#errorcomponent) y el [respaldo de carga](../api/AsyncBoundary.md#fallback) de AsyncBoundary se pueden
personalizar ambos.

:::

:::vue

Centralizar los respaldos de esta forma elimina indicadores de carga redundantes y mantiene los componentes reutilizables.
El respaldo de carga se personaliza con el slot `#fallback` de [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html#loading-state),
y el respaldo de error renderizando lo que elijas desde [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

### Con estado {#stateful}

Puede que encuentres casos en los que todavía sea útil un enfoque con estado para los :react[respaldos al usar React 16 y 17.]:vue[respaldos.]
Para esos casos, o para la compatibilidad con algunas bibliotecas de componentes, está [useDLE()](../api/useDLE.md): [D]ata [L]oading [E]rror.

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

Como [useDLE](../api/useDLE.md) no usa [useSuspense](../api/useSuspense.md), no podrás orquestar con facilidad y de forma central
el código de carga y error:vue[.]:react[. Además, las funciones de React 18 como [useTransition](https://react.dev/reference/react/useTransition)
y el [SSR que transmite de forma incremental](../guides/ssr.md) no funcionan con los componentes que lo usan.]

## Condicional {#conditional}

<ConditionalDependencies />

## Suscripciones {#subscriptions}

Cuando es probable que los datos cambien por un factor externo, [useSubscription()](../api/useSubscription.md)
garantiza actualizaciones continuas mientras un componente está montado. [useLive()](../api/useLive.md) llama tanto a
[useSubscription()](../api/useSubscription.md) como a [useSuspense()](../api/useSuspense.md), así que es bastante
fácil usar datos frescos.

<UseLive />

Las suscripciones las orquestan los [Managers](../api/Manager.md). De entrada,
las suscripciones basadas en sondeo (polling) se pueden usar añadiendo [pollFrequency](/rest/api/Endpoint#pollfrequency) a un Endpoint o a un Resource.
Para protocolos de red basados en push, como SSE y websockets, consulta el [manager de stream de ejemplo](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
