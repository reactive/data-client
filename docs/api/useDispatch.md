# useDispatch()

```typescript
function useDispatch<S extends RequestShape>(
  requestShape: S,
  throttle?: boolean,
): (body: PayloadArg<S>, params: ParamArg<S>) => Promise<any>;
```

Mostly useful for imperatively triggering mutation effects.

However, this hook is actually used by the retrieval hooks. You can use also use it for imperatively triggering retrievals if you so desire.

## Example

```tsx
function CreatePost() {
  const create = useDispatch(PostResource.createRequest());
  // create as (body: Partial<PostResource>, params: object | void) => Promise<any>

  return (
    <form onSubmit={e => create(new FormData(e.target), {})}>{/* ... */}</form>
  );
}
```

```tsx
function UpdatePost({ id }: { id: string }) {
  const update = useDispatch(PostResource.updateRequest());
  // update as (body: Partial<PostResource>, params: object) => Promise<any>

  return (
    <form onSubmit={e => update(new FormData(e.target), { id })}>
      {/* ... */}
    </form>
  );
}
```

## Notes

As this is the most basic hook to dispatch network requests with `rest-hooks` it will run through all normal fetch processing like updating
the normalized cache, etc.
