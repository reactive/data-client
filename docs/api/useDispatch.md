# useDispatch()

```typescript
function useDispatch<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  requestShape: RequestShape<Params, Body, S>,
  throttle?: boolean
): (body: Body, params: Params) => Promise<any>;
```

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks (useFetch(), useCache(), useResource()). Using
it with a `ReadRequest` like `singleRequest()` can be done to force a refresh imperatively.

## Example

```tsx
function CreatePost() {
  const create = useDispatch(PostResource.createRequest());
  // create as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => create(new FormData(e.target), {})}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useDispatch(PostResource.updateRequest());
  // update as (body: Readonly<Partial<PostResource>>, params?: Readonly<object>) => Promise<any>

  return (
    <form onSubmit={e => update(new FormData(e.target), { id })}>
      {/* ... */}
    </form>
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
