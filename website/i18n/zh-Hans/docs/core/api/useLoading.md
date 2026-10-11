---
title: useLoading() - 将任意 promise 转换为 React 状态
vue_title: useLoading() - 将任意 promise 转换为 Vue 状态
sidebar_label: useLoading()
description: 追踪任意异步函数的加载与错误状态。
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

帮助追踪命令式异步函数的加载与错误状态。

:::tip

对于 GET/读取类 endpoint，[useSuspense()](./useSuspense.md) 或 [useDLE()](./useDLE.md) 更合适。

:::

## 用法 {#usage}

:::react

<UseLoading />

与 [useCallback](https://react.dev/reference/react/useCallback) 一样，它接收一个依赖列表，
以确保函数的引用一致性。

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

返回包装后的函数，以及 `loading` 和 `error` 两个 [ref](https://vuejs.org/api/reactivity-core.html#ref)。
包装后的函数是稳定的，因此不需要依赖列表：它读取的任何 ref 或 props
都会在调用时读取。

:::

::::react

## Eslint {#eslint}

:::tip[Eslint 配置]

由于我们使用了依赖列表，如果你使用 [react-hooks/exhaustive-deps](https://www.npmjs.com/package/eslint-plugin-react-hooks) 规则，
请务必将 useLoading 添加到该规则的 'additionalHooks' 配置中。

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

## 类型 {#types}

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

在返回的 promise 处于 pending 状态时，`loading` 为 `true`。如果 `func` reject，
该 rejection 会被捕获并存入 `error`；下次调用时会再次被清除。

:::

## 示例 {#examples}

:::react

### Github 分页 {#github-pagination}

<StackBlitz app="github-app" file="src/resources/Issue.tsx,src/pages/IssueList.tsx,src/pages/NextPage.tsx" view="editor" />

### Github 评论表单提交 {#github-comment-form-submission}

<StackBlitz app="github-app" file="src/pages/IssueDetail/CreateComment.tsx,src/pages/IssueDetail/CommentForm.tsx" view="editor" />

:::

:::vue

### 创建 Todo {#todo-creation}

<StackBlitz app="vue-todo-app" file="src/components/TodoList.vue,src/resources/TodoResource.ts" view="editor" />

:::
