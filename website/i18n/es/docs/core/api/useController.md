---
title: useController() - Manipulación del store con tipado seguro en React
vue_title: useController() - Manipulación del store con tipado seguro en Vue
sidebar_label: useController()
description: Controller ofrece métodos con tipado seguro para acceder al store y despachar acciones.
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

import TypeScriptEditor from '@site/src/components/TypeScriptEditor';
import StackBlitz from '@site/src/components/StackBlitz';

# useController()

[Controller](./Controller.md) ofrece métodos con tipado seguro para acceder al store y despachar acciones.

Por ejemplo, [fetch](./Controller.md#fetch), [invalidate](./Controller.md#invalidate)
y [setResponse](./Controller.md#setResponse)

:::react

```tsx
import { useCallback } from 'react';
import { useController } from '@data-client/react';
import { MyResource } from './resources';

function MyComponent({ id }: { id: string }) {
  const ctrl = useController();

  const handleRefresh = useCallback(
    async e => {
      await ctrl.fetch(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleSuspend = useCallback(
    async e => {
      await ctrl.invalidate(MyResource.get, { id });
    },
    [ctrl, id],
  );

  const handleLogout = useCallback(
    async e => {
      ctrl.resetEntireStore();
    },
    [ctrl],
  );
}
```

:::

:::vue

```html
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { MyResource } from './resources';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const handleRefresh = async () => {
    await ctrl.fetch(MyResource.get, { id: props.id });
  };

  const handleSuspend = async () => {
    await ctrl.invalidate(MyResource.get, { id: props.id });
  };

  const handleLogout = () => {
    ctrl.resetEntireStore();
  };
</script>
```

`useController()` debe llamarse dentro de `<script setup>` (o `setup()`), y requiere que el
[DataClientPlugin](./DataClientPlugin.md) esté instalado.
El mismo [Controller](./Controller.md) también está disponible en las plantillas y en la Options API como [`$dataClient`](./DataClientPlugin.md#dataclient).

:::

## Ejemplos {#examples}

### Envío de formularios {#form-submission}

[fetch](./Controller.md#fetch) devuelve la respuesta desnormalizada, igual que el tipo de retorno de [useSuspense()](./useSuspense.md). Esto permite usar métodos de Entity como `pk()`.

:::react

```tsx
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useController } from '@data-client/react';
import { PostResource } from './PostResource';

function CreatePost() {
  const ctrl = useController();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    navigate(`/post/${post.pk()}`);
  };

  return <form onSubmit={handleSubmit}>{/* fields */}</form>;
}
```

:::

:::vue

```html title="CreatePost.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { useRouter } from 'vue-router';
  import { PostResource } from './PostResource';

  const ctrl = useController();
  const router = useRouter();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const post = await ctrl.fetch(
      PostResource.getList.push,
      new FormData(e.target as HTMLFormElement),
    );
    post.title;
    post.computedField;
    router.push(`/post/${post.pk()}`);
  };
</script>

<template>
  <form @submit="handleSubmit"><!-- fields --></form>
</template>
```

:::

### Actualización directa de una entidad {#direct-entity-update}

Usa [set](./Controller.md#set) para actualizaciones inmediatas sin peticiones de red. Admite actualizaciones funcionales para evitar condiciones de carrera.

:::react

```tsx
import { useController } from '@data-client/react';
import { Article } from './Article';

function VoteButton({ articleId }: { articleId: string }) {
  const ctrl = useController();

  return (
    <button
      onClick={() =>
        ctrl.set(Article, { id: articleId }, article => ({
          ...article,
          votes: article.votes + 1,
        }))
      }
    >
      Vote
    </button>
  );
}
```

:::

:::vue

```html title="VoteButton.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { Article } from './Article';

  const props = defineProps<{ articleId: string }>();
  const ctrl = useController();

  const vote = () =>
    ctrl.set(Article, { id: props.articleId }, article => ({
      ...article,
      votes: article.votes + 1,
    }));
</script>

<template>
  <button @click="vote">Vote</button>
</template>
```

:::

### Invalidar después de una mutación {#invalidate-after-mutation}

Fuerza la obtención de nuevo de los datos relacionados con [invalidate](./Controller.md#invalidate) o [expireAll](./Controller.md#expireAll).

:::react

```tsx
import { useController } from '@data-client/react';
import { UserResource } from './UserResource';

function ClearUserCache({ userId }: { userId: string }) {
  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };

  return <button onClick={handleClear}>Refresh user data</button>;
}
```

:::

:::vue

```html title="ClearUserCache.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { UserResource } from './UserResource';

  const ctrl = useController();

  const handleClear = async () => {
    // invalidate() causes suspense; expireAll() refetches silently
    ctrl.expireAll(UserResource.get);
    ctrl.expireAll(UserResource.getList);
  };
</script>

<template>
  <button @click="handleClear">Refresh user data</button>
</template>
```

:::

:::tip

Para un mejor rendimiento y consistencia, es preferible [incluir las actualizaciones de efectos secundarios en las respuestas de las mutaciones](/rest/guides/side-effects).

:::

### Precarga {#prefetching}

Usa [fetchIfStale](./Controller.md#fetchIfStale) para precargar sin volver a obtener datos que ya están frescos.

:::react

```tsx
import { Link } from 'react-router';
import { useController } from '@data-client/react';
import { ArticleResource } from './ArticleResource';

function ArticleLink({ id }: { id: string }) {
  const ctrl = useController();

  return (
    <Link
      to={`/article/${id}`}
      onMouseEnter={() => ctrl.fetchIfStale(ArticleResource.get, { id })}
    >
      Read more
    </Link>
  );
}
```

:::

:::vue

```html title="ArticleLink.vue"
<script setup lang="ts">
  import { useController } from '@data-client/vue';
  import { ArticleResource } from './ArticleResource';

  const props = defineProps<{ id: string }>();
  const ctrl = useController();

  const prefetch = () =>
    ctrl.fetchIfStale(ArticleResource.get, { id: props.id });
</script>

<template>
  <RouterLink :to="`/article/${id}`" @mouseenter="prefetch">
    Read more
  </RouterLink>
</template>
```

:::

### Actualizaciones por websocket {#websocket-updates}

Rellena la caché con datos externos mediante [set](./Controller.md#set).

:::react

```tsx
import { useEffect } from 'react';
import { useController } from '@data-client/react';
import { EntityMap } from './resources';

function useWebsocket(url: string) {
  const ctrl = useController();

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
    return () => ws.close();
  }, [ctrl, url]);
}
```

:::

:::vue

```ts title="useWebsocket.ts"
import { onMounted, onUnmounted } from 'vue';
import { useController } from '@data-client/vue';
import { EntityMap } from './resources';

export function useWebsocket(url: string) {
  const ctrl = useController();
  let ws: WebSocket;

  onMounted(() => {
    ws = new WebSocket(url);
    ws.onmessage = event => {
      const { entity, args, data } = JSON.parse(event.data);
      ctrl.set(EntityMap[entity], args, data);
    };
  });
  onUnmounted(() => ws?.close());
}
```

:::

:::warning

Para uso en producción, implementa un [Manager para flujos de datos](../concepts/managers.md#data-stream) en lugar de :react[efectos]:vue[hooks de ciclo de vida] a nivel de componente. Los Managers manejan el ciclo de vida de la conexión de forma global y funcionan con SSR.

:::

### Aplicación de tareas {#todo-app}

:::react

<StackBlitz app="todo-app" file="src/resources/TodoResource.ts,src/pages/Home/TodoListItem.tsx" view="both" />

:::

:::vue

<StackBlitz app="vue-todo-app" file="src/resources/TodoResource.ts,src/components/TodoItem.vue" view="both" />

:::
