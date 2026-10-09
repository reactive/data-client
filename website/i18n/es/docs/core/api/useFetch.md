---
title: useFetch() - Disparadores de fetch declarativos para React
vue_title: useFetch() - Disparadores de fetch declarativos para Vue
sidebar_label: useFetch()
description: Obtén y lee los datos de un endpoint con React.use(). Suspende durante el fetch, devuelve datos desnormalizados y vuelve a suspender tras una invalidación.
vue_description: Obtiene un Endpoint si no está en la caché o está obsoleto. Devuelve un Ref a la promesa del fetch y vuelve a obtener los datos tras una invalidación.
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

Obtiene un Endpoint si no está en la caché o está obsoleto. Devuelve un thenable que funciona con
[React.use()](https://react.dev/reference/react/use): `use(useFetch(endpoint, args))` funciona
como [useSuspense()](./useSuspense.md), suspende mientras los datos se cargan, devuelve los datos desnormalizados cuando
están disponibles y vuelve a suspender tras una [invalidación](./Controller.md#invalidate).

:::

:::vue

Obtiene un Endpoint si no está en la caché o está obsoleto. Devuelve un [Ref](https://vuejs.org/api/reactivity-core.html#ref)
que contiene la promesa del fetch (con un indicador `resolved`). Se dispara un nuevo fetch cuando cambian los argumentos o
cuando los datos se [invalidan](./Controller.md#invalidate). Úsalo para iniciar los fetches temprano y luego lee los datos
con [useSuspense()](./useSuspense.md), [useCache()](./useCache.md) o [useDLE()](./useDLE.md).

:::

## Uso {#usage}

### Carga de datos en paralelo {#parallel-data-loading}

:::react

Como `useFetch()` y `use()` son llamadas separadas, varios fetches se inician en paralelo, incluso cuando el primer `use()` suspende. Consulta el [ejemplo de fetches en paralelo](#parallel-data-loading) más abajo.

:::

:::vue

`await useSuspense()` se ejecuta secuencialmente en `<script setup>`. Llamar primero a `useFetch()` para cada endpoint
inicia todos los fetches en paralelo; las llamadas posteriores a `useSuspense()` reutilizan las peticiones en curso.

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

### Precarga {#prefetching}

`useFetch()` también se puede usar de forma independiente para asegurar que los recursos estén disponibles temprano en el árbol de renderizado, antes de que se necesiten.

:::tip

Úsalo junto con un hook de enlace de datos ([useCache()](./useCache.md), [useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md))
en otro componente.

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

## Comportamiento {#behavior}

:::react

| Estado de caducidad | Fetch           | Comportamiento de `use()` | `resolved` | Condiciones |
| ------------------- | --------------- | ------------------------- | ---------- | ----------- |
| Inválido            | sí<sup>1</sup>  | suspende                  | `false`    | no está en el store, [eliminación](/rest/api/resource#delete), [invalidación](./Controller.md#invalidate) |
| Obsoleto            | sí<sup>1</sup>  | suspende                  | `false`    | (primer render, cambio de args) & [caducidad &lt; ahora](../concepts/expiry-policy.md) |
| Válido              | no              | devuelve los datos        | `true`     | fetch completado |
| Error               | no              | lanza el error            | `true`     | el fetch falló, capturado por un [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) |
|                     | no              | `undefined`               |            | se usó `null` como segundo argumento |

Cuando el store se actualiza (p. ej., mediante mutaciones o [Controller.set()](./Controller.md#set)), el componente
se vuelve a renderizar y `useFetch()` devuelve automáticamente los datos desnormalizados actualizados.

:::

:::vue

| Estado de caducidad | Fetch           | `.value`           | `resolved` | Condiciones |
| ------------------- | --------------- | ------------------ | ---------- | ----------- |
| Inválido            | sí<sup>1</sup>  | promesa pendiente  | `false`    | no está en el store, [eliminación](/rest/api/resource#delete), [invalidación](./Controller.md#invalidate) |
| Obsoleto            | sí<sup>1</sup>  | promesa pendiente  | `false`    | (primer render, cambio de args) & [caducidad &lt; ahora](../concepts/expiry-policy.md) |
| Válido              | no              | promesa resuelta   | `true`     | fetch completado |
| Error               | no              | promesa rechazada  | `true`     | el fetch falló |
|                     | no              | `undefined`        |            | se usó `null` como segundo argumento |

El `Ref` devuelto se actualiza con una nueva promesa cada vez que se dispara un fetch: al cambiar los argumentos,
tras una [invalidación](./Controller.md#invalidate) o un [reinicio](./Controller.md#resetEntireStore).

:::

:::note

1. Los fetches idénticos se deduplican automáticamente

:::

::::react

:::info[React Native]

Al usar React Navigation, useFetch() disparará los fetches al recibir el foco si los datos se consideran
obsoletos.

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

Se dispara un nuevo fetch cuando cambian los argumentos.

:::

## Ejemplos {#examples}

### Comprobar el estado del fetch {#checking-fetch-status}

Usa `promise.resolved` para comprobar si los datos aún se están cargando:

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

### Precarga en NextJS {#nextjs-preload}

Para evitar las cascadas de fetch en NextJS, a veces puede que necesites añadir [precargas](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data) a las rutas de nivel superior.

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />

:::
