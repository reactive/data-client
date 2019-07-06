---
title: useRetrieve()
---
```typescript
function useRetrieve<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  selectShape: ReadShape<S, Params, Body>,
  params: Params | null,
  body?: Body
): Promise<any> | undefined;
```

Great for retrieving resources optimistically before they are needed.

Will return a Promise if the resource is not yet in cache, otherwise undefined.

This can be useful for ensuring resources early in a render tree before they are needed.

Network errors will result in the promise rejecting.

## Example

Using a type guard to deal with null

```tsx
function MasterPost({ id }: { id: number }) {
  useRetrieve(PostResource.singleRequest(), { id });
  // ...
}
```

## Useful `FetchShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- singleRequest()
- listRequest()

Feel free to add your own [FetchShape](./FetchShape.md) as well.
