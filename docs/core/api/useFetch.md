---
title: useFetch() - Declarative fetch triggers for React
sidebar_label: useFetch()
description: Fetch and read endpoint data with React.use(). Suspend on fetch, return denormalized data, re-suspend on invalidation.
---

import GenericsTabs from '@site/src/components/GenericsTabs';
import ConditionalDependencies from '../shared/\_conditional_dependencies.mdx';
import HooksPlayground from '@site/src/components/HooksPlayground';
import StackBlitz from '@site/src/components/StackBlitz';
import { parallelFetchFixtures } from '@site/src/fixtures/post-comments';

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# useFetch()

Fetch an Endpoint if it is not in cache or stale. Returns a thenable that works with
[React.use()](https://react.dev/reference/react/use) -- `use(useFetch(endpoint, args))` operates
like [useSuspense()](./useSuspense.md), suspending when data is loading, returning denormalized data when
available, and re-suspending on [invalidation](./Controller.md#invalidate).

## Usage

### Parallel data loading

Since `useFetch()` and `use()` are separate calls, multiple fetches start in parallel — even when the first `use()` suspends. See the [parallel fetches example](#parallel-fetches) below.

<HooksPlayground fixtures={parallelFetchFixtures} row>

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

```tsx title="PostWithComments" {4-5}
import { use } from 'react';
import { useFetch } from '@data-client/react';
import { PostResource, CommentResource } from './Resources';

function PostWithComments({ id }: { id: number }) {
  // Both fetches start in parallel
  const postPromise = useFetch(PostResource.get, { id });
  const commentsPromise = useFetch(CommentResource.getList, { postId: id });

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

</HooksPlayground>

### Prefetching

`useFetch()` can also be used standalone to ensure resources are available early in a render tree before they are needed.

:::tip

Use in combination with a data-binding hook ([useCache()](./useCache.md), [useSuspense()](./useSuspense.md), [useDLE()](./useDLE.md), [useLive()](./useLive.md))
in another component.

:::

```tsx
function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.get, { id });
  // ...
}
```

## Behavior

| Expiry Status | Fetch           | `use()` behavior | `resolved` | Conditions                                                                                            |
| ------------- | --------------- | ---------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| Invalid       | yes<sup>1</sup> | suspends         | `false`    | not in store, [deletion](/rest/api/resource#delete), [invalidation](./Controller.md#invalidate) |
| Stale         | yes<sup>1</sup> | suspends         | `false`    | (first-render, arg change) & [expiry &lt; now](../concepts/expiry-policy.md)                          |
| Valid         | no              | returns data     | `true`     | fetch completion                                                                                      |
| Error         | no              | throws error     | `true`     | fetch failed, caught by [Error Boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) |
|               | no              | `undefined`      |            | `null` used as second argument                                                                        |

When the store updates (e.g., via mutations or [Controller.set()](./Controller.md#set)), the component
re-renders and `useFetch()` returns updated denormalized data automatically.

:::note

1. Identical fetches are automatically deduplicated

:::

:::info React Native

When using React Navigation, useFetch() will trigger fetches on focus if the data is considered
stale.

:::

<ConditionalDependencies hook="useFetch" />

## Types

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

## Examples

### Checking fetch status

Use `promise.resolved` to check whether data is still loading:

```tsx
function MasterPost({ id }: { id: number }) {
  const promise = useFetch(PostResource.get, { id });
  if (!promise.resolved) {
    // fetch is in-flight
  }
  // ...
}
```

### NextJS Preload

To prevent fetch waterfalls in NextJS, sometimes you might need to add [preloads](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#preloading-data) to top level routes.

<StackBlitz repo="coin-app" file="src/app/[id]/page.tsx" initialpath="/BTC" view="editor" height="700" />
