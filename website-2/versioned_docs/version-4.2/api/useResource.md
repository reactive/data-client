---
id: useresource
title: useResource()
original_id: useresource
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useResource(fetchShape: ReadShape, params: object | null):
  Denormalize<typeof fetchShape.schema>;

function useResource(...[fetchShape: ReadShape, params: object | null]):
  Denormalize<typeof fetchShape.schema>[];
```

<!--With Generics-->

```typescript
function useResource<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null): Denormalize<S>;

function useResource<
  Params extends Readonly<object>,
  S extends Schema
>(...[fetchShape: ReadShape<S, Params>, params: Params | null]): Denormalize<S>[];
```

<!--END_DOCUSAURUS_CODE_TABS-->

Excellent for retrieving the data you need.

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](https://resthooks.io/docs/guides/resource-lifetime).

- Triggers fetch:
  - On first-render
    - or parameters change
    - or required entity is deleted
    - or imperative [invalidation](./useInvalidator) triggered
  - and When not in cache or result is considered stale
  - and When no identical requests are in flight
  - and when params are not null
- [On Error (404, 500, etc)](https://www.restapitutorial.com/httpstatuscodes.html):
  - Throws error to be [caught](../guides/network-errors.md) by [Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- While Loading:
  - Returns previously cached if exists (even if stale)
  - [Suspend rendering](../guides/loading-state.md) otherwise

## Single

```tsx
function Post({ id }: { id: number }) {
  const post = useResource(PostResource.detailShape(), { id });
  // post as PostResource
}
```

## List

```tsx
function Posts() {
  const posts = useResource(PostResource.listShape(), {});
  // posts as PostResource[]
}
```

## Parallel

```tsx
function Posts() {
  const [user, posts] = useResource(
    [UserResource.detailShape(), { id: userId }],
    [PostResource.listShape(), { userId }],
  );
  // user as UserResource
  // posts as PostResource[]
}
```

## Sequential

```tsx
function PostWithAuthor() {
  const post = useResource(PostResource.detailShape(), { id });
  // post as PostResource
  const author = useResource(UserResource.detailShape(), {
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

  static listShape<T extends typeof Resource>(this: T) {
    return {
      ...super.listShape(),
      schema: { results: [this.asSchema()], nextPage: '', lastPage: '' },
    };
  }
}
```

```tsx
function ArticleList({ page }: { page: string }) {
  const { results: posts, nextPage, lastPage } = useResource(
    PaginatedPostResource.listShape(),
    { page },
  );
  // posts as PaginatedPostResource[]
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
