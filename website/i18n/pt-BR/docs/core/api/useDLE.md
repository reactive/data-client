---
title: useDLE() - Estado React de [D]ata [L]oading [E]rror
vue_title: useDLE() - Estado Vue de [D]ata [L]oading [E]rror
sidebar_label: useDLE()
description: Renderização de dados assíncronos de alto desempenho, sem overfetching. Com metadados do fetch.
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

# useDLE() - [D]ata, [L]oading e [E]rror (dados, carregamento e erro)

Renderização de dados assíncronos de alto desempenho, sem overfetching. Com metadados do fetch.

Caso você não possa usar [suspense](../getting-started/data-dependency.md#async-fallbacks), useDLE() é igual ao [useSuspense()](./useSuspense.md), mas retorna os valores [D]ata [L]oading [E]rror.

`useDLE()` reage às [mutações](../getting-started/mutations.md) de dados, renderizando novamente somente quando necessário.

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

## Comportamento {#behavior}

:::vue

`data`, `loading` e `error` são, cada um, um [ComputedRef](https://vuejs.org/api/reactivity-core.html#computed).
Desestruture-os no nível superior do `<script setup>` para que sejam desembrulhados no template. A tabela
abaixo descreve o `.value` deles.

:::

| Status de expiração | Fetch           | Data         | Loading | Error             | Condições                                                                                                                                                             |
| ------------- | --------------- | ------------ | ------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inválido      | sim<sup>1</sup> | `undefined`  | true    | false             | não está na store, [exclusão](/rest/api/resource#delete), [invalidação](./Controller.md#invalidate), [invalidIfStale](../concepts/expiry-policy.md#endpointinvalidifstale) |
| Desatualizado | sim<sup>1</sup> | desnormalizado | false   | false             | (primeira renderização, mudança de args) & [expiração &lt; agora](../concepts/expiry-policy.md)                                                                                           |
| Válido        | não             | desnormalizado | false   | talvez<sup>2</sup> | conclusão do fetch                                                                                                                                                       |
|               | não             | `undefined`  | false   | false             | `null` usado como segundo argumento                                                                                                                                         |

:::note

1. Fetches idênticos são automaticamente deduplicados
2. [Erros hard](../concepts/error-policy.md#hard) devem ser [capturados](../getting-started/data-dependency#async-fallbacks) por :react[[Error Boundaries](./AsyncBoundary.md)]:vue[[onErrorCaptured()](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured)]

:::

::::react

:::info[React Native]

Ao usar o React Navigation, useDLE() dispara fetches ao receber foco se os dados forem considerados
desatualizados.

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

Os resultados são atualizados quando os argumentos mudam.

:::

## Exemplos {#examples}

### Detalhe {#detail}

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

### Dados incorporados {#embedded-data}

Quando as entidades são armazenadas em [estruturas aninhadas](/rest/guides/relational-data#nesting), essa estrutura é mantida.

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

### Reações do Github {#github-reactions}

`useDLE()` nos permite buscar de forma declarativa as reações em qualquer página de issue no momento em que navegamos até ela. Isso nos permite
não bloquear a exibição da página de issues caso as reações ainda não tenham terminado de carregar.

Normalmente é melhor envolver casos como este em novos [Suspense Boundaries](../getting-started/data-dependency.md#boundaries).
No entanto, nossa biblioteca de componentes `ant design` não permite isso.

<StackBlitz app="github-app" file="src/resources/Reaction.tsx,src/pages/IssueDetail/index.tsx" view="editor" initialpath="/reactive/data-client/issue/1113" height={750} />

:::
