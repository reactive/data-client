---
title: useFetcher()
id: version-2.0-useFetcher
original_id: useFetcher
---
```typescript
function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  fetchShape: FetchShape<S, Params, Body>,
  throttle?: boolean = false
): (body: Body, params: Params) => Promise<any>;
```

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks (useRetrieve(), useCache(), useResource()). Using
it with a `ReadShape` like `detailShape()` can be done to force a refresh imperatively.

## throttle?: boolean = false

By default all calls force the fetch, however by calling with throttle=true identical
in-flight requests will be deduped.

## Example

```tsx
function CreatePost() {
  const create = useFetcher(PostResource.createShape());
  // create as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => create(new FormData(e.target), {})}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useFetcher(PostResource.updateShape());
  // update as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => update(new FormData(e.target), { id })}>
      {/* ... */}
    </form>
  );
}
```

```tsx
function PostListItem({ post }: { post: PostResource }) {
  const del = useFetcher(PostResource.deleteShape());
  // del as (body: any, params: Readonly<object>) => Promise<any>

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={() => del({}, { id: post.id })}>X</button>
    </div>
  );
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- createShape()
- updateShape()
- partialUpdateShape()
- deleteShape()

Feel free to add your own [FetchShape](./FetchShape.md) as well.

> ### Notes
>
> As this is the most basic hook to dispatch network requests with `rest-hooks` it will run through all normal fetch processing like updating
> the normalized cache, etc.
