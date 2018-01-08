# useFetch()

```typescript
function useFetch<S extends RequestShape>(
  selectShape: S,
  params: ParamArg<S> | null,
  body?: PayloadArg<S>,
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
