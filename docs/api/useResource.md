# useResource()

```typescript
function useResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(selectShape: ReadShape<Params, Body, S>, params: Params | null): SchemaOf<S>;
function useResource<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(...[selectShape: ReadShape<Params, Body, S>, params: Params | null]): SchemaOf<S>[];
```

Excellent for retrieving the data you need.

* Will fetch if the resource requested is not found in cache or resource is considered stale.
* Will always show what it has in cache even if its stale.
* When the resource is not yet loaded in cache it will yield to [React's Suspense](../getting-started/installation.md#2-add-suspense).
* Network errors are thrown to be [caught](../guides/network-errors.md) by [Error Boundaries](https://reactjs.org/docs/error-boundaries.html)


## Example

Single

```tsx
function Post({ id }: { id: number }) {
  const post = useResource(PostResource.singleRequest(), { id });
  // post as PostResource
}
```

List

```tsx
function Posts() {
  const posts = useResource(PostResource.listRequest(), {});
  // posts as PostResource[]
}
```

Parallel

```tsx
function Posts() {
  const [user, posts] = useResource(
    [UserResource.singleRequest(), { id: userId }],
    [PostResource.listRequest(), { userId }],
  );
  // user as UserResource
  // posts as PostResource[]
}
```

Sequential

```tsx
function PostWithAuthor() {
  const post = useResource(PostResource.singleRequest(), { id });
  // post as PostResource
  const author = useResource(UserResource.singleResource(), {
    id: post.userId,
  });
  // author as UserResource
}
```

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

* singleRequest()
* listRequest()

Feel free to add your own [RequestShape](./RequestShape.md) as well.

