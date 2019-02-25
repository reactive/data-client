# useSelect()

```typescript
function useSelect<Params extends Readonly<object>, S extends Schema>(
  { select, getUrl }: ReadShape<Params, any, S>,
  params: Params | null
): SchemaOf<S> | null;
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

## Useful `RequestShape`s to send

[Resource](./Resource.md#provided-and-overridable-methods) provides these built-in:

- singleRequest()
- listRequest()

Feel free to add your own [RequestShape](./RequestShape.md) as well.
