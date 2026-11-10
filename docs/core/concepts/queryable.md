---
title: Queryable schemas render stored data without waiting for a fetch
sidebar_label: Queryable
description: How a schema finds its data in the store from args alone, so a page renders what another request already loaded.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

# Queryable

[Normalization](./normalization.md) stores each Entity once, by its primary key, no matter which response delivered it.
A schema that can find its data in that store from args alone, without a response, is _Queryable_.

Queryability allows for higher performance navigation: a page renders data another request already loaded, such as
a detail page opened from a list, instead of waiting for its own fetch.

:::react

In the [React benchmarks](./performance.md), with a simulated 40 ms network delay, switching between a list and its
items is 21× faster than TanStack Query, which keys the detail query separately and fetches it.

:::

## queryKey

A Queryable schema has a [queryKey(args)](/rest/api/schema#queryable) method. It returns what a response would have
normalized to, and returns it only for data the store holds.

An [Entity](/rest/api/Entity)'s `queryKey` returns its primary key. By default, args with the fields `pk()` reads, like
`{ id }`, find it; `pk()`, [indexes](/rest/api/Entity#indexes) or `queryKey` itself change which args do
([Queryable by args](/rest/api/Entity#pk-args)). An object schema like `{ data: Post }` combines its members' results,
and [Collection](/rest/api/Collection), [All](/rest/api/All), [Union](/rest/api/Union), [Query](/rest/api/Query) and
[Scalar](/rest/api/Scalar) are Queryable too ([what each returns](/rest/api/schema#queryable)).
[Array](/rest/api/Array) and [Values](/rest/api/Values) are not: wrap a list in a [Collection](/rest/api/Collection) to
make it Queryable.

[useQuery()](../api/useQuery.md) renders a Queryable schema's result directly: `useQuery(Post, { id })`.

## Endpoints query the store {#endpoints}

An endpoint reads its own response when it has one. Until then, an endpoint with a Queryable schema queries the store
with its args, and uses the result when it is complete: no part of it is `undefined`.

A complete result is treated like a response. It expires when the first Entity in it expires, and the
[expiry policy](./expiry-policy.md) applies as usual: stale data renders while it refetches, an
[invalidIfStale](./expiry-policy.md#endpointinvalidifstale) or invalidated endpoint suspends, and an Entity that fails
[validate()](/rest/api/Entity#validate) counts as missing. An incomplete result is missing data, so the endpoint
fetches.

The rest follows from these two rules:

- An Entity stored by any response is found by every endpoint whose args produce its `pk`.
- Args `queryKey` doesn't read, like `expand` in `{ id, expand: 'comments' }`, don't affect the result.
- An object schema like `{ data: Post }` is complete when every member is: an Array member never is, a Collection member
  is when the store holds it for those args, and two Entities must both be found by the same args. The result holds only
  the schema's members, so other values render as the schema's defaults until the endpoint's own response arrives.
- Once the endpoint has a response of its own, it reads that, with that response's expiry.

This applies wherever an endpoint is read: [useSuspense()](../api/useSuspense.md), [useDLE()](../api/useDLE.md),
[useCache()](../api/useCache.md) and [Controller.fetchIfStale()](../api/Controller.md#fetchIfStale).
[Controller.fetch()](../api/Controller.md#fetch) always requests. [useQuery()](../api/useQuery.md) runs the same
`queryKey` but ignores expiry, and returns an object schema even with a member missing.

For example, a detail page opened from a list renders the Post the list stored:

```ts title="api/Post"
import { Entity, resource } from '@data-client/rest';

export class Post extends Entity {
  id = 0;
  title = '';
}
export const PostResource = resource({
  urlPrefix: 'https://jsonplaceholder.typicode.com',
  path: '/posts/:id',
  schema: Post,
});
```

:::react

```tsx title="PostDetail"
import { useSuspense } from '@data-client/react';
import { PostResource } from './api/Post';

export default function PostDetail({ id }: { id: number }) {
  // Post `id` stored by PostResource.getList renders at once, with no fetch while it is fresh
  const post = useSuspense(PostResource.get, { id });
  return <h1>{post.title}</h1>;
}
```

:::

:::vue

```html title="PostDetail.vue"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './api/Post';

  const props = defineProps<{ id: number }>();
  // Post `id` stored by PostResource.getList renders at once, with no fetch while it is fresh
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
</script>

<template>
  <h1>{{ post.title }}</h1>
</template>
```

:::

## Next steps

- [Lists to details](../getting-started/data-dependency.md#list-detail) - a list and detail page sharing data, and what
  to do when list items have fewer fields
- [Queryable by args](/rest/api/Entity#pk-args) - which args find an Entity, and how to change that
- [Queryable schemas](/rest/api/schema#queryable) - what each schema's `queryKey` returns, and every API that uses it
