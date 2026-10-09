---
title: Renderizando dados assíncronos no React
vue_title: Renderizando dados assíncronos no Vue
sidebar_label: Renderizar dados
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

# Renderizando dados assíncronos

Torne seus componentes reutilizáveis associando os dados onde você os **usa**, com o [useSuspense()](../api/useSuspense.md) de uma linha,
que garante os dados :react[como]:vue[com] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

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
alt="Endpoints usados em muitos contextos"
sources={{
    light: useBaseUrl('/img/passing_data_context_far.webp'),
    dark: useBaseUrl('/img/passing_data_context_far.webp'),
  }}
style={{float: "right",marginLeft:"10px"}}
width="415" height="184"
/>
</a>

Não faça [prop drilling](https://react.dev/learn/passing-data-deeply-with-context#the-problem-with-passing-props). Em vez disso, use [useSuspense()](../api/useSuspense.md) nos componentes que renderizam os dados. Isso é
conhecido como _data co-location_ (colocalização de dados).

Não esconda hooks de associação de dados dentro de hooks personalizados. Em vez disso, coloque transformações de dados fortemente acopladas
em [Query](/rest/api/Query): a lógica de dados pertence ao modelo de dados, onde permanece visível, reutilizável
e livre para mudar independentemente da view.

Em vez de escrever funções de atualização complexas ou cascatas de invalidações, o Reactive Data Client atualiza automaticamente
os componentes associados imediatamente após uma [alteração nos dados](./mutations.md). Isso é conhecido como _programação reativa_.

## Carregamento e erro {#async-fallbacks}

Você pode ter notado que o tipo de retorno mostra que o valor sempre está presente. [useSuspense()](../api/useSuspense.md) funciona de forma muito parecida
:react[com]:vue[com] [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await). Isso nos permite
separar o tratamento de erro/carregamento do uso dos dados.

### Limites assíncronos (Async Boundaries) {#boundaries}

Em vez disso, colocamos :react[[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md)]:vue[o [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html) nativo do Vue junto com [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)] para tratar as condições de carregamento e de erro em limites de navegação, ou acima deles, como **páginas,
rotas ou [modais](https://www.appcues.com/blog/modal-dialog-windows)**.

<AsyncBoundaryExamples />

:::react

O [useTransition](https://react.dev/reference/react/useTransition) do React 18 e roteadores ou navegação baseados em [Server Side Rendering](../guides/ssr.md)
significam nunca mais ver um fallback de carregamento. No React 16 e 17, os fallbacks podem ser centralizados
para eliminar indicadores de carregamento redundantes, mantendo os componentes reutilizáveis.

[&lt;AsyncBoundary /\>](../api/AsyncBoundary.md) também permite que o [Server Side Rendering](../guides/ssr.md) transmita o HTML de forma incremental (streaming),
reduzindo bastante o [TTFB](https://web.dev/ttfb/). A hidratação automática do store do [SSR do Reactive Data Client](../guides/ssr.md)
significa interatividade imediata para o usuário com **zero** fetches no cliente no primeiro carregamento.

O [fallback de erro](../api/AsyncBoundary.md#errorcomponent) e o [fallback de carregamento](../api/AsyncBoundary.md#fallback) do AsyncBoundary podem ser ambos
personalizados.

:::

:::vue

Centralizar os fallbacks dessa forma elimina indicadores de carregamento redundantes, mantendo os componentes reutilizáveis.
O fallback de carregamento é personalizado com o slot `#fallback` do [&lt;Suspense /\>](https://vuejs.org/guide/built-ins/suspense.html#loading-state),
e o fallback de erro renderizando o que você escolher a partir de [onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

### Com estado (Stateful) {#stateful}

Você pode encontrar casos em que ainda é útil usar uma abordagem com estado para :react[os fallbacks ao usar React 16 e 17.]:vue[os fallbacks.]
Para esses casos, ou para compatibilidade com algumas bibliotecas de componentes, há o [useDLE()](../api/useDLE.md) - [D]ata [L]oading [E]rror (dados, carregamento e erro).

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

Como [useDLE](../api/useDLE.md) não usa [useSuspense](../api/useSuspense.md), você não conseguirá orquestrar facilmente de forma centralizada
o código de carregamento e de erro:vue[.]:react[. Além disso, recursos do React 18, como [useTransition](https://react.dev/reference/react/useTransition)
e [SSR com streaming incremental](../guides/ssr.md), não funcionarão com componentes que o utilizam.]

## Condicional {#conditional}

<ConditionalDependencies />

## Subscriptions {#subscriptions}

Quando é provável que os dados mudem por fatores externos, [useSubscription()](../api/useSubscription.md)
garante atualizações contínuas enquanto um componente está montado. [useLive()](../api/useLive.md) chama tanto
[useSubscription()](../api/useSubscription.md) quanto [useSuspense()](../api/useSuspense.md), facilitando bastante
o uso de dados atualizados.

<UseLive />

As subscriptions são orquestradas por [Managers](../api/Manager.md). Por padrão,
subscriptions baseadas em polling podem ser usadas adicionando [pollFrequency](/rest/api/Endpoint#pollfrequency) a um Endpoint ou Resource.
Para protocolos de rede baseados em push, como SSE e websockets, veja o [exemplo de manager de stream](../concepts/managers.md#data-stream).

```typescript
export const getTicker = new RestEndpoint({
  urlPrefix: 'https://api.exchange.coinbase.com',
  path: '/products/:productId/ticker',
  schema: Ticker,
  // highlight-next-line
  pollFrequency: 2000,
});
```
