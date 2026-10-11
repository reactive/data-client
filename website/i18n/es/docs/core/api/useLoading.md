---
title: useLoading() - Convierte cualquier promesa en estado de React
vue_title: useLoading() - Convierte cualquier promesa en estado de Vue
sidebar_label: useLoading()
description: Rastrea el estado de carga y de error de cualquier función asíncrona.
---

import UseLoading from '../shared/\_useLoading.mdx';
import PkgInstall from '@site/src/components/PkgInstall';
import StackBlitz from '@site/src/components/StackBlitz';
import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {
postFixtures,
getInitialInterceptorData,
} from '@site/src/fixtures/posts';

# useLoading()

Ayuda a rastrear el estado de carga y de error de funciones asíncronas imperativas.

:::tip

[useSuspense()](./useSuspense.md) o [useDLE()](./useDLE.md) son mejores para endpoints GET/de lectura.

:::

## Uso {#usage}

:::react

<UseLoading />

Al igual que [useCallback](https://react.dev/reference/react/useCallback), recibe una lista de dependencias para
garantizar la consistencia referencial de la función.

:::

:::vue

<FrameworkPlayground fixtures={postFixtures} getInitialInterceptorData={getInitialInterceptorData} row>

```ts title="PostResource" collapsed
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  author = 0;
  title = '';
  body = '';
  votes = 0;

  static key = 'Post';

  get img() {
    return `//loremflickr.com/96/72/kitten,cat?lock=${this.id % 16}`;
  }
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});
```

```html title="PostDetail.vue" collapsed
<script setup lang="ts">
  import { computed } from 'vue';
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './PostResource';

  const props = defineProps<{ id: number }>();
  const post = await useSuspense(PostResource.get, computed(() => ({
    id: props.id,
  })));
</script>

<template>
  <div>
    <div class="voteBlock">
      <img :src="post.img" width="70" height="52" />
    </div>
    <div>
      <h4>{{ post.title }}</h4>
      <p>{{ post.body }}</p>
    </div>
  </div>
</template>
```

```html title="PostForm.vue" collapsed
<script setup lang="ts">
  defineProps<{
    loading: boolean;
    error: Error | undefined;
  }>();
  const emit = defineEmits<{ submit: [data: FormData] }>();

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    emit('submit', new FormData(e.target as HTMLFormElement));
  };
</script>

<template>
  <form @submit="handleSubmit">
    <TextInput
      label="Title"
      name="title"
      defaultValue="My New Post"
      required
    />
    <TextArea name="body" :rows="12" label="Body" required>
      After clicking 'save', the button will be disabled until the POST
      is completed. Upon completion the newly created post is displayed
      immediately as Reactive Data Client is able to use the fetch
      response to populate the store.
    </TextArea>
    <div v-if="error" class="alert alert--danger">{{ error.message }}</div>
    <div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>
```

```html title="PostCreate.vue"
<script setup lang="ts">
  import { useLoading, useController } from '@data-client/vue';
  import { PostResource } from './PostResource';
  import PostForm from './PostForm.vue';

  const emit = defineEmits<{ navigateToPost: [id: number] }>();
  const ctrl = useController();
  // highlight-start
  const [handleSubmit, loading, error] = useLoading(
    async (data: FormData) => {
      const post = await ctrl.fetch(PostResource.getList.push, data);
      emit('navigateToPost', post.id);
    },
  );
  // highlight-end
</script>

<template>
  <PostForm @submit="handleSubmit" :loading="loading" :error="error" />
</template>
```

```html title="Navigation.vue" collapsed
<script setup lang="ts">
  import { ref } from 'vue';
  import PostCreate from './PostCreate.vue';
  import PostDetail from './PostDetail.vue';

  const id = ref<number | undefined>(undefined);
</script>

<template>
  <div v-if="id">
    <Suspense>
      <PostDetail :id="id" />
    </Suspense>
    <div style="text-align: center">
      <button @click="id = undefined">New Post</button>
    </div>
  </div>
  <PostCreate v-else @navigate-to-post="id = $event" />
</template>
```

</FrameworkPlayground>

Devuelve la función envuelta junto con los [refs](https://vuejs.org/api/reactivity-core.html#ref) `loading` y `error`.
La función envuelta es estable, por lo que no se necesita una lista de dependencias: los refs o props que lee
se leen en el momento de la llamada.

:::

::::react

## Eslint {#eslint}

:::tip[Configuración de Eslint]

Como usamos la lista de dependencias, asegúrate de añadir useLoading a la configuración 'additionalHooks'
de la regla [react-hooks/exhaustive-deps](https://www.npmjs.com/package/eslint-plugin-react-hooks) si la usas.

```js
{
  "rules": {
    // ...
    "react-hooks/exhaustive-deps": ["warn", {
      "additionalHooks": "(useLoading)"
    }]
  }
}
```

:::

::::

## Tipos {#types}

:::react

```typescript
export default function useLoading<
  F extends (...args: any) => Promise<any>,
>(func: F, deps: readonly any[] = []): [F, boolean];
```

:::

:::vue

```typescript
export default function useLoading<
  F extends (...args: any) => Promise<any>,
>(func: F): [F, Ref<boolean>, Ref<Error | undefined>];
```

`loading` es `true` mientras la promesa devuelta está pendiente. Si `func` es rechazada, el rechazo se
captura y se guarda en `error`; se limpia de nuevo en la siguiente llamada.

:::

## Ejemplos {#examples}

:::react

### Paginación de Github {#github-pagination}

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/IssueList.tsx,src/pages/NextPage.tsx" view="editor" />

### Envío del formulario de comentarios de Github {#github-comment-form-submission}

<StackBlitz app="github-app" file="src/pages/IssueDetail/CreateComment.tsx,src/pages/IssueDetail/CommentForm.tsx" view="editor" />

:::

:::vue

### Creación de tareas {#todo-creation}

<StackBlitz app="vue-todo-app" file="src/components/TodoList.vue,src/resources/TodoResource.ts" view="editor" />

:::
