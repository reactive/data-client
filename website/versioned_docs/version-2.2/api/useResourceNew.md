---
id: useresourcenew
title: useResourceNew()
original_id: useresourcenew
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useResourceNew(fetchShape: ReadShape, params: object | null):
  Denormalized<typeof fetchShape.schema>;

function useResourceNew(...[fetchShape: ReadShape, params: object | null]):
  Denormalized<typeof fetchShape.schema>[];
```

<!--With Generics-->

```typescript
function useResourceNew<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(fetchShape: ReadShape<S, Params, Body>, params: Params | null): Denormalized<S>;

function useResourceNew<
  Params extends Readonly<object>,
  Body extends Readonly<object | string> | void,
  S extends Schema
>(...[fetchShape: ReadShape<S, Params, Body>, params: Params | null]): Denormalized<S>[];
```

<!--END_DOCUSAURUS_CODE_TABS-->

> ### Rest Hooks 3.0
>
> This is the future default behavior of `useResource()` in version 3.0.
>
> - 3.0 will keep the legacy version as `useResourceLegacy()`
> - 3.1 will remove both `useResourceLegacy()` and `useResourceNew()`, leaving this behavior in `useResource()`

Excellent for retrieving the data you need.

Cache policy is [Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861) by default but also [configurable](https://resthooks.io/docs/guides/resource-lifetime).

- Triggers fetch:
  - On first-render and when parameters change
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
  const post = useResourceNew(PostResource.detailShape(), { id });
  // post as PostResource
}
```

## List

```tsx
function Posts() {
  const posts = useResourceNew(PostResource.listShape(), {});
  // posts as PostResource[]
}
```

## Parallel

```tsx
function Posts() {
  const [user, posts] = useResourceNew(
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
  const post = useResourceNew(PostResource.detailShape(), { id });
  // post as PostResource
  const author = useResourceNew(UserResource.detailShape(), {
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
      schema: { results: [this.getEntitySchema()], nextPage: '', lastPage: '' },
    };
  }
}
```

```tsx
function ArticleList({ page }: { page: string }) {
  const { results: posts, nextPage, lastPage } = useResourceNew(
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
