---
title: useFetch() - Declarative fetch triggers for React
vue_title: useFetch() - Declarative fetch triggers for Vue
sidebar_label: useFetch()
description: Fetch and read endpoint data with React.use(). Suspend on fetch, return denormalized data, re-suspend on invalidation.
vue_description: Fetch an Endpoint if it is not in cache or stale. Returns a Ref to the fetch promise, refetching on invalidation.
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

Fetch an Endpoint if it is not in cache or stale. Returns a thenable that works with
[React.use()](https://react.dev/reference/react/use) -- `use(useFetch(endpoint, args))` operates
like [useSuspense()](./useSuspense.md), suspending when data is loading, returning denormalized data when
available, and re-suspending on [invalidation](./Controller.md#invalidate).

:::

:::vue

Fetch an Endpoint if it is not in cache or stale. Returns a [Ref](https://vuejs.org/api/reactivity-core.html#ref)
holding the fetch promise (with a `resolved` flag). A new fetch is triggered when the arguments change or
the data is [invalidated](./Controller.md#invalidate). Use it to start fetches early, then read the data
with [useSuspense()](./useSuspense.md), [useCache()](./useCache.md) or [useDLE()](./useDLE.md).

:::

## Usage

### Parallel data loading

:::react

Since `useFetch()` and `use()` are separate calls, multiple fetches start in parallel — even when the first `use()` suspends. See the [parallel fetches example](#parallel-data-loading) below.

:::

:::vue

`await useSuspense()` runs sequentially in `<script setup>`. Calling `useFetch()` for each endpoint first
starts every fetch in parallel; the following `useSuspense()` calls then reuse the in-flight requests.

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

### Prefetching

`useFetch()` can also be used standalone to ensure resources are available early in a render tree before they are needed.

:::tip

Use in combination with a data-binding hook ([useCache()](./useCache.md), [useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md))
in another component.

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

## Behavior

:::react

| Expiry Status | Fetch           | `use()` behavior | `resolved` | Conditions                                                                                                                             |
| ------------- | --------------- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | suspends         | `false`    | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate)                                        |
| Stale         | yes<sup>1</sup> | suspends         | `false`    | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                                                           |
| Valid         | no              | returns data     | `true`     | fetch completion                                                                                                                       |
| Error         | no              | throws error     | `true`     | fetch failed, caught by [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) |
|               | no              | `undefined`      |            | `null` used as second argument                                                                                                         |

When the store updates (e.g., via mutations or [Controller.set()](./Controller.md#set)), the component
re-renders and `useFetch()` returns updated denormalized data automatically.

:::

:::vue

| Expiry Status | Fetch           | `.value`         | `resolved` | Conditions                                                                                      |
| ------------- | --------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | pending promise  | `false`    | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate) |
| Stale         | yes<sup>1</sup> | pending promise  | `false`    | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                    |
| Valid         | no              | resolved promise | `true`     | fetch completion                                                                                |
| Error         | no              | rejected promise | `true`     | fetch failed                                                                                    |
|               | no              | `undefined`      |            | `null` used as second argument                                                                  |

The returned `Ref` is updated with a new promise whenever a fetch is triggered: on argument change,
[invalidation](./Controller.md#invalidate), or [reset](./Controller.md#resetEntireStore).

:::

:::note

1. Identical fetches are automatically deduplicated

:::

::::react

:::info[React Native]

When using React Navigation, useFetch() will trigger fetches on focus if the data is considered
stale.

:::

::::

<ConditionalDependencies hook="useFetch" />

## Types

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

A new fetch is triggered when the arguments change.

:::

## Examples

### Checking fetch status

Use `promise.resolved` to check whether data is still loading:

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

### NextJS Preload

To prevent fetch waterfalls in NextJS, sometimes you might need to add [preloads](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data) to top level routes.

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />

:::
