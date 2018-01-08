# useResultSelect()

```typescript
function useResultSelect<S extends RequestShape, D extends object>(
  requestShape: S,
  params: ParamArg<S> | null,
  defaults?: D
): D extends undefined ? Resolved<ReturnType<S['fetch']>> | null : Readonly<D>;
```

Excellent to use with pagination or any other extra (non-entity) data in results.

Because of this it will not block rendering and instead return null
if the desired data is not found.

## Example

By sending defaults we can destructure the values even if the results don't exist.

```tsx
function PostList() {
  const { prevPage, nextPage } = useResultSelect(
    PaginatedResource.listRequest(),
    {},
    { prevPage: '', nextPage: '' }
  );
  // ...render stuff here
}
```
