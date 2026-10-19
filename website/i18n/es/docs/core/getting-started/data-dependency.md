---
title: Renderizar datos asíncronos en React
vue_title: Renderizar datos asíncronos en Vue
sidebar_label: Renderizar datos
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import DataColocation from '@site/src/components/DataColocation';
import { boundaryFixtures } from '@site/src/fixtures/post-comments';
import LanguageTabs from '@site/src/components/LanguageTabs';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import { postFixtures } from '@site/src/fixtures/posts';
import { detailFixtures, listFixtures } from '@site/src/fixtures/profiles';
import UseLive from '../shared/\_useLive.mdx';
import AsyncBoundaryExamples from '../shared/\_AsyncBoundary.mdx';

export const boundaryDemo = [
  { delay: 1000, click: 'a[href="/posts/1"]' },
  // past the comments' 2s delay, so the page shows in full
  { wait: 3000 },
];

# Renderizar datos asíncronos

Haz que tus componentes sean reutilizables vinculando los datos donde los **usas** con el [useSuspense()](../api/useSuspense.md) de una sola línea,
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

```tsx title="PostDetail" route="/posts/:id" {5} collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ id }) {
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
    </div>
  );
}
```

```tsx title="PostItem" collapsed
import { type Post } from './Resources';

export default function PostItem({ post }: { post: Post }) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}
```

```tsx title="PostList" route="/" {7}
import { useSuspense } from '@data-client/react';
import LoadMore from './LoadMore';
import PostItem from './PostItem';
import { PostResource } from './Resources';

export default function PostList() {
  const posts = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <LoadMore />
    </div>
  );
}
```

```tsx title="LoadMore" collapsed
import { useController, useLoading, useQuery } from '@data-client/react';
import { PostResource } from './Resources';

export default function LoadMore() {
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
```

:::

:::vue

```html title="PostDetail.vue" route="/posts/:id" {6} collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
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
  </div>
</template>
```

```html title="PostItem.vue" collapsed
<script setup lang="ts">
  import { type Post } from './Resources';

  defineProps<{ post: Post }>();
</script>

<template>
  <div class="listItem spaced">
    <Avatar :src="post.author.profileImage" />
    <div>
      <h4>
        <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
      </h4>
      <small>by {{ post.author.name }}</small>
    </div>
  </div>
</template>
```

```html title="PostList.vue" route="/" {7}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import LoadMore from './LoadMore.vue';
  import PostItem from './PostItem.vue';
  import { PostResource } from './Resources';

  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div>
    <PostItem v-for="post in posts" :key="post.pk()" :post="post" />
    <LoadMore />
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

:::

</FrameworkPlayground>

<DataColocation />

No hagas [prop drilling](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). En su lugar, usa [useSuspense()](../api/useSuspense.md) en los componentes que renderizan los datos. Esto se
conoce como _colocación de datos_ (_data co-location_). Pasa ids o args como props, no datos obtenidos que un componente solo reenvía
(una lista que pasa cada elemento a la fila que lo renderiza está bien). Los componentes que piden el mismo
endpoint con los mismos args comparten un único fetch y una única copia en el store.

No ocultes los hooks de vinculación de datos dentro de hooks personalizados. En su lugar, coloca las transformaciones de datos estrechamente acopladas
en un [Query](/rest/api/Query): la lógica de datos pertenece al modelo de datos, donde permanece visible, es reutilizable
y puede cambiar de forma independiente de la vista.

En lugar de escribir complejas funciones de actualización o cascadas de invalidaciones, Reactive Data Client actualiza automáticamente
los componentes vinculados de inmediato cuando [los datos cambian](./mutations.md). Esto se conoce como _programación reactiva_.

## Carga y error {#async-fallbacks}

Es posible que hayas notado que el tipo de retorno indica que el valor siempre está presente. [useSuspense()](../api/useSuspense.md) funciona de forma muy parecida
:react[a]:vue[con] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). Esto nos permite
separar el manejo de errores y de carga del uso de los datos.

### Async Boundaries {#boundaries}

En su lugar, colocamos :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[el [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) integrado de Vue junto con [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] para manejar las condiciones de carga y error en o por encima de los límites de navegación, como **páginas,
rutas o [modales](https://www.appcues.com/blog/modal-dialog-windows)**.

<FrameworkPlayground fixtures={boundaryFixtures} demo autoRun={boundaryDemo}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';
  author = '';
  avatar = '';
  static key = 'Post';
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});

export class Comment extends Entity {
  id = 0;
  postId = 0;
  author = '';
  avatar = '';
  text = '';
  static key = 'Comment';
}
export const CommentResource = resource({
  path: '/comments/:id',
  searchParams: {} as { postId: string },
  schema: Comment,
});
```

:::react

```tsx title="Layout" layout collapsed
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Field Notes</h1>
      </header>
      {children}
    </>
  );
}
```

```tsx title="PostList" route="/" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostList() {
  const posts = useSuspense(PostResource.getList);
  return (
    <div className="card">
      {posts.map(post => (
        <div key={post.pk()} className="listItem">
          <Avatar src={post.avatar} />
          <div>
            <h3>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h3>
            <small>{post.author}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="PostPage" route="/posts/:id" {7,10}
import { AsyncBoundary } from '@data-client/react';
import CommentList from './CommentList';
import PostDetail from './PostDetail';

export default function PostPage({ id }: { id: string }) {
  return (
    <AsyncBoundary fallback={<Loading />}>
      <PostDetail id={id} />
      <CommentList postId={id} />
    </AsyncBoundary>
  );
}
```

