---
title: useLoading() - Turn any promise into React State
vue_title: useLoading() - Turn any promise into Vue State
sidebar_label: useLoading()
description: Track loading and error state of any async function.
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

Helps track loading and error state of imperative async functions.

:::tip

[useSuspense()](./useSuspense.md) or [useDLE()](./useDLE.md) are better for GET/read endpoints.

:::

## Usage

:::react

<UseLoading />

Like [useCallback](https://react.dev/reference/react/useCallback), takes a dependency list to
ensure referential consistency of the function.

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
    <textarea name="body" :rows="12" label="Body" required>
      After clicking 'save', the button will be disabled until the POST
      is completed. Upon completion the newly created post is displayed
      immediately as Reactive Data Client is able to use the fetch
      response to populate the store.
    </textarea>
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
    <center>
      <button @click="id = undefined">New Post</button>
    </center>
  </div>
  <PostCreate v-else @navigate-to-post="id = $event" />
</template>
```

</FrameworkPlayground>

Returns the wrapped function along with `loading` and `error` [refs](https://vuejs.org/api/reactivity-core.html#ref).
The wrapped function is stable, so no dependency list is needed: any refs or props it reads are
read at call time.

:::

::::react

## Eslint

:::tip[Eslint configuration]

Since we use the deps list, be sure to add useLoading to the 'additionalHooks' configuration
of [react-hooks/exhaustive-deps](https://www.npmjs.com/package/eslint-plugin-react-hooks) rule if you use it.

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

## Types

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

`loading` is `true` while the returned promise is pending. If `func` rejects, the rejection is
caught and stored in `error`; it is cleared again on the next call.

:::

## Examples

:::react

### Github pagination

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/IssueList.tsx,src/pages/NextPage.tsx" view="editor" />

### Github comment form submission

<StackBlitz app="github-app" file="src/pages/IssueDetail/CreateComment.tsx,src/pages/IssueDetail/CommentForm.tsx" view="editor" />

:::

:::vue

### Todo creation

<StackBlitz app="vue-todo-app" file="src/components/TodoList.vue,src/resources/TodoResource.ts" view="editor" />

:::
