# useSelect()

```typescript
function useSelect<S extends RequestShape>(
  requestShape: S,
  params: ParamArg<S> | null,
): SelectReturn<S>;
```

Excellent to use data in the normalized cache without fetching.

Because of this it will not block rendering and instead return null
if the desired data is not found.

## Example

Using a type guard to deal with null

```tsx
function Post({ id }: { id: number }) {
  const post = useSelect(PostResource.singleRequest(), { id });
  // post as PostResource | null
  if (!post) return null;
  // post as PostResource (typeguarded)
  // ...render stuff here
}
```
