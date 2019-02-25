# useFetch()

```typescript
function useFetch<
  Params extends Readonly<object>,
  Body extends Readonly<object> | void,
  S extends Schema
>(
  selectShape: ReadShape<Params, Body, S>,
  params: Params | null,
  body?: Body
): Promise<any> | undefined;
```

Great for fetching imperatively.

Will return a Promise if the resource is not yet in cache, otherwise undefined.

This can be useful for ensuring resources early in a render tree before they are needed.

Network errors will result in the promise rejecting.

## Example

Using a type guard to deal with null

```tsx
function MasterPost({ id }: { id: number }) {
  useFetch(PostResource.singleRequest(), { id });
  // ...
}
```

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- singleRequest()
- listRequest()

Feel free to add your own [RequestShape](./RequestShape.md) as well.