```tsx title="PostDetail" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ id }: { id: string }) {
  const post = useSuspense(PostResource.get, { id });
  return (
    <article>
      <h2>{post.title}</h2>
      <p className="byline">
        <Avatar src={post.avatar} size={24} />
        <b>{post.author}</b>
      </p>
      <p>{post.body}</p>
    </article>
  );
}
```

```tsx title="CommentList" collapsed
import { useSuspense } from '@data-client/react';
import { CommentResource } from './Resources';

export default function CommentList({ postId }: { postId: string }) {
  const comments = useSuspense(CommentResource.getList, { postId });
  return (
    <section>
      <h3>Comments</h3>
      <div className="card">
        {comments.map(comment => (
          <div key={comment.pk()} className="listItem">
            <Avatar src={comment.avatar} size={28} />
            <div>
              <b>{comment.author}</b>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

:::

:::vue

```html title="Layout.vue" layout collapsed
<template>
  <header class="appHeader">
    <h1 class="appTitle">Field Notes</h1>
  </header>
  <RouterView />
</template>
```

```html title="PostList.vue" route="/" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div class="card">
    <div v-for="post in posts" :key="post.pk()" class="listItem">
      <Avatar :src="post.avatar" />
      <div>
        <h3>
          <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
        </h3>
        <small>{{ post.author }}</small>
      </div>
    </div>
  </div>
</template>
```

```html title="PostPage.vue" route="/posts/:id" {9,15}
<script setup lang="ts">
  import CommentList from './CommentList.vue';
  import PostDetail from './PostDetail.vue';

  defineProps<{ id: string }>();
</script>

<template>
  <Suspense>
    <div>
      <PostDetail :id="id" />
      <CommentList :post-id="id" />
    </div>
    <template #fallback><Loading /></template>
  </Suspense>
</template>
```

```html title="PostDetail.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
</script>

<template>
  <article>
    <h2>{{ post.title }}</h2>
    <p class="byline">
      <Avatar :src="post.avatar" :size="24" />
      <b>{{ post.author }}</b>
    </p>
    <p>{{ post.body }}</p>
  </article>
</template>
```

```html title="CommentList.vue" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { CommentResource } from './Resources';

  const props = defineProps<{ postId: string }>();
  const comments = await useSuspense(CommentResource.getList, () => ({
    postId: props.postId,
  }));
</script>

<template>
  <section>
    <h3>Comments</h3>
    <div class="card">
      <div v-for="comment in comments" :key="comment.pk()" class="listItem">
        <Avatar :src="comment.avatar" :size="28" />
        <div>
          <b>{{ comment.author }}</b>
          <p>{{ comment.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
```

:::

</FrameworkPlayground>

:react[Muestra el código y mueve el `<AsyncBoundary>` para que envuelva solo `<CommentList />`: la publicación se muestra antes que sus comentarios.]

<AsyncBoundaryExamples />

:::react

El [useTransition](https://react.dev/reference/react/useTransition) de React 18 y los enrutadores o la navegación basados en [renderizado del lado del servidor](../guides/ssr.md)
hacen que nunca vuelvas a ver un fallback de carga. En React 16 y 17 los fallbacks pueden centralizarse
para eliminar indicadores de carga redundantes y mantener los componentes reutilizables.

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) también permite que el [renderizado del lado del servidor](../guides/ssr.md) transmita HTML de forma incremental,
lo que reduce considerablemente el [TTFB](https://web.dev/ttfb/). La hidratación automática del store de [Reactive Data Client SSR](../guides/ssr.md)
significa interactividad inmediata para el usuario con **cero** fetches del lado del cliente en la primera carga.

Tanto el [fallback de error](../api/AsyncBoundary.md#errorcomponent) como el [fallback de carga](../api/AsyncBoundary.md#fallback) de AsyncBoundary
se pueden personalizar.

:::

:::vue

Centralizar los fallbacks de esta manera elimina indicadores de carga redundantes y mantiene los componentes reutilizables.
El fallback de carga se personaliza con el slot `#fallback` de [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html#loading-state),
y el fallback de error, renderizando lo que elijas desde [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

### Con estado {#stateful}

Puede haber casos en los que siga siendo útil un enfoque con estado para :react[los fallbacks al usar React 16 y 17.]:vue[los fallbacks.]
Para estos casos, o para la compatibilidad con algunas bibliotecas de componentes, se proporciona [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror (datos, carga, error).

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

```tsx title="ProfileList" {6-8}
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

```html title="ProfileList.vue" {5,9-10}
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

Dado que [useDLE](../api/useDLE.md) no usa [useSuspense](../api/useSuspense.md), no podrás orquestar fácilmente de forma central
el código de carga y de error :vue[.]:react[. Además, las funcionalidades de React 18 como [useTransition](https://react.dev/reference/react/useTransition)
y el [SSR con transmisión incremental](../guides/ssr.md) no funcionarán con los componentes que lo usen.]

## Condicional {#conditional}

<ConditionalDependencies />

## Suscripciones {#subscriptions}

Cuando es probable que los datos cambien por factores externos, [useSubscription()](../api/useSubscription.md)
garantiza actualizaciones continuas mientras un componente está montado. [useLive()](../api/useLive.md) llama tanto a
[useSubscription()](../api/useSubscription.md) como a [useSuspense()](../api/useSuspense.md), lo que hace muy
fácil usar datos actualizados.

<UseLive />

Las suscripciones son orquestadas por los [Managers](../api/Manager.md). De fábrica,
se pueden usar suscripciones basadas en sondeo (polling) agregando [pollFrequency](/rest/api/Endpoint#pollfrequency) a un Endpoint o Resource.
Para protocolos de red basados en push, como SSE y websockets, consulta el [ejemplo de stream manager](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
