---
title: useSuspense() - Busca de dados simplificada para React
vue_title: useSuspense() - Busca de dados simplificada para Vue
sidebar_label: useSuspense()
description: Renderização de dados assíncronos de alto desempenho, sem overfetching. useSuspense() é como o await para componentes React.
vue_description: Renderização de dados assíncronos de alto desempenho, sem overfetching. useSuspense() é como o await para componentes Vue.
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

`useSuspense()` é como o [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) para componentes React. Isso significa que o restante do componente só é executado depois que os dados foram carregados, evitando a complexidade de tratar condições de carregamento e de erro. Em vez disso, o tratamento de fallback é
[centralizado](../getting-started/data-dependency.md#boundaries) em um único [AsyncBoundary](../api/AsyncBoundary.md).

:::

:::vue

Use [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) em `useSuspense()` nos componentes Vue. Isso significa que o restante do componente só é executado depois que os dados foram carregados, evitando a complexidade de tratar condições de carregamento e de erro. Em vez disso, o tratamento de fallback é
[centralizado](../getting-started/data-dependency.md#boundaries) com o [Suspense](https://vuejs.org/guide/built-ins/suspense.html) nativo do Vue.

:::

`useSuspense()` reage às [mutações](../getting-started/mutations.md) de dados, renderizando novamente somente quando necessário.

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

## Comportamento {#behavior}

A política de cache é [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) por padrão, mas também [configurável](../concepts/expiry-policy.md).

| Status de expiração | Fetch           | Suspend | Error             | Condições                                                                                                                                                                   |
| ------------- | --------------- | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inválido      | sim<sup>1</sup> | sim     | não               | não está na store, [exclusão](/rest/api/resource#delete), [invalidação](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Desatualizado | sim<sup>1</sup> | não     | não               | (primeira renderização, mudança de args) & [expiração &lt; agora](../concepts/expiry-policy.md)                                                                                                 |
| Válido        | não             | não     | talvez<sup>2</sup> | conclusão do fetch                                                                                                                                                             |
|               | não             | não     | não               | `null` usado como segundo argumento                                                                                                                                               |

:::note

1. Fetches idênticos são automaticamente deduplicados
2. [Erros hard](../concepts/error-policy.md#hard) devem ser [capturados](../getting-started/data-dependency#async-fallbacks) por :react[[Error Boundaries](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]

:::

::::react

:::info[React Native]

Ao usar o React Navigation, useSuspense() dispara fetches ao receber foco se os dados forem considerados
desatualizados.

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

O resultado é atualizado quando os argumentos mudam.
Enquanto os dados dos novos argumentos carregam, o resultado mantém os dados anteriores em vez de se tornar `undefined`.
Se esse fetch falhar, a leitura do resultado lança o erro (conforme sua [política de erros](../concepts/error-policy.md)), de modo que ele chega ao
[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured).

:::

## Exemplos {#examples}

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

### Paginação {#pagination}

A [paginação](/rest/guides/pagination) reativa é obtida com [schemas mutáveis](/rest/api/Collection)

<PaginationDemo defaultTab="PostList" />

### Sequencial {#sequential}

Quando os parâmetros do fetch dependem de dados de outro resource.

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

`null` evita vincular e buscar os dados

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

### Dados incorporados {#embedded-data}

Quando as entidades são armazenadas em [estruturas aninhadas](/rest/guides/relational-data#nesting), essa estrutura é mantida.

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

### Renderização no servidor {#server-side-rendering}

A [renderização no servidor](../guides/ssr.md) (Server Side Rendering) transmite o HTML de forma incremental,
reduzindo bastante o [TTFB](https://web.dev/ttfb/). A hidratação automática da store do [SSR do Reactive Data Client](../guides/ssr.md)
significa interatividade imediata para o usuário, com **zero** fetches no cliente no primeiro carregamento.

<StackBlitz app="nextjs" file="resources/TodoResource.ts,components/todo/TodoList.tsx" />

O uso nos componentes é idêntico, o que significa que você pode compartilhar componentes com facilidade entre aplicações com e sem SSR,
além de migrar para <abbr title="Server Side Render">SSR</abbr> sem precisar alterar o código do data-client.

### Modo concorrente {#concurrent-mode}

No React 18, navegar com [startTransition](https://react.dev/reference/react/useTransition#starttransition) permite que os [AsyncBoundaries](./AsyncBoundary.md)
continuem exibindo a tela anterior enquanto os novos dados carregam. Combinado com a
[renderização no servidor com streaming](../guides/ssr.md), isso elimina a necessidade de exibir indicadores de
carregamento irritantes, melhorando a experiência do usuário.

Clique em um dos nomes para navegar até as tarefas dessa pessoa. Aqui, estados de carregamento longos são indicados pela
_barra de carregamento_, menos intrusiva, como a usada pelo [YouTube](https://youtube.com) e pelo [Robinhood](https://robinhood.com).

<StackBlitz app="todo-app" file="src/pages/Home/TodoList.tsx,src/pages/Home/index.tsx,src/useNavigationState.ts" height={600} />

Se precisar de ajuda para adicionar isso ao seu próprio roteador personalizado, consulte o [guia oficial do React](https://react.dev/reference/react/useTransition#building-a-suspense-enabled-router)

:::
