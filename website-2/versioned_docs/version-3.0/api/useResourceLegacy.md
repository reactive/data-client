---
id: useresourcelegacy
title: useResourceLegacy()
original_id: useresourcelegacy
---

<!--DOCUSAURUS_CODE_TABS-->
<!--Type-->

```typescript
function useResourceLegacy(fetchShape: ReadShape, params: object | null):
  SchemaOf<typeof fetchShape.schema>;

function useResourceLegacy(...[fetchShape: ReadShape, params: object | null]):
  SchemaOf<typeof fetchShape.schema>[];
```

<!--With Generics-->

```typescript
function useResourceLegacy<
  Params extends Readonly<object>,
  S extends Schema
>(fetchShape: ReadShape<S, Params>, params: Params | null): SchemaOf<S>;

function useResourceLegacy<
  Params extends Readonly<object>,
  S extends Schema
>(...[fetchShape: ReadShape<S, Params>, params: Params | null]): SchemaOf<S>[];
```

<!--END_DOCUSAURUS_CODE_TABS-->

> ### Rest Hooks 3.1 - Removal
>
> This hook is deprecated in favor of [useResource()](./useresource)
>
> - 3.1 will remove `useResourceLegacy()`

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
  const post = useResourceLegacy(PostResource.detailShape(), { id });
  // post as PostResource
}
```

## List

```tsx
function Posts() {
  const posts = useResourceLegacy(PostResource.listShape(), {});
  // posts as PostResource[]
}
```

## Parallel

```tsx
function Posts() {
  const [user, posts] = useResourceLegacy(
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
  const post = useResourceLegacy(PostResource.detailShape(), { id });
  // post as PostResource
  const author = useResourceLegacy(UserResource.detailShape(), {
    id: post.userId,
  });
  // author as UserResource
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- detailShape()
- listShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
