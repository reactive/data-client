---
title: Queryable schemas render stored data without waiting for a fetch
sidebar_label: Queryable
description: How a schema finds its data in the store from args alone, so a page renders what another request already loaded.
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import { postFixtures } from '@site/src/fixtures/posts';

# Queryable

A schema is _Queryable_ when it can find its data in the store from args alone, without a response.
[Normalization](./normalization.md) makes this possible: it stores each Entity once, by its primary key, no matter
which response delivered it.

Queryability allows for higher performance navigation. Data that one request loaded renders on every page that asks
for it. A detail page opened from a list renders at once, and makes no request while that data is fresh.

Open a post below. `PostDetail` renders without a loading state, because the list already stored that `Post`.

<FrameworkPlayground defaultOpen="n" row fixtures={postFixtures}>

```ts title="Resources" collapsed
import { Entity, resource } from '@data-client/rest';

export class User extends Entity {
  id = 0;
  name = '';

  get profileImage() {
    return `https://i.pravatar.cc/64?img=${this.id + 4}`;
  }

  static key = 'User';
}

export class Post extends Entity {
  id = 0;
  author = User.fromJS();
  title = '';
  body = '';

  static key = 'Post';

  static schema = {
    author: User,
  };
}
export const PostResource = resource({
  path: '/posts/:id',
  schema: Post,
});
```

:::react

```tsx title="PostList" route="/" collapsed
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostList() {
  const posts = useSuspense(PostResource.getList);
  return (
    <div>
      {posts.map(post => (
        <div key={post.pk()} className="listItem spaced">
          <Avatar src={post.author.profileImage} />
          <div>
            <h4>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h4>
            <small>by {post.author.name}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="PostDetail" route="/posts/:id" {6}
import { useSuspense } from '@data-client/react';
import { PostResource } from './Resources';

export default function PostDetail({ id }: { id: string }) {
  // the list stored this Post, so there is nothing to wait for
  const post = useSuspense(PostResource.get, { id });
  return (
    <div>
      <header>
        <div className="listItem spaced">
          <div className="author">
            <Avatar src={post.author.profileImage} />
            <small>{post.author.name}</small>
          </div>
          <h4>{post.title}</h4>
        </div>
      </header>
      <p>{post.body}</p>
    </div>
  );
}
```

:::

:::vue

```html title="PostList.vue" route="/" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const posts = await useSuspense(PostResource.getList);
</script>

<template>
  <div>
    <div v-for="post in posts" :key="post.pk()" class="listItem spaced">
      <Avatar :src="post.author.profileImage" />
      <div>
        <h4>
          <RouterLink :to="`/posts/${post.id}`">{{ post.title }}</RouterLink>
        </h4>
        <small>by {{ post.author.name }}</small>
      </div>
    </div>
  </div>
</template>
```

```html title="PostDetail.vue" route="/posts/:id" {7}
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import { PostResource } from './Resources';

  const props = defineProps<{ id: string }>();
  // the list stored this Post, so there is nothing to wait for
  const post = await useSuspense(PostResource.get, () => ({ id: props.id }));
</script>

<template>
  <div>
    <header>
      <div class="listItem spaced">
        <div class="author">
          <Avatar :src="post.author.profileImage" />
          <small>{{ post.author.name }}</small>
        </div>
        <h4>{{ post.title }}</h4>
      </div>
    </header>
    <p>{{ post.body }}</p>
  </div>
</template>
```

:::

</FrameworkPlayground>

:::react

In the [React benchmarks](./performance.md), with a simulated 40 ms network delay, switching between a list and its
items is 21× faster than TanStack Query, which keys the detail query separately and fetches it.

:::

## Querying the store {#query}

A Queryable schema has a [queryKey(args)](/rest/api/schema#queryable) method. It returns what a response would have
normalized to, and returns it only for data the store holds.

[useQuery()](../api/useQuery.md) asks this question directly. `useQuery(Post, { id })` returns the stored `Post`, or
`undefined` when the store doesn't hold it. It never fetches.

Each schema answers in its own way:

- An [Entity](/rest/api/Entity) returns its primary key. By default, args with the fields `pk()` reads, like `{ id }`,
  find it. `pk()`, [indexes](/rest/api/Entity#indexes) or `queryKey` itself change which args do
  ([Queryable by args](/rest/api/Entity#pk-args)).
- An object schema like `{ data: Post }` combines its members' results.
- [Collection](/rest/api/Collection), [All](/rest/api/All), [Union](/rest/api/Union), [Query](/rest/api/Query) and
  [Scalar](/rest/api/Scalar) are Queryable too ([what each returns](/rest/api/schema#queryable)).
- [Array](/rest/api/Array) and [Values](/rest/api/Values) are not. Use a [Collection](/rest/api/Collection) or
  [All](/rest/api/All) for a list that should be Queryable.

## Endpoints query before they fetch {#endpoints}

An endpoint with a Queryable schema asks the same question before it fetches. Reading an endpoint uses the first of
these that applies:

1. The endpoint has a response of its own. It reads that response, with that response's expiry.
2. The endpoint's schema is Queryable, and the store's result for its args is complete: no part of it is `undefined`.
   It reads that result.
3. Otherwise the data is missing, so the endpoint fetches.

So what `useQuery()` can find, an endpoint doesn't wait to fetch. When `useQuery(Post, { id })` returns a post,
`useSuspense(PostResource.get, { id })` renders it without waiting for a fetch. The exceptions are an endpoint that
was invalidated, or one that is invalidIfStale and stale ([expiry](#expiry)).

The two differ in what they do with the answer:

|                                | [useQuery(schema, ...args)](../api/useQuery.md)                      | Reading an endpoint with that schema         |
| ------------------------------ | -------------------------------------------------------------------- | -------------------------------------------- |
| Queries the store              | Always                                                               | Until the endpoint has a response of its own |
| Part of the result is missing  | Returns `undefined`; an object schema returns the object without it | Fetches                                      |
| [Expiry](#expiry)              | Ignored                                                              | Applies                                      |
| Fetches                        | Never                                                                | When data is missing or stale                |

This applies wherever an endpoint is read: [useSuspense()](../api/useSuspense.md), [useDLE()](../api/useDLE.md),
[useCache()](../api/useCache.md), [useLive()](../api/useLive.md), [useFetch()](../api/useFetch.md),
[Controller.getResponse()](../api/Controller.md#getResponse) and
[Controller.fetchIfStale()](../api/Controller.md#fetchIfStale). [Controller.fetch()](../api/Controller.md#fetch) always
requests.

### Stored data keeps its expiry {#expiry}

A complete result is treated like a response. It expires when the earliest-expiring Entity in it does, and the
[expiry policy](./expiry-policy.md) applies as usual:

- While the result is fresh, the endpoint makes no request.
- Once it is stale, it still renders, and the endpoint refetches.
- An [invalidIfStale](./expiry-policy.md#endpointinvalidifstale) endpoint treats a stale result as
  [Invalid](./expiry-policy.md#expiry-status), and an [invalidated](./expiry-policy.md#invalidate) endpoint treats any
  result that way, so they wait for a fetch.
- An Entity that fails [validate()](/rest/api/Entity#validate) counts as missing.

### Which results are complete {#complete}

- An Entity stored by any response is found by every endpoint whose schema holds that Entity and whose args produce its
  `pk`.
- Args `queryKey` doesn't read, like `expand` in `{ id, expand: 'comments' }`, don't affect the result.
- An object schema like `{ data: Post }` is complete when every member is. An Array member never is. A Collection
  member is when the store holds it for those args. Two Entities must both be found by the same args.
- Until the endpoint's own response arrives, the result holds only what the schema declares. Plain values in it, like
  `total: 0`, are returned as written. Response fields it leaves out, like a `meta`, are `undefined`.

### Fields are not checked {#fields}

Finding an Entity doesn't check which fields it has. When list items lack fields the detail page shows, the detail
renders those fields' defaults, and doesn't fetch while the list data is fresh. To make it fetch, give the list a
summary Entity and make the detail Entity require the rest with [validate()](/rest/api/Entity#validate)
([Partial entities](/rest/guides/partial-entities)).

## Other ways to query {#uses}

Every API that reads the store without an endpoint takes a Queryable schema and args:

- [Query](/rest/api/Query) computes a sorted, filtered or aggregated view from another Queryable schema.
- [Controller.get()](../api/Controller.md#get) and [Snapshot.get()](../api/Snapshot.md#get) read the store in
  [Managers](./managers.md), event handlers and
  [getOptimisticResponse](/rest/api/RestEndpoint#getoptimisticresponse).
- [Controller.set()](../api/Controller.md#set) writes with the same schema and args.

[Queryable schemas](/rest/api/schema#queryable) lists every use.

## Next steps

- [Lists to details](../getting-started/data-dependency.md#list-detail) - a list and detail page sharing data, and what
  to do when list items have fewer fields
- [Expiry Policy](./expiry-policy.md) - when stored data is fresh, stale or invalid, and how to change that
- [Queryable by args](/rest/api/Entity#pk-args) - which args find an Entity, and how to change that
- [Queryable schemas](/rest/api/schema#queryable) - what each schema's `queryKey` returns, and every API that uses it
