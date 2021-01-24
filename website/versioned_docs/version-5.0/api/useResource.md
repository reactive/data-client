---
id: version-5.0-useresource
title: useResource()
original_id: useresource
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useResource(endpoint: ReadEndpoint, params: object | null):
  Denormalize<typeof endpoint.schema>;

function useResource(...[endpoint: ReadEndpoint, params: object | null]):
  Denormalize<typeof endpoint.schema>[];
```

<!--With Generics-->

```typescript
function useResource<
  Params extends Readonly<object>,
  S extends Schema
>(endpoint: ReadEndpoint<(p:Params) => Promise<any>, S>, params: Params | null): Denormalize<S>;

function useResource<
  Params extends Readonly<object>,
  S extends Schema
>(...[endpoint: ReadEndpoint<(p:Params) => Promise<any>, S>, params: Params | null]): Denormalize<S>[];
```

<!--END_DOCUSAURUS_CODE_TABS-->

Excellent for retrieving the data you need.

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](https://resthooks.io/docs/guides/resource-lifetime).

- Triggers fetch:
  - On first-render and when parameters change
    - or required entity is deleted
    - or imperative [invalidation](./useInvalidator) triggered
  - and When not in cache or result is considered stale
  - and When no identical requests are in flight
  - and when params are not null
- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Throws error to be [caught](../guides/network-errors.md) by [Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- While Loading:
  - Returns previously cached if exists (even if stale)
    - except in case of delete or [invalidation](./useInvalidator)
  - [Suspend rendering](../guides/loading-state.md) otherwise

## Single

```tsx
function Post({ id }: { id: number }) {
  const post = useResource(PostResource.detail(), { id });
  // post as PostResource
}
```

## List

```tsx
function Posts() {
  const posts = useResource(PostResource.list(), {});
  // posts as PostResource[]
}
```

## Parallel

```tsx
function Posts() {
  const [user, posts] = useResource(
    [UserResource.detail(), { id: userId }],
    [PostResource.list(), { userId }],
  );
  // user as UserResource
  // posts as PostResource[]
}
```

## Sequential

```tsx
function PostWithAuthor() {
  const post = useResource(PostResource.detail(), { id });
  // post as PostResource
  const author = useResource(UserResource.detail(), {
    id: post.userId,
  });
  // author as UserResource
}
```

## Paginated data

When entities are stored in nested structures, that structure will remain.

```typescript
export class PaginatedPostResource extends Resource {
  readonly id: number | null = null;
  readonly title: string = '';
  readonly content: string = '';

  static urlRoot = 'http://test.com/post/';

  static list<T extends typeof Resource>(this: T) {
    return super.list().extend({
      schema: { results: [this], nextPage: '', lastPage: '' },
    });
  }
}
```

```tsx
function ArticleList({ page }: { page: string }) {
  const { results: posts, nextPage, lastPage } = useResource(
    PaginatedPostResource.list(),
    { page },
  );
  // posts as PaginatedPostResource[]
}
```

## Useful `Endpoint`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detail()
- list()

Feel free to add your own [Endpoint](api/Endpoint.md) as well.
