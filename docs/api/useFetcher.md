# useFetcher()

```typescript
function useFetcher<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  requestShape: RequestShape<S, Params, Body>,
  throttle?: boolean = false
): (body: Body, params: Params) => Promise<any>;
```

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks (useRetrieve(), useCache(), useResource()). Using
it with a `ReadRequest` like `singleRequest()` can be done to force a refresh imperatively.

## throttle?: boolean = false

By default all calls force the fetch, however by calling with throttle=true identical
in-flight requests will be deduped.

## Example

```tsx
function CreatePost() {
  const create = useFetcher(PostResource.createRequest());
  // create as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => create(new FormData(e.target), {})}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useFetcher(PostResource.updateRequest());
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
  const del = useFetcher(PostResource.deleteRequest());
  // del as (body: any, params: Readonly<object>) => Promise<any>

  return (
    <div>
      <h3>{post.title}</h3>
      <button onClick={() => del({}, { id: post.id })}>X</button>
    </div>
  );
}
```

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- createRequest()
- updateRequest()
- partialUpdateRequest()
- deleteRequest()

Feel free to add your own [RequestShape](./RequestShape.md) as well.

## Notes

As this is the most basic hook to dispatch network requests with `rest-hooks` it will run through all normal fetch processing like updating
the normalized cache, etc.
