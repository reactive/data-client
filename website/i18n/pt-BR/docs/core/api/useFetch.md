---
title: useFetch() - Gatilhos declarativos de fetch para React
vue_title: useFetch() - Gatilhos declarativos de fetch para Vue
sidebar_label: useFetch()
description: Busque e leia dados de um endpoint com React.use(). Suspende durante o fetch, retorna dados desnormalizados e suspende novamente na invalidação.
vue_description: Busca um Endpoint se ele não estiver em cache ou estiver desatualizado. Retorna um Ref para a promise do fetch, buscando novamente na invalidação.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { parallelFetchFixtures } from '@site/src/fixtures/post-comments';
import VueArgs from '../shared/\_vueArgs.mdx';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# useFetch()

:::react

Busca um Endpoint se ele não estiver em cache ou estiver desatualizado. Retorna um thenable que funciona com
[React.use()](https://react.dev/reference/react/use) -- `use(useFetch(endpoint, args))` opera
como [useSuspense()](./useSuspense.md): suspende enquanto os dados carregam, retorna os dados desnormalizados quando
disponíveis e suspende novamente na [invalidação](./Controller.md#invalidate).

:::

:::vue

Busca um Endpoint se ele não estiver em cache ou estiver desatualizado. Retorna um [Ref](https://vuejs.org/api/reactivity-core.html#ref)
que contém a promise do fetch (com uma flag `resolved`). Um novo fetch é disparado quando os argumentos mudam ou
os dados são [invalidados](./Controller.md#invalidate). Use-o para iniciar fetches cedo e depois leia os dados
com [useSuspense()](./useSuspense.md), [useCache()](./useCache.md) ou [useDLE()](./useDLE.md).

:::

## Uso {#usage}

### Carregamento de dados em paralelo {#parallel-data-loading}

:::react

Como `useFetch()` e `use()` são chamadas separadas, vários fetches começam em paralelo — mesmo quando o primeiro `use()` suspende. Veja o [exemplo de fetches em paralelo](#parallel-data-loading) abaixo.

:::

:::vue

`await useSuspense()` executa sequencialmente no `<script setup>`. Chamar `useFetch()` primeiro para cada endpoint
inicia todos os fetches em paralelo; as chamadas de `useSuspense()` seguintes reutilizam então as requisições em andamento.

:::

<FrameworkPlayground fixtures={parallelFetchFixtures} row>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
  body = '';
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
  text = '';
  static key = 'Comment';
}
export const CommentResource = resource({
  path: '/comments/:id',
  searchParams: {} as { postId: number },
  schema: Comment,
});
```

:::react

```tsx title="PostWithComments" {7-13}
import { use } from 'react';
import { useFetch } from '@data-client/react';
import { PostResource, CommentResource } from './Resources';

function PostWithComments({ id }: { id: number }) {
  // Both fetches start in parallel
  const postPromise = useFetch(PostResource.get, { id });
  const commentsPromise = useFetch(CommentResource.getList, {
    postId: id,
  });

  // use() reads the results — if the first suspends,
  // the second fetch is already in-flight
  const post = use(postPromise);
  const comments = use(commentsPromise);

  return (
    <article>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <h4>Comments</h4>
      {comments.map(comment => (
        <div key={comment.id} className="listItem">
          <strong>{comment.author}</strong>: {comment.text}
        </div>
      ))}
    </article>
  );
}
render(<PostWithComments id={1} />);
```

:::

:::vue

```html title="PostWithComments.vue" {7-15}
<script setup lang="ts">
  import { useFetch, useSuspense } from '@data-client/vue';
  import { PostResource, CommentResource } from './Resources';

  const props = defineProps<{ id: number }>();

  // Both fetches start in parallel
  useFetch(PostResource.get, () => ({ id: props.id }));
  useFetch(CommentResource.getList, () => ({ postId: props.id }));

  // useSuspense() reads the results — the second fetch
  // is already in-flight while the first one is awaited
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
  const comments = await useSuspense(CommentResource.getList, () => ({
    postId: props.id,
  }));
</script>

<template>
  <article>
    <h3>{{ post.title }}</h3>
    <p>{{ post.body }}</p>
    <h4>Comments</h4>
    <div v-for="comment in comments" :key="comment.id" class="listItem">
      <strong>{{ comment.author }}</strong>: {{ comment.text }}
    </div>
  </article>
</template>
```

:::

</FrameworkPlayground>

### Prefetching {#prefetching}

`useFetch()` também pode ser usado de forma independente para garantir que os recursos estejam disponíveis cedo na árvore de renderização, antes de serem necessários.

:::tip

Use em combinação com um hook de vinculação de dados ([useCache()](./useCache.md), [useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md))
em outro componente.

:::

:::react

```tsx
import { useFetch } from '@data-client/react';
import { PostResource } from './resources/Post';

function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.get, { id });
  // ...
}
```

:::

:::vue

```html title="MasterPost.vue"
<script setup lang="ts">
  import { useFetch } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: number }>();
  useFetch(PostResource.get, () => ({ id: props.id }));
  // ...
</script>
```

:::

## Comportamento {#behavior}

:::react

| Status de expiração | Fetch           | Comportamento de `use()` | `resolved` | Condições                                                                                                                             |
| ------------- | --------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Inválido      | sim<sup>1</sup> | suspende         | `false`    | não está na store, [exclusão](/rest/api/resource#delete), [invalidação](./Controller.md#invalidate)                                        |
| Desatualizado | sim<sup>1</sup> | suspende         | `false`    | (primeira renderização, mudança de args) & [expiração &lt; agora](../concepts/expiry-policy.md)                                                           |
| Válido        | não             | retorna dados    | `true`     | conclusão do fetch                                                                                                                       |
| Erro          | não             | lança erro       | `true`     | fetch falhou, capturado por [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) |
|               | não             | `undefined`      |            | `null` usado como segundo argumento                                                                                                         |

Quando a store é atualizada (por exemplo, via mutações ou [Controller.set()](./Controller.md#set)), o componente
é renderizado novamente e `useFetch()` retorna automaticamente os dados desnormalizados atualizados.

:::

:::vue

| Status de expiração | Fetch           | `.value`         | `resolved` | Condições                                                                                      |
| ------------- | --------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Inválido      | sim<sup>1</sup> | promise pendente | `false`    | não está na store, [exclusão](/rest/api/resource#delete), [invalidação](./Controller.md#invalidate) |
| Desatualizado | sim<sup>1</sup> | promise pendente | `false`    | (primeira renderização, mudança de args) & [expiração &lt; agora](../concepts/expiry-policy.md)                    |
| Válido        | não             | promise resolvida | `true`     | conclusão do fetch                                                                                |
| Erro          | não             | promise rejeitada | `true`     | fetch falhou                                                                                    |
|               | não             | `undefined`      |            | `null` usado como segundo argumento                                                                  |

O `Ref` retornado é atualizado com uma nova promise sempre que um fetch é disparado: em mudança de argumentos,
[invalidação](./Controller.md#invalidate) ou [reset](./Controller.md#resetEntireStore).

:::

:::note

1. Fetches idênticos são automaticamente deduplicados

:::

::::react

:::info[React Native]

Ao usar o React Navigation, useFetch() dispara fetches ao receber foco se os dados forem considerados
desatualizados.

:::

::::

<ConditionalDependencies hook="useFetch" />

## Tipos {#types}

:::react

<GenericsTabs>

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: Parameters<typeof endpoint> | [null]
): (PromiseLike<any> & { resolved: boolean }) | undefined;
```

```typescript
function useFetch<
  E extends EndpointInterface<
    FetchFunction,
    Schema | undefined,
    undefined
  >,
  Args extends readonly [...Parameters<E>] | readonly [null],
>(endpoint: E, ...args: Args): UsablePromise<Denormalize<E['schema']>>;
```

</GenericsTabs>

:::

:::vue

```typescript
function useFetch(
  endpoint: ReadEndpoint,
  ...args: MaybeRefsOrGetters<Parameters<typeof endpoint>> | [null]
): Readonly<
  Ref<
    | (Promise<Denormalize<typeof endpoint.schema>> & {
        resolved: boolean;
      })
    | undefined
  >
>;
```

<VueArgs />

Um novo fetch é disparado quando os argumentos mudam.

:::

## Exemplos {#examples}

### Verificando o status do fetch {#checking-fetch-status}

Use `promise.resolved` para verificar se os dados ainda estão carregando:

:::react

```tsx
import { useFetch } from '@data-client/react';
import { PostResource } from './resources/Post';

function MasterPost({ id }: { id: number }) {
  const promise = useFetch(PostResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  // ...
}
```

:::

:::vue

```html title="MasterPost.vue"
<script setup lang="ts">
  import { useFetch } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: number }>();
  const promise = useFetch(PostResource.get, () => ({ id: props.id }));
  if (promise.value && !promise.value.resolved) {
    // fetch is in-flight
  }
  // ...
</script>
```

:::

:::react

### Preload no NextJS {#nextjs-preload}

Para evitar waterfalls de fetch no NextJS, às vezes você pode precisar adicionar [preloads](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data) às rotas de nível superior.

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />

:::
